#!/usr/bin/env python3
"""
Veelo — Gemini Image Server (FastAPI backend)
Uses Google Gemini for curtain visualization.

Recommended: run via ./run.sh (creates .venv, installs deps, starts server).

Manual setup:
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env   # then set GEMINI_API_KEY
    python3 server.py

Server: http://localhost:8000
"""

import base64, io, json, os, re, time, sys, uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ── Security constants ────────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB
# Magic-byte prefixes for common image formats the browser may produce.
# WebP: RIFF....WEBP — needs a two-part check (see validate_image_upload).
_IMAGE_MAGIC_PREFIXES = (
    b"\xff\xd8\xff",   # JPEG
    b"\x89PNG",        # PNG
    b"RIFF",           # WebP / other RIFF (narrowed below)
    b"\x00\x00\x00",   # HEIF/HEIC/MP4-family (ftyp box)
    b"GIF8",           # GIF
)
MAX_FIELD_LEN = 500   # max chars for any text form field

# ── Load .env ─────────────────────────────────────────────────────────────────
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
ADMIN_KEY      = os.environ.get("ADMIN_KEY", "")        # required for catalog write ops
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173,"
    "https://vickyisrael.co.il,https://www.vickyisrael.co.il,"
    "https://aesthetic-sable-0db379.netlify.app"
).split(",")
DEBUG = os.environ.get("DEBUG", "").lower() in ("1", "true", "yes")

# ── Dependency check ──────────────────────────────────────────────────────────
MISSING = []
try:
    from fastapi import FastAPI, Form, UploadFile, File, Request, HTTPException, Header
    from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
    from fastapi.staticfiles import StaticFiles
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
except ImportError:
    MISSING.append("fastapi uvicorn python-multipart")
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
except ImportError:
    MISSING.append("slowapi")
try:
    from google import genai
    from google.genai import types
    from PIL import Image
except ImportError:
    MISSING.append("google-genai Pillow")

if MISSING:
    print(f"❌  pip install {' '.join(MISSING)}")
    sys.exit(1)

if not GEMINI_API_KEY:
    print("❌  GEMINI_API_KEY not found.")
    print("    Add it to backend/.env:  GEMINI_API_KEY=your_key_here")
    print("    Get a free key at:   https://aistudio.google.com/apikey")
    sys.exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

# ── Upload validation helper ──────────────────────────────────────────────────
async def validate_image_upload(upload: UploadFile, field_name: str = "image") -> bytes:
    """
    Read upload, enforce size cap, then validate it is a real image.

    Strategy (defence in depth without over-restricting browser formats):
      1. Size cap — reject before any parsing.
      2. Magic-byte fast-path — pass known-good formats immediately.
      3. Pillow fallback — if bytes don't match a known magic prefix, try
         opening with Pillow; if it succeeds it's a real image, if it
         raises it's junk. This handles AVIF, TIFF, BMP, etc. without
         maintaining an exhaustive allowlist.
    """
    data = await upload.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{field_name}: file too large (max {MAX_UPLOAD_BYTES // 1_048_576} MB)"
        )
    # Fast-path: known magic prefixes (covers JPEG, PNG, WebP, HEIC, GIF)
    magic_ok = any(data[:len(pfx)] == pfx for pfx in _IMAGE_MAGIC_PREFIXES)
    if not magic_ok:
        # Fallback: let Pillow decide — it's the authoritative decoder we use anyway
        try:
            Image.open(io.BytesIO(data)).verify()
        except Exception:
            raise HTTPException(
                status_code=415,
                detail=f"{field_name}: file does not appear to be a valid image"
            )
    return data

# ── Admin auth helper ─────────────────────────────────────────────────────────
def require_admin(x_admin_key: Optional[str]) -> None:
    """Raise 401/403 if the request doesn't carry a valid admin key."""
    if not ADMIN_KEY:
        # If ADMIN_KEY isn't configured, block all writes rather than allow all —
        # fail secure. Operator must set ADMIN_KEY in .env to enable catalog edits.
        raise HTTPException(
            status_code=503,
            detail="Admin key not configured on server. Set ADMIN_KEY in .env."
        )
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

# ── Safe error response (no internal details in production) ──────────────────
def _err(e: Exception, status: int = 500) -> JSONResponse:
    import traceback; traceback.print_exc()
    msg = str(e) if DEBUG else "An internal error occurred"
    return JSONResponse({"error": msg}, status_code=status)

# Pinned model names in preference order — 3.1 first for best image quality.
# Override at runtime without touching code: set GEMINI_IMAGE_MODEL in .env
# To discover exact names available on your key:
#   python3 -c "
#     from google import genai; import os
#     c = genai.Client(api_key=os.environ['GEMINI_API_KEY'])
#     [print(m.name) for m in c.models.list() if 'image' in m.name.lower()]
#   "
_MODEL_CANDIDATES = [
    "gemini-3.1-flash-image",                      # 3.1 stable — best quality
    "gemini-3.1-flash-image-preview",              # 3.1 preview variant
    "gemini-2.5-flash-preview-image-generation",   # 2.5 preview fallback
    "gemini-2.0-flash-preview-image-generation",   # 2.0 preview fallback
    "gemini-2.0-flash-exp",                        # experimental (supports IMAGE modality)
]

def _resolve_model() -> str:
    """Return the first model that exists and supports generateContent.
    Set GEMINI_IMAGE_MODEL in .env to pin a specific name and skip resolution."""
    # Env override — useful when Google graduates a preview to a new stable name
    override = os.environ.get("GEMINI_IMAGE_MODEL", "").strip()
    if override:
        print(f"  📌  Image model pinned via env: {override}")
        return override

    try:
        all_models = list(client.models.list())
        available = {m.name.split("/")[-1] for m in all_models}

        # 1. Prefer an exact pinned name
        for candidate in _MODEL_CANDIDATES:
            if candidate in available:
                print(f"  ✅  Resolved image model: {candidate}")
                return candidate

        # 2. Fuzzy fallback: any model whose name contains both 'flash' and 'image'
        image_models = sorted(
            [name for name in available if "flash" in name and "image" in name],
            reverse=True,   # lexicographic desc → higher version numbers first
        )
        if image_models:
            chosen = image_models[0]
            print(f"  ⚠️  No pinned model matched. Auto-selected: {chosen}")
            print(f"       Available image models: {image_models}")
            return chosen

        print(f"  ❌  No image-capable model found. Available models:")
        for name in sorted(available):
            print(f"       {name}")
        raise RuntimeError(
            "No Gemini image-generation model found. "
            "Set GEMINI_IMAGE_MODEL=<name> in .env or update _MODEL_CANDIDATES."
        )
    except RuntimeError:
        raise
    except Exception as e:
        print(f"  ⚠️  list_models failed ({e}). Falling back to first candidate.")
    return _MODEL_CANDIDATES[0]

MODEL_NAME = _resolve_model()

SCRIPT_DIR  = Path(__file__).parent
CATALOG_DIR = SCRIPT_DIR / "catalog"

# ── Paths ─────────────────────────────────────────────────────────────────────

# ── Prompts per curtain style ─────────────────────────────────────────────────
STYLE_PROMPTS = {
    "eyelet": (
        "Hang eyelet (grommet) curtains on a metal rod across the full width of the window. "
        "The rings sit on the rod; the fabric falls in deep, even cylindrical folds from each eyelet. "
        "The curtain panels should be open (parted to the sides), revealing the window, with "
        "generous fabric pooling or just skimming the floor."
    ),
    "pleated": (
        "Install pinch-pleated curtains on a hidden track across the full window width. "
        "Create crisp, structured triple-pinch pleats at regular intervals at the header, "
        "with soft uniform folds cascading vertically to the floor. "
        "Panels are open, framing the window on both sides."
    ),
    "roman": (
        "Fit a Roman blind inside or just above the window frame. "
        "The blind is lowered halfway, showing neat horizontal folds stacking evenly from the "
        "bottom up — flat sections between each fold, clean structured look. "
        "No side panels; the blind covers the upper portion of the window."
    ),
    "roller": (
        "Fit a roller blind mounted just above the window frame. "
        "The blind is partially rolled down — covering the upper two-thirds of the window — "
        "with a perfectly straight, taut bottom edge and no folds or creases. "
        "Clean, minimal, contemporary look."
    ),
}

PROMPT_BASE = (
    "You are a professional interior visualizer. "
    "Task: add window treatment to the room photo exactly as described. "
    "\n\nFABRIC: Study the second image (fabric swatch) carefully. "
    "Reproduce its exact colour, weave texture, pattern repeat, and sheen in the curtain. "
    "Do not invent colours or textures that are not in the swatch. "
    "\n\nROOM PRESERVATION — critical rules:\n"
    "• Every wall, floor, ceiling, piece of furniture, and decorative object must remain "
    "pixel-perfect identical to the original photo.\n"
    "• The lighting, shadows, and reflections on all existing surfaces must not change.\n"
    "• Do not move, resize, or recolour anything outside the window treatment area.\n"
    "• Do not add or remove any objects from the scene.\n"
    "\n\nOUTPUT: Return the complete room image at the same framing, crop, and perspective "
    "as the input. Do not zoom, pan, or add letterboxing."
)

# ── Prompt helpers (ported from POC index.html) ───────────────────────────────

def _pixels_to_pct(points, img_w, img_h):
    """Convert [{x,y}] pixel coords → [{x_pct,y_pct}] percentages (may be <0 or >100)."""
    return [
        {"x_pct": round(p["x"] / img_w * 100, 1), "y_pct": round(p["y"] / img_h * 100, 1)}
        for p in points
    ]


def _normalize_quad(points):
    """
    Given 4 points in ANY click order, return them sorted as [TL, TR, BR, BL].
    Uses centroid to classify each point by quadrant.
    """
    if len(points) != 4:
        return points
    cx = sum(p["x_pct"] for p in points) / 4
    cy = sum(p["y_pct"] for p in points) / 4
    tl = min((p for p in points if p["x_pct"] <= cx and p["y_pct"] <= cy), key=lambda p: p["x_pct"] + p["y_pct"], default=None)
    tr = min((p for p in points if p["x_pct"] >  cx and p["y_pct"] <= cy), key=lambda p: -p["x_pct"] + p["y_pct"], default=None)
    br = max((p for p in points if p["x_pct"] >  cx and p["y_pct"] >  cy), key=lambda p: p["x_pct"] + p["y_pct"], default=None)
    bl = max((p for p in points if p["x_pct"] <= cx and p["y_pct"] >  cy), key=lambda p: -p["x_pct"] + p["y_pct"], default=None)
    # Fallback: sort by angle around centroid if quadrant bins are ambiguous
    if None in (tl, tr, br, bl):
        import math
        ordered = sorted(points, key=lambda p: math.atan2(p["y_pct"] - cy, p["x_pct"] - cx))
        # atan2 goes CCW from east; remap to clockwise TL→TR→BR→BL
        # Clockwise from top-left: top-left is roughly -3π/4
        ordered = sorted(points, key=lambda p: (math.atan2(p["y_pct"] - cy, p["x_pct"] - cx) - math.pi / 2) % (2 * math.pi))
        # After sorting CW from top: order is TL, TR, BR, BL
        tl, tr, br, bl = ordered[3], ordered[0], ordered[1], ordered[2]
    return [tl, tr, br, bl]


def _cz_to_verbal_desc(z, w, r, curtain_type, cz_width_cm, cz_height_cm):
    """
    Port of czToVerbalDesc() from the POC.
    z   : [{x_pct,y_pct}] × 4 — curtain zone corners [A=TL, B=TR, C=BR, D=BL]
    w   : analysis['window']
    r   : analysis['room']
    """
    parts = []
    width_cm  = float(cz_width_cm)  if cz_width_cm  else 0.0
    height_cm = float(cz_height_cm) if cz_height_cm else 0.0
    win_h     = height_cm  # curtain height used as proxy for window height scale

    # ── Physical dimensions ──────────────────────────────────────────────────
    if width_cm and height_cm:
        parts.append(
            f"The curtain panel measures approximately {int(width_cm)} cm wide "
            f"and {int(height_cm)} cm in total drop."
        )
    elif width_cm:
        parts.append(f"The curtain panel is approximately {int(width_cm)} cm wide.")
    elif height_cm:
        parts.append(f"The curtain panel has a total drop of approximately {int(height_cm)} cm.")

    # ── Horizontal placement ─────────────────────────────────────────────────
    left_pct  = (z[0]["x_pct"] + z[3]["x_pct"]) / 2  # A + D  (left edge avg)
    right_pct = (z[1]["x_pct"] + z[2]["x_pct"]) / 2  # B + C  (right edge avg)

    if left_pct < 0:
        parts.append("The curtain starts beyond the left edge of the photo.")
    else:
        suffix = ", nearly at the left photo edge" if left_pct < 5 else ""
        parts.append(f"The curtain starts at the left side of the window{suffix}.")

    if right_pct > 100:
        parts.append("The curtain extends beyond the right edge of the photo.")
    else:
        suffix = ", nearly at the right photo edge" if right_pct > 95 else ""
        parts.append(f"The curtain ends at the right side of the window{suffix}.")

    # ── Top / mounting position ──────────────────────────────────────────────
    top_pct        = (z[0]["y_pct"] + z[1]["y_pct"]) / 2   # A + B
    win_height_pct = w.get("height_pct")
    cm_per_pct     = (win_h / win_height_pct) if (win_h and win_height_pct) else None
    ceil_visible   = r.get("ceiling_visible", False)
    win_top_pct    = w.get("top_pct") or 50

    if curtain_type == "pleated":
        if ceil_visible and top_pct > 0 and cm_per_pct:
            from_ceil_cm = round(top_pct * cm_per_pct)
            if from_ceil_cm < 10:
                parts.append(
                    "The ceiling track runs along the ceiling. "
                    "The curtain hangs from the ceiling all the way down."
                )
            else:
                parts.append(
                    f"The ceiling track is installed at the ceiling. "
                    f"The curtain fabric begins approximately {from_ceil_cm} cm below the ceiling "
                    f"(just above the window frame)."
                )
        elif top_pct < 0 or (ceil_visible and top_pct < 5):
            parts.append(
                "The ceiling track runs along the ceiling. "
                "The curtain hangs from the ceiling all the way down."
            )
        else:
            parts.append(
                "The ceiling track is installed above the window. "
                "The curtain hangs from the track down to the floor."
            )

    elif curtain_type in ("roman", "roller"):
        hw = "Roman shade bracket" if curtain_type == "roman" else "roller tube"
        if top_pct < 0:
            parts.append(f"The {hw} is mounted above the visible photo frame.")
        elif top_pct < win_top_pct - 3:
            gap_cm = round((win_top_pct - top_pct) * cm_per_pct) if cm_per_pct else None
            if gap_cm:
                parts.append(f"The {hw} is mounted approximately {gap_cm} cm above the window frame.")
            else:
                parts.append(f"The {hw} is mounted above the window frame.")
        else:
            parts.append(f"The {hw} is mounted at the top of the window frame.")

    else:  # eyelet or unspecified — rod follows zone top
        hw = "curtain rod"
        if top_pct < 0:
            above_cm = round(abs(top_pct) * cm_per_pct) if cm_per_pct else None
            if above_cm:
                parts.append(
                    f"The {hw} is mounted approximately {above_cm} cm above the top edge of the photo "
                    f"— not visible in the image."
                )
            else:
                parts.append(f"The {hw} is above the visible photo frame — not visible in the image.")
        elif ceil_visible and top_pct < win_top_pct:
            from_ceil_cm = round(top_pct * cm_per_pct) if cm_per_pct else None
            if from_ceil_cm is not None and from_ceil_cm < 8:
                parts.append(f"The {hw} is mounted at ceiling level.")
            elif from_ceil_cm is not None:
                parts.append(f"The {hw} is mounted approximately {from_ceil_cm} cm below the ceiling.")
            else:
                parts.append(f"The {hw} is mounted between the ceiling and the window frame.")
        elif top_pct < win_top_pct - 3:
            gap_cm = round((win_top_pct - top_pct) * cm_per_pct) if cm_per_pct else None
            if gap_cm:
                parts.append(f"The {hw} is mounted approximately {gap_cm} cm above the top of the window frame.")
            else:
                parts.append(f"The {hw} is mounted above the window frame.")
        else:
            parts.append(f"The {hw} is mounted at the top of the window frame.")

    # ── Bottom / curtain drop — always relative to the window first ──────────
    bottom_pct    = (z[2]["y_pct"] + z[3]["y_pct"]) / 2   # C + D
    win_bottom_pct = (w.get("top_pct") or 0) + (w.get("height_pct") or 0)
    below_win_pct = bottom_pct - win_bottom_pct
    floor_visible = r.get("floor_visible", False)
    floor_gap_pct = w.get("floor_gap_pct")
    floor_pct     = (win_bottom_pct + (floor_gap_pct or 0)) if floor_visible else None
    near_floor    = (floor_pct is not None) and abs(bottom_pct - floor_pct) < 5

    if bottom_pct > 100:
        parts.append(
            "The curtain extends below the visible photo frame — "
            "it reaches all the way to the floor beyond the visible edge."
        )
    elif near_floor:
        parts.append("The curtain reaches down to the floor.")
    elif abs(below_win_pct) <= 5:
        if cm_per_pct:
            win_cm = round((w.get("height_pct") or 0) * cm_per_pct)
            parts.append(
                f"The curtain ends at the bottom of the window frame "
                f"(approximately {win_cm} cm of curtain). "
                f"It does NOT extend below the window — stop the curtain at the window sill."
            )
        else:
            parts.append(
                "The curtain ends at the bottom of the window frame. "
                "It does NOT extend below the window — stop the curtain at the window sill."
            )
    elif below_win_pct > 5:
        if cm_per_pct:
            below_cm = round(below_win_pct * cm_per_pct)
            parts.append(f"The curtain extends approximately {below_cm} cm below the bottom of the window frame.")
        else:
            parts.append("The curtain extends somewhat below the window sill.")
        if floor_pct is not None and (floor_pct - bottom_pct) > 10:
            above_floor_cm = round((floor_pct - bottom_pct) * cm_per_pct) if cm_per_pct else None
            if above_floor_cm:
                parts.append(f"It stops approximately {above_floor_cm} cm above the floor. Do NOT extend the curtain to the floor.")
            else:
                parts.append("It does NOT reach the floor — stop the curtain at the marked position.")
        elif not floor_visible:
            parts.append("The floor is not visible — do NOT extend the curtain beyond this point.")
    else:
        # Zone bottom above window bottom (short curtain / unusual)
        if cm_per_pct:
            above_win_cm = round(abs(below_win_pct) * cm_per_pct)
            parts.append(
                f"The curtain ends approximately {above_win_cm} cm above the bottom of the window frame "
                f"— it is a short curtain that does not cover the full window height."
            )
        else:
            parts.append("The curtain ends above the bottom of the window frame — it is shorter than the window height.")

    # ── Perspective ──────────────────────────────────────────────────────────
    persp = r.get("perspective", "")
    if persp and persp != "straight-on":
        parts.append(f"Render the curtain with correct {persp} perspective to match the room angle.")

    return " ".join(parts)


def _build_prompt_from_analysis(
    a,
    img_w, img_h,
    window_pts_px,   # [{x,y}] × 4 | []
    curtain_zone_px, # [{x,y}] × 4 | None
    curtain_type,
    cz_width_cm,
    cz_height_cm,
):
    """
    Port of the POC's buildPromptFromAnalysis() + generate() prompt assembler.
    Builds a rich, spatially-accurate generation prompt from all available context.
    """
    w = a.get("window", {})
    r = a.get("room",   {})
    parts = []
    other = r.get("other_windows") or 0

    # ── 1. WINDOW TARGETING — always first, hard constraint ──────────────────
    # This must come before any curtain description so the model commits to the
    # correct window before processing placement/style instructions.
    win_desc = w.get("description") or "the window"

    if len(window_pts_px) == 4:
        corners_pct = _pixels_to_pct(window_pts_px, img_w, img_h)
        # Label corners by direction so the model can orient itself spatially
        labels = ["top-left", "top-right", "bottom-right", "bottom-left"]
        corners_str = ", ".join(
            f"{labels[i]}: ({p['x_pct']}%, {p['y_pct']}%)"
            for i, p in enumerate(corners_pct)
        )
        parts.append(
            f"TARGET WINDOW: Add the curtain treatment ONLY to the {win_desc}, "
            f"whose four corners are at {corners_str} (as % of image width × height). "
            f"This is the ONLY window that should receive any curtain."
        )
        if other > 0:
            noun = "window" if other == 1 else "windows"
            parts.append(
                f"IMPORTANT: There {'is' if other == 1 else 'are'} {other} other {noun} visible "
                f"in the photo. Do NOT add any curtain, fabric, or treatment to "
                f"{'it' if other == 1 else 'them'}. "
                f"{'It' if other == 1 else 'They'} must remain pixel-perfect identical to the original."
            )
    else:
        parts.append(f"Add curtains to the {win_desc}.")

    # ── 2. Curtain type — brief style anchor
    curtain_type_anchors = {
        "pleated": "Use pleated curtains on a ceiling track — neat, evenly-spaced pleats hanging from a track with no visible rod.",
        "eyelet":  "Use eyelet curtains — fabric threaded through large metal rings along the top, creating soft wave-like folds hanging from a visible rod.",
        "roman":   "Use a Roman shade — flat fabric that folds into neat horizontal panels when raised, and hangs completely smooth and flat when lowered.",
        "roller":  "Use a roller shade — fabric rolls onto a cylinder at the top, completely flat with no folds or pleats, minimal and clean.",
    }
    if curtain_type in curtain_type_anchors:
        parts.append(curtain_type_anchors[curtain_type])

    # 4. Fabric
    parts.append("Use the exact fabric texture, color, and pattern from the fabric reference image.")

    # 5. Height guidance — only when no curtain zone (zone owns the drop geometry)
    floor_seen = r.get("floor_visible") is True
    ceil_seen  = r.get("ceiling_visible") is True

    if not curtain_zone_px:
        if not ceil_seen:
            parts.append(
                "The ceiling is not visible — the curtain starts at the top of the window frame. "
                "Do not extend the curtain above the window."
            )
        if cz_height_cm:
            parts.append(f"The curtain covers a height of {cz_height_cm} cm — it ends at the bottom of the window frame.")
        elif w.get("reaches_floor") and floor_seen:
            parts.append("The window reaches the floor — the curtain touches the floor.")
        elif floor_seen and (w.get("floor_gap_pct") or 0) > 0:
            parts.append(
                f"The floor is visible. The curtain extends from the window down to the floor, "
                f"covering the {w['floor_gap_pct']}% gap between the window bottom and the floor."
            )
        elif not floor_seen:
            parts.append(
                "The floor is not visible in this image — the curtain covers only the window height, "
                "ending at or just below the window sill. Do NOT extend the curtain below the visible area."
            )
        else:
            parts.append("The curtain covers the full height of the window.")

    # 6. Perspective
    persp = r.get("perspective", "")
    if persp and persp != "straight-on":
        parts.append(
            f"The photo is taken at a {persp} angle — "
            f"render the curtain folds with correct perspective to match."
        )

    # 7. Obstructions
    obs = (r.get("obstructions") or "").strip()
    if obs and obs.lower() not in ("none", "none."):
        parts.append(f"Note: {obs} — account for this when placing the curtain.")

    # 8. Curtain zone — full spatial description from geometry
    if curtain_zone_px:
        z_pct   = _normalize_quad(_pixels_to_pct(curtain_zone_px, img_w, img_h))
        cz_desc = _cz_to_verbal_desc(z_pct, w, r, curtain_type, cz_width_cm, cz_height_cm)
        parts.append(cz_desc)

    # 9. Natural folds + room preservation
    parts.append(
        "Natural folds and draping. Keep everything else — walls, floor, furniture, lighting — "
        "exactly the same. Output the full room image at the same dimensions and framing as the input."
    )

    # 10. Detailed curtain type description (reinforces rendering style)
    curtain_type_detail = {
        "pleated": (
            "Use pleated curtains mounted on a ceiling track. The curtain hangs in neat, "
            "evenly-spaced pleats from a track fixed to the ceiling or wall. No visible rod."
        ),
        "eyelet": (
            "Use eyelet curtains on a rod. The fabric feeds through large metal rings punched "
            "along the top, creating soft wave-like folds hanging from a visible curtain rod."
        ),
        "roman": (
            "Use a Roman shade. The fabric folds into flat, horizontal panels stacked neatly "
            "when raised, and hangs flat and smooth when lowered. "
            "Mounted inside or above the window frame."
        ),
        "roller": (
            "Use a roller shade. The fabric rolls up onto a cylindrical tube at the top of the window. "
            "Clean, minimal appearance — completely flat with no folds or pleats."
        ),
    }
    if curtain_type in curtain_type_detail:
        parts.append(curtain_type_detail[curtain_type])

    # 11. Final disambiguation reminder — repeat at the end so it's the last thing the model reads
    if other > 0 and len(window_pts_px) == 4:
        corners_pct = _pixels_to_pct(window_pts_px, img_w, img_h)
        labels = ["top-left", "top-right", "bottom-right", "bottom-left"]
        corners_reminder = ", ".join(
            f"{labels[i]}: ({p['x_pct']}%, {p['y_pct']}%)"
            for i, p in enumerate(corners_pct)
        )
        noun = "window" if other == 1 else "windows"
        parts.append(
            f"FINAL REMINDER: Apply the curtain treatment ONLY to the window at {corners_reminder}. "
            f"The {other} other {noun} in the scene must remain completely untouched — "
            f"no curtain, no fabric, no change of any kind."
        )

    return " ".join(parts)


# ── App ───────────────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

SWATCHES_DIR = CATALOG_DIR / "swatches"
SWATCHES_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/")
def index():
    return {"service": "Veelo API", "status": "ok", "model": MODEL_NAME}

@app.get("/debug/catalog")
def debug_catalog():
    """Dev diagnostic: shows catalog path and product count. Safe to leave public."""
    f = CATALOG_DIR / "products.json"
    try:
        products = json.loads(f.read_text("utf-8")) if f.exists() else []
        count = len(products)
    except Exception as e:
        count = f"error: {e}"
    return {
        "catalog_dir": str(CATALOG_DIR),
        "products_json": str(f),
        "exists": f.exists(),
        "product_count": count,
        "script_dir": str(SCRIPT_DIR),
    }

# ── Catalog — read ────────────────────────────────────────────────────────────
def _read_catalog():
    f = CATALOG_DIR / "products.json"
    return json.loads(f.read_text("utf-8")) if f.exists() else []

def _write_catalog(products):
    f = CATALOG_DIR / "products.json"
    f.write_text(json.dumps(products, ensure_ascii=False, indent=2), "utf-8")

@app.get("/catalog/swatches/{filename}")
def get_swatch(filename: str):
    """Serve swatch images — plain GET route, no StaticFiles mount conflicts."""
    # Guard against path traversal: only simple filenames (no slashes or dots leading up)
    if not re.fullmatch(r"[A-Za-z0-9_\-]+\.[a-z]{2,5}", filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    f = (SWATCHES_DIR / filename).resolve()
    # Ensure the resolved path is still inside SWATCHES_DIR
    if not str(f).startswith(str(SWATCHES_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not f.exists():
        raise HTTPException(status_code=404, detail=f"Swatch not found")
    return FileResponse(str(f))

@app.get("/catalog")
def catalog_list(type: Optional[str] = None):
    """Return all products, optionally filtered by curtain type."""
    try:
        products = _read_catalog()
        if type:
            products = [p for p in products if p.get("type") == type]
        return JSONResponse(content=products)
    except Exception as e:
        return _err(e)

# ── Catalog — add ─────────────────────────────────────────────────────────────
@app.post("/catalog/products")
async def catalog_add(
    swatch:        UploadFile       = File(...),
    name:          str              = Form(...),
    collection:    str              = Form(...),
    type:          str              = Form(...),
    density:       str              = Form("medium"),
    price_per_m:   str              = Form(...),
    description:   str              = Form(""),
    color_hex:     str              = Form("#888888"),
    in_stock:      str              = Form("true"),
    lead_days:     str              = Form("7"),
    currency:      str              = Form("ILS"),
    x_admin_key:   Optional[str]    = Header(None),
):
    require_admin(x_admin_key)
    # Enforce field length caps
    for field_val, field_name in [(name, "name"), (collection, "collection"), (description, "description")]:
        if len(field_val) > MAX_FIELD_LEN:
            raise HTTPException(status_code=400, detail=f"{field_name} exceeds maximum length")
    # Validate curtain type
    if type not in STYLE_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Invalid curtain type '{type}'")
    try:
        # Build a slug id from name
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        product_id = f"{slug}-{type}"

        # Coerce types safely
        price_float   = float(price_per_m)
        lead_int      = int(lead_days)
        in_stock_bool = in_stock.lower() not in ("false", "0", "no", "off")

        # Save swatch image — guard against None filename
        raw_name = swatch.filename or ""
        ext = Path(raw_name).suffix if raw_name else ""
        ext = ext if ext else ".jpg"
        swatch_filename = f"{slug}{ext}"
        SWATCHES_DIR.mkdir(parents=True, exist_ok=True)
        (SWATCHES_DIR / swatch_filename).write_bytes(await swatch.read())

        new_product = {
            "id":           product_id,
            "name":         name,
            "collection":   collection,
            "type":         type,
            "density":      density,
            "price_per_m":  price_float,
            "currency":     currency,
            "swatch_path":  f"/catalog/swatches/{swatch_filename}",
            "color_hex":    color_hex,
            "description":  description,
            "in_stock":     in_stock_bool,
            "lead_days":    lead_int,
        }

        products = _read_catalog()
        ids = [p["id"] for p in products]
        if product_id in ids:
            products[ids.index(product_id)] = new_product
        else:
            products.insert(0, new_product)
        _write_catalog(products)

        print(f"  ✅  Added fabric: {name} ({type})")
        return JSONResponse(content=new_product, status_code=201)

    except HTTPException:
        raise
    except Exception as e:
        return _err(e)

# ── Catalog — delete ──────────────────────────────────────────────────────────
@app.delete("/catalog/products/{product_id}")
def catalog_delete(product_id: str, x_admin_key: Optional[str] = Header(None)):
    require_admin(x_admin_key)
    try:
        products = _read_catalog()
        target = next((p for p in products if p["id"] == product_id), None)
        if not target:
            return JSONResponse({"error": "not found"}, status_code=404)

        # Remove swatch file if it exists
        swatch_file = SWATCHES_DIR / Path(target.get("swatch_path", "")).name
        if swatch_file.exists():
            swatch_file.unlink()

        _write_catalog([p for p in products if p["id"] != product_id])
        print(f"  🗑️  Deleted fabric: {product_id}")
        return JSONResponse({"ok": True})
    except HTTPException:
        raise
    except Exception as e:
        return _err(e)

TEXT_MODEL = "gemini-2.5-flash"   # fast text model for analysis

ANALYSIS_PROMPT = """You are a computer vision assistant for a curtain visualization app.
Analyze this room photo and return ONLY a valid JSON object — no markdown, no explanation.

STEP 1 — EDGE INSPECTION (reason through this before filling any field):
  TOP edge:    Does the very top row of pixels show a ceiling surface (plaster, tiles, beams)?
               If yes → ceiling_visible = true. If it shows wall, window frame, or sky → false.
  BOTTOM edge: Does the very bottom row of pixels show a floor surface (wood, tiles, carpet, rug)?
               If yes → floor_visible = true. If it shows wall, baseboard, window sill, or nothing → false.
  LEFT/RIGHT:  Is the window cut off at the sides? Does the scene look cropped or zoomed in?

STEP 2 — CLOSE-UP DETECTION:
  close_up = true if ANY of these apply:
    • The floor is not visible (bottom of frame is wall, sill, or baseboard — not floor material)
    • The ceiling is not visible (top of frame is wall or window, not ceiling material)
    • The window fills more than 60% of the image height

CRITICAL RULES:
  • floor_visible = true ONLY if you can see actual floor material (wood planks, tiles, carpet, etc.)
    at the BOTTOM of the image. A wall, baseboard, or windowsill is NOT floor.
  • ceiling_visible = true ONLY if you can see actual ceiling surface at the TOP of the image.
    A wall above the window is NOT ceiling.
  • floor_gap_pct must be null whenever floor_visible is false. Never estimate it.
  • reaches_floor = true ONLY if the window bottom edge is at the same level as the visible floor.
  • Do NOT infer or assume anything outside the image frame.

{selection_context}

JSON schema (fill every field):
{{
  "window": {{
    "description":    "plain-language location, e.g. 'large arched window, center of wall'",
    "width_pct":      <width as % of image width, integer>,
    "height_pct":     <height as % of image height, integer>,
    "top_pct":        <distance from top of image to window top, integer>,
    "reaches_floor":  <true ONLY if window bottom is at floor level — otherwise false>,
    "floor_gap_pct":  <% of image height from window bottom to visible floor — null if floor not visible>
  }},
  "room": {{
    "close_up":         <true if floor OR ceiling is not visible, or window fills >60% height>,
    "perspective":      "straight-on | angled-left | angled-right | wide-angle | overhead",
    "floor_visible":    <true ONLY if actual floor material is visible at bottom of image>,
    "ceiling_visible":  <true ONLY if actual ceiling surface is visible at top of image>,
    "other_windows":    <count of OTHER windows visible, integer>,
    "lighting":         "description of light direction, intensity, natural/artificial",
    "obstructions":     "furniture or objects near the window that affect curtain placement, or 'none'"
  }},
  "curtain": {{
    "recommended_length": "window-height (if floor not visible) | sill-length | below-sill | floor-length (ONLY if floor is actually visible)",
    "recommended_style":  "e.g. 'split panel', 'single panel', 'roman blind'",
    "length_reasoning":   "Explain WHY this length: what is visible in the image that informs the recommendation. If floor is not visible, the curtain should only cover the window — never assume floor-length.",
    "challenges":         "perspective notes, close-up limitations, or placement concerns"
  }}
}}"""

@app.post("/analyze")
@limiter.limit("20/hour")
async def analyze(
    request:      Request,
    room_image:   UploadFile = File(...),
    selection:    str        = Form(None),   # JSON: [{x,y},...] × 4 pixel coords
    curtain_zone: str        = Form(None),   # JSON: [{x,y},...] × 4 pixel coords
):
    t0 = time.time()
    try:
        room_bytes = await validate_image_upload(room_image, "room_image")
        room_pil   = Image.open(io.BytesIO(room_bytes)).convert("RGB")
        img_w, img_h = room_pil.size

        # Downscale for analysis (text model, no need for full res)
        rw, rh = room_pil.size
        sc = min(1024 / rw, 1024 / rh, 1.0)
        analysis_img = room_pil.resize((round(rw*sc), round(rh*sc)), Image.LANCZOS)

        def pil_to_bytes(img, fmt="JPEG"):
            buf = io.BytesIO(); img.save(buf, format=fmt); return buf.getvalue()

        sel_context = ""
        if selection:
            try:
                pts_px  = json.loads(selection)
                pts_pct = _pixels_to_pct(pts_px, img_w, img_h)
                corners_str = ", ".join(
                    f"corner {i+1}: ({p['x_pct']}%, {p['y_pct']}%)"
                    for i, p in enumerate(pts_pct)
                )
                sel_context = (
                    f"The user has marked a specific window with these four corners "
                    f"(as % of image width/height): {corners_str}. "
                    "Base your window analysis on this window."
                )
            except Exception:
                pass

        if curtain_zone:
            try:
                cz_px  = json.loads(curtain_zone)   # [{x,y},...] pixel coords
                cz_pct = _pixels_to_pct(cz_px, img_w, img_h)
                labels  = ['A(top-left)', 'B(top-right)', 'C(bottom-right)', 'D(bottom-left)']
                pts_str = ', '.join(
                    f"{labels[i]}: ({p['x_pct']}%, {p['y_pct']}%)"
                    for i, p in enumerate(cz_pct)
                )
                cz_desc = (
                    f" The user has defined a curtain boundary as a perspective quadrilateral: {pts_str}. "
                    f"Values outside 0–100 extend beyond the photo edge. "
                    f"Reference this boundary in your curtain recommendations — "
                    f"note the perspective shape and whether corners are above/below/outside the frame."
                )
                sel_context += cz_desc
            except Exception:
                pass

        prompt = ANALYSIS_PROMPT.format(selection_context=sel_context)

        response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=[
                types.Part.from_bytes(data=pil_to_bytes(analysis_img), mime_type="image/jpeg"),
                types.Part.from_text(text=prompt),
            ],
        )

        raw = response.text.strip()
        # Strip markdown code fences if present
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        analysis = json.loads(raw)

        print(f"  🔍 Analysis done in {round(time.time()-t0,1)}s")
        return JSONResponse({"ok": True, "analysis": analysis})

    except HTTPException:
        raise
    except Exception as e:
        return _err(e)

@app.get("/status")
def status():
    return {"model": MODEL_NAME, "ready": True}

# ── Saves — persist a visualisation the user marked as favourite ──────────────
SAVES_DIR = SCRIPT_DIR / "saves"
SAVES_DIR.mkdir(parents=True, exist_ok=True)

@app.post("/saves")
async def save_result(
    image:        UploadFile = File(...),
    fabric_name:  str = Form(""),
    fabric_id:    str = Form(""),
    curtain_type: str = Form(""),
):
    save_id  = uuid.uuid4().hex[:12]
    save_dir = SAVES_DIR / save_id
    save_dir.mkdir(parents=True, exist_ok=True)

    img_bytes = await image.read()
    (save_dir / "simulation.png").write_bytes(img_bytes)

    now_ts = int(datetime.now(timezone.utc).timestamp())
    meta = {
        "id":           save_id,
        "fabric_name":  fabric_name,
        "fabric_id":    fabric_id,
        "curtain_type": curtain_type,
        "created_at":   now_ts,                        # Unix timestamp for frontend formatRelative()
        "path":         f"/saves/{save_id}/image",     # URL the browser can load
    }
    (save_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False))
    return {"ok": True, "id": save_id}

@app.get("/saves/{save_id}/image")
def get_save_image(save_id: str):
    """Serve the PNG for a saved visualisation."""
    if not re.fullmatch(r"[0-9a-f]{12}", save_id):
        raise HTTPException(status_code=400, detail="Invalid save id")
    img_path = (SAVES_DIR / save_id / "simulation.png").resolve()
    if not str(img_path).startswith(str(SAVES_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid save id")
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Save not found")
    return FileResponse(str(img_path), media_type="image/png")

@app.get("/saves")
def list_saves():
    """Return all saved visualisations (meta only, no image bytes)."""
    saves = []
    for d in sorted(SAVES_DIR.iterdir(), reverse=True):
        meta_file = d / "meta.json"
        if d.is_dir() and meta_file.exists():
            try:
                meta = json.loads(meta_file.read_text())
                # Back-fill path for saves written before this fix
                if "path" not in meta:
                    meta["path"] = f"/saves/{d.name}/image"
                saves.append(meta)
            except Exception:
                pass
    return saves

@app.delete("/saves/{save_id}")
def delete_save(save_id: str):
    """Delete a saved visualisation (image + meta)."""
    import shutil
    from fastapi import HTTPException
    # Sanitise: only hex chars allowed in save_id
    if not re.fullmatch(r"[0-9a-f]{12}", save_id):
        raise HTTPException(status_code=400, detail="Invalid save id")
    save_dir = SAVES_DIR / save_id
    if not save_dir.exists():
        raise HTTPException(status_code=404, detail="Save not found")
    shutil.rmtree(save_dir)
    return {"ok": True}

@app.post("/generate")
@limiter.limit("10/hour")
async def generate(
    request:       Request,
    room_image:    UploadFile = File(...),
    fabric_id:     str = Form(""),       # look up swatch on disk — no client re-upload
    curtain_type:  str = Form(""),
    cz_width_cm:   str = Form(""),
    cz_height_cm:  str = Form(""),
    window_points: str = Form(None),
    curtain_zone:  str = Form(None),
    analysis_json: str = Form(None),
    prompt:        str = Form(None),
    dry_run:       str = Form(""),       # "1" → return prompt JSON without calling Gemini
):
    from fastapi.responses import Response as FastAPIResponse
    t0 = time.time()
    try:
        # ── Load room image ───────────────────────────────────────────────────
        room_bytes = await validate_image_upload(room_image, "room_image")
        try:
            room_pil = Image.open(io.BytesIO(room_bytes)).convert("RGB")
        except Exception:
            return JSONResponse({"error": "room_image is not a valid image"}, status_code=400)

        # ── Load fabric swatch from disk via fabric_id ────────────────────────
        if not fabric_id:
            return JSONResponse({"error": "fabric_id is required"}, status_code=400)

        catalog = _read_catalog()
        product = next((p for p in catalog if p["id"] == fabric_id), None)
        if not product:
            return JSONResponse({"error": f"fabric '{fabric_id}' not found in catalog"}, status_code=404)

        # swatch_path is like /catalog/swatches/filename.jpg
        swatch_filename = Path(product["swatch_path"]).name
        swatch_file = SWATCHES_DIR / swatch_filename
        if not swatch_file.exists():
            return JSONResponse({"error": f"swatch file missing for '{product['name']}': {swatch_file}"}, status_code=500)

        try:
            fabric_pil = Image.open(swatch_file).convert("RGB")
        except Exception as e:
            return JSONResponse({"error": f"cannot open swatch for '{product['name']}': {e}"}, status_code=500)

        orig_size = room_pil.size

        def pil_to_bytes(img: Image.Image, fmt="JPEG") -> bytes:
            buf = io.BytesIO(); img.save(buf, format=fmt); return buf.getvalue()

        # ── Downscale room to ≤1024px for Gemini ─────────────────────────────
        MAX_DIM = 1024
        rw, rh  = room_pil.size
        scale   = min(MAX_DIM / rw, MAX_DIM / rh, 1.0)
        work_w  = (round(rw * scale) // 8) * 8
        work_h  = (round(rh * scale) // 8) * 8
        room_work = room_pil.resize((work_w, work_h), Image.LANCZOS)
        print(f"  [{product['name']}] Room {orig_size}→{work_w}×{work_h} | Swatch {fabric_pil.size}")

        # ── Build prompt ──────────────────────────────────────────────────────
        if prompt:
            # Explicit prompt override (e.g. from future advanced UI)
            used_prompt = prompt.rstrip()
        else:
            # Parse spatial inputs
            win_pts  = json.loads(window_points) if window_points else []
            cz_pts   = json.loads(curtain_zone)  if curtain_zone  else None

            fabric_desc = (
                f"Fabric: {product['name']} — "
                f"{product.get('description') or product['collection']} "
                f"({product.get('density','medium')} weight, colour {product['color_hex']})."
            )

            if analysis_json:
                # ── Rich analysis-driven prompt (POC approach) ────────────────
                try:
                    a = json.loads(analysis_json)
                    # Use original image dimensions for coordinate conversion —
                    # window_points and curtain_zone are in natural-image pixel space.
                    orig_w, orig_h = orig_size
                    spatial_prompt = _build_prompt_from_analysis(
                        a,
                        orig_w, orig_h,
                        win_pts, cz_pts,
                        curtain_type, cz_width_cm, cz_height_cm,
                    )
                    used_prompt = (
                        f"{PROMPT_BASE}\n\n"
                        f"{spatial_prompt}\n\n"
                        f"{fabric_desc}\n\n"
                        f"OUTPUT SIZE: exactly {work_w}×{work_h} px "
                        f"(aspect ratio {work_w/work_h:.3f}). No crop, no padding."
                    )
                except Exception:
                    import traceback; traceback.print_exc()
                    # Fall through to simple prompt below
                    analysis_json = None

            if not analysis_json:
                # ── Fallback: simple template (no analysis available) ─────────
                style_detail = STYLE_PROMPTS.get(curtain_type, "")
                dim_hint = ""
                if cz_width_cm and cz_height_cm:
                    dim_hint = (
                        f"\n\nCURTAIN ZONE: the treatment must fill a {cz_width_cm} cm wide × "
                        f"{cz_height_cm} cm tall area at the window."
                    )
                win_hint = ""
                if win_pts and len(win_pts) == 4:
                    orig_w, orig_h = orig_size
                    corners_str = ", ".join(
                        f"corner {i+1}: ({round(p['x']/orig_w*100)}%, {round(p['y']/orig_h*100)}%)"
                        for i, p in enumerate(win_pts)
                    )
                    win_hint = f"\n\nWINDOW LOCATION: {corners_str}."

                used_prompt = (
                    f"{PROMPT_BASE}\n\n"
                    f"STYLE: {style_detail}\n\n"
                    f"{fabric_desc}"
                    f"{dim_hint}"
                    f"{win_hint}\n\n"
                    f"OUTPUT SIZE: exactly {work_w}×{work_h} px "
                    f"(aspect ratio {work_w/work_h:.3f}). No crop, no padding."
                )
        print(f"  Prompt ({len(used_prompt)} chars): {used_prompt[:120]}…")

        # ── Dry-run: return prompt without calling Gemini ─────────────────────
        if dry_run in ("1", "true", "yes"):
            print(f"  🔍 Dry run — returning prompt only")
            return JSONResponse({
                "ok":     True,
                "dry_run": True,
                "prompt": used_prompt,
                "model":  MODEL_NAME,
                "fabric": product["name"],
            })

        contents = [
            types.Part.from_bytes(data=pil_to_bytes(room_work), mime_type="image/jpeg"),
            types.Part.from_bytes(data=pil_to_bytes(fabric_pil), mime_type="image/jpeg"),
            types.Part.from_text(text=used_prompt),
        ]

        print(f"  Calling model: {MODEL_NAME}")
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=contents,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
            ),
        )

        # Extract image from response
        out_img = None
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                out_img = Image.open(io.BytesIO(part.inline_data.data))
                break

        if out_img is None:
            texts = [p.text for p in response.candidates[0].content.parts if p.text]
            msg = " ".join(texts) or "No image returned by Gemini"
            print(f"  ⚠️  {msg}")
            return JSONResponse({"error": msg}, status_code=500)

        # Scale back to original dimensions (letterbox-safe)
        out_img = out_img.convert("RGB")
        out_img.thumbnail(orig_size, Image.LANCZOS)
        print(f"  ✅  {orig_size} → Gemini {out_img.size} in {round(time.time()-t0,1)}s")

        # ── Return raw PNG bytes — client uses res.blob() + createObjectURL ──
        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        return FastAPIResponse(content=buf.getvalue(), media_type="image/png")

    except HTTPException:
        raise
    except Exception as e:
        return _err(e)

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Railway (and most PaaS) inject $PORT; fall back to 8000 for local dev.
    port = int(os.environ.get("PORT", 8000))
    print("╔══════════════════════════════════════════════╗")
    print("║   Veelo — Gemini Image Server                ║")
    print("╚══════════════════════════════════════════════╝\n")
    print(f"  Model  : {MODEL_NAME}")
    print(f"  Key    : {'✅  set' if GEMINI_API_KEY else '❌  missing'}")
    print(f"  Port   : {port}")
    print(f"  Open   : http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
