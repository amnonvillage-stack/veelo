// VeeloIcon — curtain-window mark with AI sparkles.
// Two-tone: background circle + curtains in contrasting values.
//
// Props:
//   size    — diameter in px (default 56)
//   variant — 'light' (cream bg, dark curtains) | 'dark' (dark bg, cream curtains)
//             defaults to 'light'

export default function VeeloIcon({ size = 56, variant = 'light', style = {} }) {
  const light = variant === 'light'

  const bg      = light ? '#f0e8d8' : '#1c1612'
  const ink     = light ? '#1c1612' : '#f0e8d8'
  const curtain = light ? '#c8b99a' : '#b8a888'
  const fold    = light ? '#a89878' : '#8a7860'

  return (
    <svg
      viewBox="0 0 680 680"
      width={size}
      height={size}
      role="img"
      aria-label="Veelo curtain visualiser"
      style={{ display: 'block', flexShrink: 0, ...style }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="340" cy="340" r="300" fill={bg} />

      {/* Curtain rod */}
      <rect x="148" y="168" width="384" height="13" rx="6" fill={ink} />

      {/* Rings left */}
      {[205, 237, 269, 301].map(cx => (
        <circle key={cx} cx={cx} cy="174" r="7" fill="none" stroke={ink} strokeWidth="4" />
      ))}

      {/* Rings right */}
      {[379, 411, 443, 475].map(cx => (
        <circle key={cx} cx={cx} cy="174" r="7" fill="none" stroke={ink} strokeWidth="4" />
      ))}

      {/* Left curtain */}
      <path
        d="M 182 174 C 182 174,295 198,305 252 C 315 306,262 338,272 390 C 280 432,296 468,292 522 L 182 522 Z"
        fill={curtain}
      />
      <path
        d="M 262 174 C 262 174,292 212,297 252 C 302 292,266 324,269 374 C 272 414,283 454,280 522 L 262 522 Z"
        fill={fold}
      />

      {/* Right curtain */}
      <path
        d="M 498 174 C 498 174,385 198,375 252 C 365 306,418 338,408 390 C 400 432,384 468,388 522 L 498 522 Z"
        fill={curtain}
      />
      <path
        d="M 418 174 C 418 174,388 212,383 252 C 378 292,414 324,411 374 C 408 414,397 454,400 522 L 418 522 Z"
        fill={fold}
      />

      {/* Window frame */}
      <rect x="175" y="181" width="330" height="339" rx="4" fill="none" stroke={ink} strokeWidth="6" />
      <line x1="340" y1="181" x2="340" y2="520" stroke={ink} strokeWidth="4" />
      <line x1="175" y1="350" x2="505" y2="350" stroke={ink} strokeWidth="4" />

      {/* Window sill */}
      <rect x="157" y="519" width="366" height="16" rx="4" fill={ink} />

      {/* Sparkles */}
      <path
        d="M547,186 L552,207 L573,212 L552,217 L547,238 L542,217 L521,212 L542,207 Z"
        fill={ink}
      />
      <path
        d="M142,439 L145,452 L158,456 L145,460 L142,473 L139,460 L126,456 L139,452 Z"
        fill={ink}
      />
      <path
        d="M150,252 L152,260 L160,262 L152,264 L150,272 L148,264 L140,262 L148,260 Z"
        fill={ink}
      />
      <circle cx="558" cy="430" r="5" fill={ink} />
      <circle cx="564" cy="268" r="4" fill={fold} />
    </svg>
  )
}
