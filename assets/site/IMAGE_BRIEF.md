# Vicky Israel Site — Image Brief
**Version:** 1.0 · **Date:** 2026-05-07

This doc maps each photo Amnon shared (2026-05-07) to its production role on the Vicky Israel landing. Save the source files into the directories below using the suggested filenames so the components can reference them by stable paths.

---

## 1. Hero (the headline image of the entire site)
**Recommendation:** the contemporary living room with three tall arched windows draped in floor-to-ceiling sheer curtains, warm afternoon light, beige sectional, jute rug, olive tree.

**Why this one wins:**
- Symmetrical composition — reads correctly in both Hebrew RTL and English LTR without compositional flip.
- Sheer drapery is the single strongest visual signal of Vicky's craft, and the *light through the fabric* sells the feeling without a word of copy.
- Warm cream/beige palette is already an exact match to `tokens.css` (`--bg: #faf6f0`, `--surface-2: #f5f0e8`).
- Aspirational but not staged — this is the room people *want*.

**Save as:**
```
assets/site/hero/hero-arched-sheers.jpg          (original)
assets/site/hero/hero-arched-sheers-2400.webp    (desktop, 2400×1600)
assets/site/hero/hero-arched-sheers-1200.webp    (mobile, 1200×800)
assets/site/hero/hero-arched-sheers-blur.jpg     (8KB blurred placeholder for LCP)
```

**Usage:**
- Full-bleed background of the Hero section.
- Subtle dark overlay (linear-gradient bottom-up, 0% → 40% `rgba(26,22,16,.35)`) so white serif headline text holds contrast at AA.
- Set `object-position: center` — the symmetry is doing the work.

---

## 2. About Vicky portrait (the "meet the designer" moment)
**Recommendation:** the candid photo of Vicky at the showroom fabric racks, examining a swatch.

**Why this one wins (and beats any studio portrait):**
- She is *practicing her craft*, not posing. That is the entire pitch of "designer who works in textiles."
- The dark, textured backdrop frames her subject-first — there's no competing visual noise.
- Authentic > polished for a single-practitioner brand. Studio portraits read as marketing; this reads as a peek behind the curtain (literally).

**Save as:**
```
assets/site/about/vicky-at-showroom.jpg          (original)
assets/site/about/vicky-at-showroom-960.webp     (desktop, 960×1280 portrait)
assets/site/about/vicky-at-showroom-480.webp     (mobile, 480×640)
```

**Usage:**
- Right column on desktop (LTR) / left column in RTL — flipped via CSS logical properties, *not* by mirroring the photo.
- 4:5 aspect ratio crop. Gentle vignette is fine; no filters.
- Caption underneath in italic Cormorant: *"ויקי בתערוכת הבדים, מילאנו 2025"* (or whatever the actual context is — verify before publishing).

---

## 3. Fabric texture / craft proof (supporting image, About section)
**Recommendation:** the macro photograph of cream sheer linen-weave fabric draping into folds.

**Why:**
- Pure craft cue — the eye reads "natural fiber, hand-made, light-honest" instantly.
- Works as a **section divider** between About Vicky and the Veelo teaser without needing copy.
- Could also serve as a CSS `background-image` for the eyebrow strip running through the page if we want the warm cream surface to feel less flat.

**Save as:**
```
assets/site/fabric-texture/sheer-linen-weave.jpg
assets/site/fabric-texture/sheer-linen-weave-1600.webp
```

**Usage (Phase 1):** small inset card inside the About section, demonstrating "this is the level of attention to material she works at."

**Usage (Phase 2 idea):** edge-to-edge horizontal band as the transition between sections — `aspect-ratio: 21/4`, `object-position: center 60%`.

---

## 4. Portfolio gallery seeds (Phase 2)
**Held for Phase 2.** These are excellent but the brief deliberately defers a full gallery until we have ≥6 cohesive shots. For now they go in `assets/site/portfolio/` and serve as the foundation.

| File suggestion                          | Source image                                           | What it shows                      |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `portfolio/sheer-floor-to-ceiling.jpg`   | Modern living room, full-wall sheer drapery, armchairs | Sheer technique, large-format work |
| `portfolio/villa-living-sliding.jpg`     | Villa living room, sliders, wave-fold sheers           | Real residential install (Israel)  |
| `portfolio/breakfast-nook-roman.jpg`     | Banquette + kitchen table, roman shade + side panels   | Mixed treatments, intimate scale   |
| `portfolio/arched-window-drapes.jpg`     | Arched window with bronze rod + dual-layer drapes      | Traditional/luxe palette range     |
| `portfolio/office-roller-blinds.jpg`     | Workspace with linen roller blinds + plants            | Functional / commercial range      |
| `portfolio/textile-jacquard-stack.jpg`   | Stack of magenta/orange geometric jacquard samples     | **Textile expertise** — color, pattern, hand |
| `portfolio/stone-bench-drape.jpg`        | Stone bench with cream drape detail                    | Editorial, art-direction skill     |

> **Note on the geometric jacquard photo:** this is the strongest single signal that Vicky works *with textile* and not just *with curtains*. When portfolio ships in Phase 2, this image deserves its own card with the eyebrow label "TEXTILES" — it's the differentiator from a window-treatment company.

---

## 5. Logo
```
assets/site/logo/vicky-israel-wordmark.png       (the supplied PNG, original)
assets/site/logo/vicky-israel-wordmark@2x.png    (if you have a hi-res version)
```

**Open follow-up:** when you get a moment, ask the original logo designer for the source vector (.ai or .svg). Until then we serve the PNG at 2x density. **TODO** — flag for Phase 2.

---

## 6. Production checklist (when you save the files)

- [ ] Strip EXIF/GPS metadata before committing to git (`exiftool -all= file.jpg`)
- [ ] Convert hero + about portrait to AVIF + WebP + JPEG fallback (use `sharp` or `cwebp`)
- [ ] Ensure no image > 400KB at its largest displayed size
- [ ] Confirm Vicky is OK with the showroom photo being public (it's clearly her face — explicit consent matters)
- [ ] Do we have rights/usage permission for the AI-generated arched-window hero? If it's stock or AI-output we own, fine. If it's from a moodboard, we need to swap it for an owned shot before launch.

---

## 7. Revised hero direction (informed by these images)

Originally the brief proposed an editorial hero with text on a warm cream background. With this hero photograph available, we shift to a **full-bleed photo hero** with the cream background reserved for the About section. This is a stronger opening — the visitor sees Vicky's actual aesthetic in the first 800ms instead of reading about it.

**Updated Hero composition:**
```
┌─────────────────────────────────────────────┐
│ [logo top-right RTL / top-left LTR]         │
│                                             │
│   [arched-windows-with-sheers photo,        │
│    full-bleed, dark overlay 0→40%]          │
│                                             │
│        טקסטיל. עיצוב. בית.                  │
│        בית שמרגיש בדיוק כמוך.               │
│                                             │
│        [לקביעת ייעוץ]  [לעבודות]            │
│                                             │
└─────────────────────────────────────────────┘
```

Min height: `100dvh` on desktop, `clamp(560px, 90dvh, 760px)` on mobile (we don't want hero-jacking on shorter screens to push the About section out of the first scroll).
