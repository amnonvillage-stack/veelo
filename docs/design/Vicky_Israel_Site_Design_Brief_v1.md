# Vicky Israel — Site Design Project Brief
**Version:** 1.0 · **Date:** 2026-05-07 · **Owner:** Amnon · **Status:** Draft for review

---

## 1. Vision in one paragraph

A bilingual (Hebrew/English), editorial-feeling brand site for **Vicky Israel — Textile & Design Studio**, with the **Veelo curtain visualizer** as a featured but secondary experience. The landing earns trust through Vicky's voice, taste, and work; the visualizer is the calculated moment of delight that converts a curious visitor into a WhatsApp inquiry. We borrow Havenly's *design language* (refined editorial type, generous whitespace, modular responsive blocks) but explicitly reject its *information density* — Vicky is one designer, not a 100-vendor marketplace.

---

## 2. Why this matters (product framing)

The site is not a brochure. It exists to do exactly one job:

> **Convert a stranger into a qualified WhatsApp lead.**

Every design decision should be evaluated against that conversion path:

```
Land → Trust Vicky's taste → Curiosity (Veelo teaser) → Try it → Delight → Inquire on WhatsApp
```

Veelo already nails the last three steps (its WhatsApp click-to-chat handoff is solid). The marketing site's job is the first three. Anything that doesn't move the visitor toward Veelo or toward WhatsApp is decoration — and we cut it.

---

## 3. Information Architecture (MVP)

A single long-scroll landing page at `/`, plus the existing Veelo flow at `/veelo/*`:

```
/                       ← Vicky landing (long-scroll, anchored sections)
  #hero
  #about
  #veelo-teaser         ← The CTA section that hands off to /veelo
  #contact              ← Minimal footer-y block (WhatsApp + email + IG)
/veelo/*                ← Existing Veelo PWA flow, unchanged
/i/{id}                 ← Existing inquiry public page (FastAPI, untouched)
```

**Cut from MVP** (deliberately, to validate first): full portfolio gallery, services-in-detail, testimonials, blog. Each is a *future* section and the layout system will accommodate them, but we ship without.

**Why so lean:** Vicky has not yet supplied real portfolio assets or testimonial copy. Shipping with placeholder galleries dilutes the very trust the page needs to build. Better to ship 3 sections that feel real than 7 that feel half-finished.

---

## 4. Design language

### 4.1 Mood
Editorial · warm · understated · craft-forward. Think *Kinfolk* meets a high-end interiors studio. The opposite of "tech-startup landing page." No gradients-on-purple, no mesh blobs, no "AI-powered" badges.

### 4.2 Color tokens (extending existing `tokens.css`)
The current `tokens.css` is already 90% of the brand. We add only what the wordmark demands:

| Token              | Value      | Role                                         |
| ------------------ | ---------- | -------------------------------------------- |
| `--bg`             | `#faf6f0`  | Page background (existing) — warm cream      |
| `--surface`        | `#ffffff`  | Cards / elevated surfaces (existing)         |
| `--surface-2`      | `#f5f0e8`  | Section banding (existing)                   |
| `--ink`            | `#1a1610`  | Primary text (existing)                      |
| `--text-2`         | `#7a6e62`  | Secondary text (existing)                    |
| `--border`         | `#e8e0d4`  | Hairline rules (existing)                    |
| `--accent`         | `#c07050`  | **Action color** — CTAs, links (existing)    |
| **`--brand-bronze`** | **`#8B6549`** | **NEW.** Logo wordmark color, eyebrow text |
| **`--brand-bronze-2`**| **`#6E4F39`** | **NEW.** Hover state for brand-bronze    |

> **Why a separate bronze token?** Vicky's logo is a darker, less-orange brown than the terracotta `--accent`. Conflating them would bleed the brand color into every CTA — wrong. `--brand-bronze` is *identity* (logo, eyebrow labels, dividers). `--accent` is *action* (buttons, links).

### 4.3 Typography
Two faces, both already loaded by Veelo:

- **Display:** `Cormorant Garamond` — section headlines, hero, eyebrow labels in italic.
- **Body:** `DM Sans` — paragraphs, navigation, UI copy.

For the wordmark itself, the supplied logo is a baked-in image — we use it as an `<img>` (SVG when Vicky provides it). No need to font-match the wordmark in the runtime UI.

**Type scale (rem, mobile-first; desktop multipliers in parens):**

| Class       | Mobile  | Desktop | Family             | Use                        |
| ----------- | ------- | ------- | ------------------ | -------------------------- |
| `display-1` | 2.5rem  | 4.5rem  | Cormorant 300      | Hero headline              |
| `display-2` | 2.0rem  | 3.0rem  | Cormorant 400      | Section H2                 |
| `display-3` | 1.5rem  | 2.0rem  | Cormorant 500      | Subsection H3              |
| `lede`      | 1.125rem| 1.25rem | DM Sans 400        | Hero / section lead        |
| `body`      | 1.0rem  | 1.0rem  | DM Sans 400        | Paragraphs                 |
| `eyebrow`   | 0.7rem  | 0.75rem | DM Sans 700, .16em | Section eyebrow labels     |

### 4.4 Spacing & rhythm
Reuse existing `--space-*` tokens. Add section-level spacing:

- `--section-py-mobile: 64px`
- `--section-py-desktop: 120px`

Vertical rhythm is `8 → 16 → 32 → 64 → 120` (existing tokens already cover up to 32; we add 64 and 120 as `--space-16` and `--space-30`). Generous by default; tighten only inside cards.

### 4.5 Responsive grid
Mobile-first, four breakpoints. **Trimmed Havenly ladder:**

| Name    | Width range  | Max content | Columns | Gutter |
| ------- | ------------ | ----------- | ------- | ------ |
| Mobile  | 0 – 639px    | 100%        | 1       | 16px   |
| Tablet  | 640 – 1023px | 720px       | 2       | 24px   |
| Desktop | 1024 – 1439px| 1200px      | 12*     | 32px   |
| Wide    | ≥ 1440px     | 1280px      | 12*     | 32px   |

\* 12-col logical grid; we mostly use 1- or 2-col layouts within it. The 12-col is a substrate, not a constraint.

---

## 5. Component inventory (MVP)

| Component          | Where it lives                          | Notes                                                           |
| ------------------ | --------------------------------------- | --------------------------------------------------------------- |
| `SiteHeader`       | `src/site/components/SiteHeader.jsx`    | Logo (left in LTR / right in RTL), nav anchors, `LangToggle`    |
| `LangToggle`       | `src/site/components/LangToggle.jsx`    | HE ⇄ EN; updates `<html dir lang>` and persists to localStorage |
| `Hero`             | `src/site/sections/Hero.jsx`            | Full-bleed image + serif headline + lede + primary CTA          |
| `AboutVicky`       | `src/site/sections/AboutVicky.jsx`      | Two-column on desktop (portrait + copy); stacked on mobile      |
| `VeeloTeaser`      | `src/site/sections/VeeloTeaser.jsx`     | Full-bleed band, mock screenshot of Veelo, single CTA → `/veelo`|
| `ContactBlock`     | `src/site/sections/ContactBlock.jsx`    | Email primary CTA + adjacent WhatsApp link, Facebook + Instagram icons. Reuses Veelo's `wa.me/972523770639`. |
| `SiteFooter`       | `src/site/components/SiteFooter.jsx`    | Copyright, mini-nav, lang toggle echo                           |
| `LocaleProvider`   | `src/i18n/LocaleProvider.jsx`           | Context + `useT()` hook + dictionary lookup                     |

All components are RTL-aware via CSS logical properties (`margin-inline-start`, `padding-inline-end`, `border-inline-end`) — **no `left`/`right` in source.** This is non-negotiable for a bilingual site that flips direction.

---

## 6. Internationalization (HE/EN)

### 6.1 Approach: lean DIY, not a library

For an MVP with two locales and ~50–100 strings, a library (`i18next`, `react-intl`) is over-engineering — meaningful bundle weight, learning curve, and lock-in for problems we don't have yet.

**What we ship instead** (~60 LOC):

```
src/i18n/
  he.json                     # Hebrew dictionary
  en.json                     # English dictionary
  LocaleProvider.jsx          # Context provider + dir/lang sync
  useT.js                     # const t = useT(); t('hero.headline')
```

`LocaleProvider` does three things:
1. Holds `locale` state, persisted to `localStorage` and synced from `navigator.language` on first load.
2. Sets `<html lang>` and `<html dir>` (`rtl` for `he`, `ltr` for `en`) imperatively in a `useEffect`.
3. Exposes the current dictionary via context.

**Trade-off documented:** if we add a third locale, dynamic loading, pluralization rules, or date/number formatting beyond `Intl`, **revisit and migrate to `i18next`.** Add a `// TODO(i18n): migrate to i18next when N>2 locales` comment in `LocaleProvider.jsx`.

### 6.2 Veelo and i18n
Veelo today is implicitly Hebrew. Phase 1 leaves Veelo's strings as-is and only translates the **marketing shell + nav**. Translating Veelo's UI is a phase-2 task — flagged here, not in scope today.

### 6.3 Direction-flipping pitfalls (edge cases)
- Logo asset: same in both directions (it's a wordmark, not directional).
- Hero photo composition: pick photos whose subject is **centered**, not edge-anchored, so they read in both LTR and RTL.
- Icons with directional meaning (arrows, chevrons): use logical CSS rotations (`scale-x-[-1]` in RTL) or paired icons.
- Numbers, phone numbers, URLs: stay LTR even inside RTL paragraphs — wrap in `<bdo dir="ltr">` or use `&lrm;` markers.

---

## 7. Routing & integration with Veelo

### 7.1 What changes
The current Veelo `App.jsx` uses `useState('capture')` as a hand-rolled router. That's fine for a single-flow PWA but doesn't scale to sibling routes.

**Recommendation:** Add `react-router-dom` (~10KB gz) and split the app shell:

```
src/
  main.jsx                    # BrowserRouter wrapper
  App.jsx                     # <Routes> only
  site/                       # NEW — marketing site
    SiteShell.jsx             # Header + <Outlet /> + Footer
    Landing.jsx               # Composes Hero + About + VeeloTeaser + Contact
    components/
    sections/
  veelo/                      # MOVED — existing flow
    VeeloApp.jsx              # The current App.jsx body, unchanged
    screens/                  # Capture, Configure, Catalog, Results, Admin
    components/
  i18n/
```

`App.jsx` becomes:

```jsx
<Routes>
  <Route element={<SiteShell />}>
    <Route path="/" element={<Landing />} />
  </Route>
  <Route path="/veelo/*" element={<VeeloApp />} />
</Routes>
```

### 7.2 The viewport-lock conflict (real architectural issue)
Current `tokens.css` does this globally:

```css
html, body, #root { height: 100dvh; overflow: hidden; }
```

That's correct for the Veelo PWA flow (locked viewport, no rubber-band scrolling) but **breaks long-page scrolling** on the marketing route.

**Fix:** scope the lock. Move the `overflow: hidden; height: 100dvh` rules to a `.veelo-app-root` class applied only by `VeeloApp.jsx`, and let the body scroll naturally on marketing routes. The marketing root sets `min-height: 100dvh` instead of `height: 100dvh`.

### 7.3 Why not Astro/Next?
Considered. Rejected for MVP because:
- The whole site is one repo with one deploy, run by one founder. Two stacks = two failure modes.
- SEO matters but not as much as time-to-launch — Vicky's discovery is largely word-of-mouth + IG today.
- We can pre-render the landing later (vite-ssg, ~1 day of work) if SEO becomes load-bearing.

**Documented as debt:** `// TODO(perf): consider vite-ssg or migration to Astro if SEO/CWV becomes a priority`.

---

## 8. Edge cases & defensive design

| Case                                  | What we do                                                              |
| ------------------------------------- | ----------------------------------------------------------------------- |
| User on slow 3G                       | Lazy-load below-fold images; AVIF/WebP with JPEG fallback; LCP < 2.5s   |
| User has JS disabled                  | Static HTML still shows hero + about + Veelo CTA (gracefully degrades)  |
| Locale localStorage cleared           | Fallback to `navigator.language`, then to `he` as default               |
| User prefers reduced motion           | `@media (prefers-reduced-motion)`: kill parallax, fade-only transitions |
| Logo image fails to load              | Text fallback: `VICKY ISRAEL` in Cormorant 600 with letter-spacing      |
| WhatsApp link tapped on desktop       | Opens `wa.me` web; fine — already how Veelo handles it                  |
| Section anchor link from other page   | `scroll-margin-top` on each section accounts for sticky header          |
| iOS Safari address-bar height jumps   | Use `100dvh` (already in use); avoid `100vh`                            |
| Print stylesheet                      | Out of scope for MVP. `// TODO` comment in global.css                   |

---

## 9. Phased plan

### Phase 1 — MVP (this brief)
- [ ] `react-router-dom` + scoped viewport-lock fix
- [ ] `LocaleProvider` + HE/EN dictionaries (shell only)
- [ ] `SiteHeader`, `SiteFooter`, `LangToggle`
- [ ] Hero, AboutVicky, VeeloTeaser, ContactBlock sections
- [ ] Logo asset (SVG preferred) provided by Vicky
- [ ] Placeholder copy + placeholder hero photography
- [ ] Verify: existing Veelo flow at `/veelo` is byte-for-byte unchanged
- [ ] Verify: Lighthouse mobile ≥ 90 on Performance + Accessibility for `/`

### Phase 2 — content & polish (next)
- [ ] Real photography from Vicky's portfolio
- [ ] Real Hebrew + English copy (Vicky's voice)
- [ ] Portfolio gallery section (modular cards, lightbox)
- [ ] Services breakdown section
- [ ] Testimonials block
- [ ] Translate Veelo's UI strings to EN

### Phase 3 — discovery & growth (later)
- [ ] Pre-render landing (vite-ssg or Astro migration) for SEO
- [ ] Open Graph / structured-data for `/`
- [ ] Analytics (privacy-friendly: Plausible / Umami)
- [ ] A/B test Veelo CTA copy against inquiry rate

---

## 10. Open questions — answered 2026-05-07

| # | Question                  | Answer                                                                                       |
| - | ------------------------- | -------------------------------------------------------------------------------------------- |
| 1 | Hero photography          | **Resolved.** Use the arched-window sheer-drape interior as the hero. Vicky's showroom-floor candid moves to About. See `assets/site/IMAGE_BRIEF.md` for full image-to-role mapping. |
| 2 | Logo SVG                  | **No SVG yet.** Serve PNG at 2× density. `// TODO(phase 2)`: request source vector.          |
| 3 | WhatsApp number           | Same as Veelo: `+972 52 377 0639`.                                                           |
| 4 | Email                     | Yes — email primary, with a "ניתן ליצור קשר גם בוואטסאפ" link adjacent. Both channels present.|
| 5 | Social handles            | Facebook + Instagram — both surfaced in the footer.                                          |
| 6 | Domain                    | **Still open.** Need to decide before we wire `PUBLIC_BASE_URL` and OG tags.                 |

### Implications of these answers
- The Hero shifts from cream-text-on-cream to **full-bleed photo with a bottom gradient overlay** — stronger opening, see `IMAGE_BRIEF.md` §7.
- `ContactBlock` becomes: email (primary action), WhatsApp (secondary action), Facebook + Instagram (tertiary, icon links). Need the actual email address and the FB/IG URLs from Amnon.
- A small but real consent question: the showroom photo of Vicky is a real photograph of a real person. **Confirm with Vicky** before publishing.

---

## 11. What I will produce next, on your green-light

Once you confirm the brief, I'll deliver in this order:
1. The scaffold PR: `react-router-dom`, scoped viewport lock, `site/` and `veelo/` directory move, `LocaleProvider` shell, smoke-test that `/veelo` still works end-to-end.
2. Static `Hero` + `AboutVicky` with placeholders, fully responsive at all four breakpoints in HE and EN.
3. `VeeloTeaser` + `ContactBlock` + `SiteFooter`.
4. Pass the whole thing through the responsive ladder, Lighthouse, and the RTL/LTR flip test.

Total effort estimate: **~1.5–2 days** of focused work for Phase 1 with placeholder content.

---

*This brief is a contract, not a spec. If anything below feels wrong, push back now — changing the brief is cheap; changing committed code is not.*
