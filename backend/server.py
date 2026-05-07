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

import base64, io, json, os, re, time, sys
from pathlib import Path
from typing import Optional

# ── Load .env ─────────────────────────────────────────────────────────────────
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# ── Dependency check ──────────────────────────────────────────────────────────
MISSING = []
try:
    from fastapi import FastAPI, Form, UploadFile, File
    from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
    from fastapi.staticfiles import StaticFiles
    import uvicorn
except ImportError:
    MISSING.append("fastapi uvicorn python-multipart")
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

# Try candidate model names — Google renames these periodically
_MODEL_CANDIDATES = [
    "gemini-3.1-flash-image",            # 3.1 — preferred
    "gemini-3.1-flash-image-preview",    # 3.1 preview fallback
    "gemini-2.5-flash-image",            # 2.5 fallback
]

def _resolve_model() -> str:
    """Return the first model that exists and supports generateContent."""
    try:
        all_models = list(client.models.list())
        available = {m.name.split("/")[-1] for m in all_models}

        for candidate in _MODEL_CANDIDATES:
            if candidate in available:
                return candidate

        print(f"  ⚠️  None of the candidate models matched. See list above.")
    except Exception as e:
        print(f"  ⚠️  list_models failed ({e})")
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


def _cz_to_verbal_desc(z, w, r, curtain_type, cz_width_cm, cz_height_cm, wings=1):
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

    # ── Wings / panel count ───────────────────────────────────────────────────
    if wings == 1:
        parts.append(
            "The curtain is a single panel covering the full window width — "
            "fully closed with no gap or split anywhere."
        )
    else:  # 2 (or any even number treated as split)
        parts.append(
            "The curtain has two panels (left panel and right panel). "
            "The left panel covers the left half of the window and the right panel covers the right half. "
            "The two panels meet at the horizontal centre of the window "
            "with a small gap of a few centimetres visible at that meeting point. "
            "The gap runs vertically from top to bottom of the curtain drop. "
            "Do NOT merge the panels into a single continuous piece of fabric."
        )

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
                    "The curtain hangs from the ceiling."
                )
            else:
                # The curtain HANGS FROM the ceiling track — the fabric starts at
                # the ceiling, covers the wall section above the window, then the
                # window itself. Do NOT describe the fabric as starting at the window.
                parts.append(
                    f"The ceiling track is installed at the ceiling. "
                    f"The curtain hangs from the ceiling — it covers approximately "
                    f"{from_ceil_cm} cm of wall above the window frame before reaching the window."
                )
        elif top_pct < 0 or (ceil_visible and top_pct < 5):
            parts.append(
                "The ceiling track runs along the ceiling. "
                "The curtain hangs from the ceiling."
            )
        else:
            parts.append(
                "The ceiling track is installed above the window. "
                "The curtain hangs from the track."
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
        # Curtain bottom is at or within 5% of the window frame bottom.
        #
        # For pleated ceiling-track curtains: the user marks the window frame to
        # define the zone — they should never need to drag markers to the floor to
        # get floor-length curtains (that's the default for this curtain type).
        # If the floor is visible, upgrade to floor-length automatically.
        # If the floor is NOT visible, describe neutrally without a "stop at sill"
        # prohibition that would contradict the ceiling-track mounting description.
        #
        # For other curtain types (roman, roller, eyelet): sill-length is a valid
        # and common choice — keep the explicit stop instruction.
        pleated_ceiling = (curtain_type == "pleated")
        if pleated_ceiling and floor_visible:
            parts.append("The curtain reaches down to the floor.")
        elif pleated_ceiling:
            # Floor not visible — describe endpoint neutrally, no prohibition
            if cm_per_pct:
                win_cm = round((w.get("height_pct") or 0) * cm_per_pct)
                parts.append(
                    f"The curtain ends at the bottom of the window frame "
                    f"(approximately {win_cm} cm of curtain drop from the ceiling)."
                )
            else:
                parts.append("The curtain ends at the bottom of the window frame.")
        else:
            # Non-pleated: sill-length is intentional — keep the stop instruction
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
    wings=1,         # 1 = single closed panel, 2 = two panels with centre gap
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
        cz_desc = _cz_to_verbal_desc(z_pct, w, r, curtain_type, cz_width_cm, cz_height_cm, wings=wings)
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
app = FastAPI()

SWATCHES_DIR = CATALOG_DIR / "swatches"
SWATCHES_DIR.mkdir(parents=True, exist_ok=True)


# ── Startup banner ───────────────────────────────────────────────────────────
# Inquiries hand off to the founder via WhatsApp Click-to-Chat, not email.
# Print the configured handoff so misconfigurations are obvious at boot.
@app.on_event("startup")
def _log_inquiry_handoff():
    phone = os.environ.get("VEELO_WHATSAPP_PHONE", "972523770639")
    base  = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000")
    print(f"  💬  Inquiry handoff: WhatsApp → +{phone}")
    print(f"      Public URLs   : {base}/i/<id>")

@app.get("/")
def index():
    return {"service": "Veelo API", "status": "ok", "model": MODEL_NAME}

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
    f = SWATCHES_DIR / filename
    if not f.exists():
        return JSONResponse({"error": f"swatch '{filename}' not found"}, status_code=404)
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
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

# ── Catalog — add ─────────────────────────────────────────────────────────────
@app.post("/catalog/products")
async def catalog_add(
    swatch:      UploadFile       = File(...),
    name:        str              = Form(...),
    collection:  str              = Form(...),
    type:        str              = Form(...),
    density:     str              = Form("medium"),
    price_per_m: str              = Form(...),   # accept as str, coerce below
    description: str              = Form(""),
    color_hex:   str              = Form("#888888"),
    in_stock:    str              = Form("true"), # accept as str — bool parsing is fragile
    lead_days:   str              = Form("7"),    # accept as str, coerce below
    currency:    str              = Form("ILS"),
):
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

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

# ── Catalog — delete ──────────────────────────────────────────────────────────
@app.delete("/catalog/products/{product_id}")
def catalog_delete(product_id: str):
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
    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

# ── Hangers (rod / track / rail catalog) ──────────────────────────────────────
def _read_hangers():
    f = CATALOG_DIR / "hangers.json"
    return json.loads(f.read_text("utf-8")) if f.exists() else []

@app.get("/hangers")
def hangers_list(curtain_type: Optional[str] = None):
    """Return all hanger options, optionally filtered by curtain type compatibility."""
    try:
        hangers = _read_hangers()
        if curtain_type:
            hangers = [h for h in hangers if curtain_type in h.get("compatible_types", [])]
        return JSONResponse(content=hangers)
    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

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
async def analyze(
    room_image:   UploadFile = File(...),
    selection:    str        = Form(None),   # JSON: [{x,y},...] × 4 pixel coords
    curtain_zone: str        = Form(None),   # JSON: [{x,y},...] × 4 pixel coords
):
    t0 = time.time()
    try:
        room_bytes = await room_image.read()
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

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)

@app.get("/status")
def status():
    return {"model": MODEL_NAME, "ready": True}

@app.post("/generate")
async def generate(
    room_image:    UploadFile = File(...),
    fabric_id:     str = Form(""),       # look up swatch on disk — no client re-upload
    curtain_type:  str = Form(""),
    wings:         str = Form("1"),      # "1" = single panel, "2" = split panels
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
        room_bytes = await room_image.read()
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
                    wings_int = int(wings) if wings.strip().isdigit() else 1
                    spatial_prompt = _build_prompt_from_analysis(
                        a,
                        orig_w, orig_h,
                        win_pts, cz_pts,
                        curtain_type, cz_width_cm, cz_height_cm,
                        wings=wings_int,
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
                response_modalities=["IMAGE", "TEXT"],
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

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

# ── Inquiry — final submission from Results screen ────────────────────────────
# Persists simulation + source + full config to disk and exposes a public page
# at /i/{id} that the founder visits via a WhatsApp link the customer sends.
# No email anywhere — the customer's WhatsApp message IS the inquiry.
INQUIRIES_DIR = SCRIPT_DIR / "inquiries"
INQUIRIES_DIR.mkdir(exist_ok=True)

PUBLIC_BASE_URL = os.environ.get("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
WHATSAPP_PHONE  = os.environ.get("VEELO_WHATSAPP_PHONE", "972523770639")

# ── Curtain-type Hebrew labels ────────────────────────────────────────────────
# Used both in the WhatsApp message text the customer sends AND on the
# /i/{id} public page the founder opens.
CURTAIN_HE = {
    "pleated": "וילון מקופל",
    "eyelet":  "וילון לולאות",
    "roman":   "וילון רומאי",
    "roller":  "וילון גלילה",
}


def _build_whatsapp_preview_jpg(sim_bytes: bytes) -> bytes:
    """Render a 1200×630 JPEG preview for WhatsApp's link-unfurl crawler.

    Why a separate file (not just og:image → simulation.png):
      • WhatsApp silently drops the preview image if it can't fetch+decode
        in a few seconds, OR if the file is larger than ~300KB (observed,
        not documented). Gemini PNGs come back ~0.8–2MB, so they fail.
      • OG spec wants 1200×630 — wider than typical room photos.

    Letterbox (not crop) onto Veelo ink so the founder sees the *entire*
    curtain in the chat preview. Chopping off the bottom of a curtain shot
    would be an own-goal — that's exactly what they want to evaluate.

    Trade-off: writes one more file per inquiry (~80–120KB). Cheap.
    """
    from io import BytesIO
    src = Image.open(BytesIO(sim_bytes)).convert("RGB")

    target_w, target_h = 1200, 630
    bg = (0x1f, 0x18, 0x12)  # Veelo ink — matches public-page footer

    scale = min(target_w / src.width, target_h / src.height)
    new_w = max(1, int(src.width * scale))
    new_h = max(1, int(src.height * scale))
    resized = src.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGB", (target_w, target_h), bg)
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2))

    out = BytesIO()
    # q78 + progressive lands at ~70–110KB for typical room renders, well
    # under WhatsApp's ~300KB unfurl cap with headroom for darker scenes.
    canvas.save(out, format="JPEG", quality=78, optimize=True, progressive=True)
    return out.getvalue()


def _public_page_html(*, inquiry_id, payload, base_url):
    """Render the inquiry as a Hebrew RTL HTML page.
    The founder lands here from a WhatsApp link; the customer never sees it
    again after they tap Send. Mobile-first, no JS, no external resources —
    must work on a flaky connection and inside the WhatsApp in-app browser.
    """
    fabric_name = (payload.get("fabric") or {}).get("name") or "—"
    fabric_price = (payload.get("fabric") or {}).get("price_per_m")
    hanger_name = (payload.get("hanger") or {}).get("name") or "—"
    hanger_price = (payload.get("hanger") or {}).get("price") or 0
    curtain_type = payload.get("curtain_type") or ""
    curtain_he = CURTAIN_HE.get(curtain_type, curtain_type or "—")
    width  = (payload.get("dimensions_cm") or {}).get("width")
    height = (payload.get("dimensions_cm") or {}).get("height")
    dim_str = f'{int(width)}×{int(height)} ס"מ' if (width and height) else "—"
    wings = payload.get("wings", "—")
    price_estimate = payload.get("price_estimate") or "—"
    customer_name = payload.get("customer_name") or "—"
    created = time.strftime("%d/%m/%Y %H:%M",
                            time.localtime(payload.get("created_at", time.time())))

    fabric_line = fabric_name + (f" (₪{fabric_price}/מטר)" if fabric_price else "")
    hanger_line = hanger_name + (f" (+₪{hanger_price})"  if hanger_price else "")

    # ── Open Graph metadata (WhatsApp link unfurl) ────────────────────────────
    # When the customer sends the wa.me link, WhatsApp fetches this page and
    # uses these tags to render a preview card with a thumbnail. Without them,
    # the founder just sees a bare blue URL. Two prerequisites to actually
    # see this in production:
    #   1. PUBLIC_BASE_URL must be reachable from WhatsApp's crawler (not
    #      localhost — use a tunnel like cloudflared in dev).
    #   2. preview.jpg must exist (generated at POST /inquiry time).
    # html.escape on user-controlled content (customer_name) — without this,
    # a name like `Avi" /><script>` would break out of the meta attribute.
    import html as _html
    og_title       = _html.escape(f"פנייה חדשה מ-{customer_name}", quote=True)
    og_description = _html.escape(f"{curtain_he} · {dim_str} · {fabric_name}", quote=True)
    og_image       = f"{base_url}/i/{inquiry_id}/preview.jpg"
    og_url         = f"{base_url}/i/{inquiry_id}"

    return f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>פנייה {inquiry_id} · Veelo</title>

<meta property="og:type"          content="website">
<meta property="og:site_name"     content="Veelo">
<meta property="og:locale"        content="he_IL">
<meta property="og:title"         content="{og_title}">
<meta property="og:description"   content="{og_description}">
<meta property="og:url"           content="{og_url}">
<meta property="og:image"         content="{og_image}">
<meta property="og:image:type"    content="image/jpeg">
<meta property="og:image:width"   content="1200">
<meta property="og:image:height"  content="630">
<meta property="og:image:alt"     content="Veelo curtain simulation preview">
<meta name="twitter:card"         content="summary_large_image">
<meta name="robots"               content="noindex">

<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
         background: #f8f4ee; color: #2a1f18; line-height: 1.5;
         padding: 20px 16px 40px; }}
  .wrap {{ max-width: 520px; margin: 0 auto; }}
  .crown {{ font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase;
            color: #8a7965; font-weight: 600; }}
  h1 {{ font-size: 1.4rem; font-weight: 600; margin: 6px 0 4px; color: #1f1812; }}
  .meta {{ font-size: 0.78rem; color: #8a7965; margin-bottom: 24px; }}
  .card {{ background: #fff; border: 1px solid #e8dfd2; border-radius: 14px;
           padding: 16px; margin-bottom: 16px; }}
  .card h2 {{ font-size: 0.7rem; letter-spacing: 0.18em; text-transform: uppercase;
              color: #8a7965; font-weight: 700; margin-bottom: 10px; }}
  .img {{ width: 100%; aspect-ratio: 4/3; object-fit: cover;
          border-radius: 10px; background: #2a1f18; display: block; }}
  .img + .img {{ margin-top: 10px; }}
  .img-cap {{ font-size: 0.72rem; color: #8a7965; margin-top: 6px; }}
  table {{ width: 100%; font-size: 0.92rem; }}
  td {{ padding: 7px 0; vertical-align: top; }}
  td.k {{ color: #8a7965; width: 36%; }}
  td.v {{ color: #1f1812; font-weight: 500; text-align: left; }}
  .price {{ background: #fff7ec; border-color: #f3d8ad; }}
  .price .amount {{ font-size: 1.5rem; font-weight: 600; color: #b87a3f; }}
  .price .note {{ font-size: 0.74rem; color: #8a7965; margin-top: 6px; font-style: italic; }}
  .footer {{ font-size: 0.72rem; color: #8a7965; text-align: center;
             margin-top: 24px; padding-top: 16px; border-top: 1px solid #e8dfd2; }}
  a.wa {{ display: block; background: #25d366; color: #fff;
          text-align: center; padding: 14px;
          border-radius: 999px; font-weight: 600; margin-top: 8px;
          text-decoration: none; font-size: 0.95rem; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="crown">פנייה חדשה · Veelo</div>
  <h1>{customer_name}</h1>
  <div class="meta">{inquiry_id} · {created}</div>

  <div class="card">
    <h2>הסימולציה</h2>
    <img class="img" src="{base_url}/i/{inquiry_id}/simulation.png" alt="סימולציה">
    <div class="img-cap">תמונת החדר המקורית:</div>
    <img class="img" src="{base_url}/i/{inquiry_id}/source.png" alt="חדר מקור">
  </div>

  <div class="card">
    <h2>תצורה</h2>
    <table>
      <tr><td class="k">סוג וילון</td><td class="v">{curtain_he}</td></tr>
      <tr><td class="k">בד</td><td class="v">{fabric_line}</td></tr>
      <tr><td class="k">מתלה</td><td class="v">{hanger_line}</td></tr>
      <tr><td class="k">כנפיים</td><td class="v">{wings}</td></tr>
      <tr><td class="k">מידות</td><td class="v">{dim_str}</td></tr>
    </table>
  </div>

  <div class="card price">
    <h2>הערכת מחיר (לא מחייבת)</h2>
    <div class="amount">{price_estimate}</div>
    <div class="note">המחיר הסופי נקבע לאחר מדידה בבית הלקוח.</div>
  </div>

  <div class="footer">
    Veelo · {base_url}<br>
    מזהה פנייה: {inquiry_id}
  </div>
</div>
</body>
</html>
"""


@app.get("/i/{inquiry_id}", response_class=HTMLResponse)
def public_inquiry_page(inquiry_id: str):
    """Public page the founder lands on from the customer's WhatsApp link.
    No auth — relies on the unguessability of the inquiry_id (timestamp +
    random base64). Acceptable for an MVP; revisit if abuse appears.
    """
    out_dir = INQUIRIES_DIR / inquiry_id
    payload_file = out_dir / "inquiry.json"
    if not payload_file.exists():
        return HTMLResponse(
            "<h1>404 — פנייה לא נמצאה</h1>", status_code=404
        )
    payload = json.loads(payload_file.read_text("utf-8"))
    return HTMLResponse(_public_page_html(
        inquiry_id = inquiry_id,
        payload    = payload,
        base_url   = PUBLIC_BASE_URL,
    ))


@app.get("/i/{inquiry_id}/{filename}")
def public_inquiry_image(inquiry_id: str, filename: str):
    """Serve the source.png / simulation.png attached to an inquiry.
    Restrict to those two filenames so this can't be turned into a directory
    walk by a crafted ID; the inquiry dir holds nothing else sensitive but
    keeping the surface tight is cheap.
    """
    if filename not in {"source.png", "simulation.png", "preview.jpg"}:
        return JSONResponse({"error": "not found"}, status_code=404)
    f = INQUIRIES_DIR / inquiry_id / filename
    if not f.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    media = "image/jpeg" if filename.endswith(".jpg") else "image/png"
    # Long cache: inquiry filenames are immutable per id, and WhatsApp's
    # crawler benefits from a fast 304 on re-fetch.
    return FileResponse(
        f,
        media_type=media,
        headers={"Cache-Control": "public, max-age=86400, immutable"},
    )


def _build_whatsapp_message(*, inquiry_id, customer_name, payload, public_url):
    """Compose the Hebrew WhatsApp text the customer's wa.me link pre-fills.
    Kept short and scannable so the founder can read it on the lock screen
    without opening the chat.
    """
    f = (payload.get("fabric")  or {})
    h = (payload.get("hanger")  or {})
    d = (payload.get("dimensions_cm") or {})
    w, hh = d.get("width"), d.get("height")
    dim = f'{int(w)}×{int(hh)} ס"מ' if (w and hh) else "—"
    curtain_he = CURTAIN_HE.get(payload.get("curtain_type") or "",
                                payload.get("curtain_type") or "—")
    lines = [
        f"שלום! עיצבתי וילון ב-Veelo ואשמח לקבל הצעת מחיר.",
        "",
        f"שם: {customer_name}",
        "",
        "הפרטים:",
        f"• סוג: {curtain_he}",
        f"• בד: {f.get('name') or '—'}",
        f"• מתלה: {h.get('name') or '—'}",
        f"• כנפיים: {payload.get('wings') or '—'}",
        f"• מידות: {dim}",
        f"• הערכה: {payload.get('price_estimate') or '—'}",
        "",
        "הסימולציה שלי:",
        public_url,
        "",
        "תודה!",
    ]
    return "\n".join(lines)

@app.post("/inquiry")
async def submit_inquiry(
    source_image:     UploadFile = File(...),
    simulation_image: UploadFile = File(...),
    customer_name:    str = Form(...),
    curtain_type:     str = Form(""),
    fabric_id:        str = Form(""),
    hanger_id:        str = Form(""),
    wings:            str = Form("1"),
    width_cm:         str = Form(""),
    height_cm:        str = Form(""),
    window_points:    str = Form(""),
    price_estimate:   str = Form(""),
):
    """Persist the inquiry and return the WhatsApp handoff URL.
    Frontend calls this, then immediately opens the returned `whatsapp_url`,
    which deep-links into WhatsApp with a pre-filled Hebrew message that
    includes a link to /i/{id} (this server) where the founder sees the
    full simulation + config.
    """
    try:
        name = (customer_name or "").strip()
        if not (1 <= len(name) <= 80):
            return JSONResponse({"error": "name must be 1–80 characters"}, status_code=400)

        inquiry_id = f"{int(time.time())}-{base64.urlsafe_b64encode(os.urandom(4)).decode().rstrip('=')}"
        out_dir = INQUIRIES_DIR / inquiry_id
        out_dir.mkdir(parents=True, exist_ok=True)

        source_bytes = await source_image.read()
        sim_bytes    = await simulation_image.read()
        (out_dir / "source.png").write_bytes(source_bytes)
        (out_dir / "simulation.png").write_bytes(sim_bytes)

        # Generate now (not lazily on first GET) — WhatsApp's unfurl crawler
        # gives a few seconds and bails on no-image previews. Pre-baking
        # avoids a cold-cache race on the first share.
        try:
            (out_dir / "preview.jpg").write_bytes(_build_whatsapp_preview_jpg(sim_bytes))
        except Exception as e:
            # Non-fatal: the page still works, just no chat-preview thumbnail.
            print(f"  ⚠️  preview.jpg generation failed for {inquiry_id}: {e}")

        catalog = _read_catalog()
        product = next((p for p in catalog if p["id"] == fabric_id), None)
        fabric_name  = product["name"] if product else fabric_id
        fabric_price = product.get("price_per_m") if product else None

        hangers = _read_hangers()
        hanger  = next((h for h in hangers if h["id"] == hanger_id), None)
        hanger_name  = hanger["name"]  if hanger else hanger_id
        hanger_price = hanger.get("price") if hanger else None

        payload = {
            "id":              inquiry_id,
            "created_at":      int(time.time()),
            "customer_name":   name,
            "curtain_type":    curtain_type,
            "fabric": {
                "id": fabric_id, "name": fabric_name, "price_per_m": fabric_price,
            },
            "hanger": {
                "id": hanger_id, "name": hanger_name, "price": hanger_price,
            },
            "wings":           int(wings) if wings.isdigit() else wings,
            "dimensions_cm": {
                "width":  float(width_cm)  if width_cm  else None,
                "height": float(height_cm) if height_cm else None,
            },
            "window_points":   json.loads(window_points) if window_points else [],
            "price_estimate":  price_estimate,
        }
        (out_dir / "inquiry.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), "utf-8"
        )

        public_url = f"{PUBLIC_BASE_URL}/i/{inquiry_id}"
        wa_text = _build_whatsapp_message(
            inquiry_id    = inquiry_id,
            customer_name = name,
            payload       = payload,
            public_url    = public_url,
        )
        # urllib.parse.quote handles UTF-8 (Hebrew + ₪ + emoji-safe). We need
        # quote, not quote_plus — wa.me expects %20 for spaces, not '+'.
        from urllib.parse import quote
        whatsapp_url = f"https://wa.me/{WHATSAPP_PHONE}?text={quote(wa_text)}"

        print(f"  💬  Inquiry {inquiry_id} from {name}")
        print(f"      → {public_url}")

        return JSONResponse({
            "ok":           True,
            "id":           inquiry_id,
            "public_url":   public_url,
            "whatsapp_url": whatsapp_url,
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("╔══════════════════════════════════════════════╗")
    print("║   Veelo — Gemini Image Server                ║")
    print("╚══════════════════════════════════════════════╝\n")
    print(f"  Model  : {MODEL_NAME}")
    print(f"  Key    : {'✅  set' if GEMINI_API_KEY else '❌  missing'}")
    print(f"  Open   : http://localhost:8000\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
