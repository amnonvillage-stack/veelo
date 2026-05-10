// ── Logo ──────────────────────────────────────────────────────────────────────
// Inline SVG wordmark — matches the Vicky Israel brand logo.
// Font: Bodoni Moda (high-contrast serif) loaded via Google Fonts in index.html.
// Using inline SVG keeps the font rendering sharp at all sizes, lets CSS
// variables control the colour, and avoids the font-loading issue that affects
// SVGs loaded as <img> tags.
//
// Props:
//   height  — rendered height in px (width scales proportionally via viewBox)
//   color   — fill colour override; defaults to --brand-bronze token
//   style   — additional style overrides

export default function Logo({ height = 48, color, style = {} }) {
  const fill = color || 'var(--brand-bronze, #8B6549)'

  return (
    <svg
      viewBox="0 0 760 318"
      height={height}
      width="auto"
      aria-label="Vicky Israel · Textile & Design Studio"
      role="img"
      style={{ display: 'block', ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* VICKY */}
      <text
        x="380" y="148"
        fontFamily="'Bodoni Moda', Georgia, serif"
        fontSize="152"
        fontWeight="800"
        fill={fill}
        textAnchor="middle"
        letterSpacing="6"
      >VICKY</text>

      {/* ISRAEL */}
      <text
        x="380" y="278"
        fontFamily="'Bodoni Moda', Georgia, serif"
        fontSize="152"
        fontWeight="800"
        fill={fill}
        textAnchor="middle"
        letterSpacing="3"
      >ISRAEL</text>

      {/* Subtitle */}
      <text
        x="380" y="312"
        fontFamily="'DM Sans', system-ui, sans-serif"
        fontSize="20"
        fontWeight="600"
        fill={fill}
        textAnchor="middle"
        letterSpacing="7"
      >TEXTILE &amp; DESIGN STUDIO</text>
    </svg>
  )
}
