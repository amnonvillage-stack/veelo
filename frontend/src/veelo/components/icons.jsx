// ── Veelo SVG Icon Set ────────────────────────────────────────────────────────
// Minimal, 24×24 line-icon set (Feather-style, stroke-based).
// All icons use currentColor so they inherit from parent text colour.

const defaults = { size: 20, strokeWidth: 1.75 }

export function IconArrowLeft({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  )
}

export function IconHome({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

export function IconHeart({ size = defaults.size, filled = false, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function IconShare({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

export function IconGrid({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

export function IconSearch({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconX({ size = 16, strokeWidth = 2 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconCheck({ size = 16, strokeWidth = 2.5 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function IconMenu({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function IconSparkles({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.76H20l-4.94 3.59 1.88 5.76L12 14.52l-4.94 3.59 1.88-5.76L4 8.76h6.12L12 3z" />
      <path d="M5 3v3M3 5h3M19 18v3M17 20h3" strokeWidth="1.5" />
    </svg>
  )
}

export function IconScissors({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </svg>
  )
}

export function IconCamera({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function IconChevronRight({ size = 16, strokeWidth = 2 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconStar({ size = 14, filled = false, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function IconSettings({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconImage({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export function IconUpload({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

export function IconLightbulb({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  )
}

export function IconTrash({ size = defaults.size, strokeWidth = defaults.strokeWidth } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

export function IconWhatsApp({ size = defaults.size } = {}) {
  // WhatsApp-style phone-in-bubble icon (filled path, matches brand silhouette)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.527 3.66 1.438 5.168L2 22l4.978-1.406A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2Zm0 18a7.96 7.96 0 0 1-4.048-1.103l-.29-.172-2.954.835.802-2.88-.19-.298A7.96 7.96 0 0 1 4 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8Zm4.406-5.845c-.242-.121-1.432-.707-1.654-.787-.222-.08-.384-.121-.545.121-.161.242-.625.787-.766.949-.14.161-.282.181-.524.06-.242-.12-1.022-.376-1.946-1.197-.719-.64-1.204-1.43-1.345-1.671-.14-.242-.015-.373.106-.494.109-.108.242-.282.363-.423.12-.14.161-.242.242-.403.08-.162.04-.303-.02-.424-.062-.12-.546-1.315-.748-1.8-.197-.472-.397-.408-.546-.415l-.464-.008c-.161 0-.424.06-.646.303s-.847.828-.847 2.02.867 2.343.988 2.505c.121.161 1.707 2.606 4.136 3.652.578.25 1.03.398 1.382.51.58.184 1.109.158 1.527.096.466-.07 1.432-.585 1.634-1.15.2-.565.2-1.049.14-1.15-.06-.1-.222-.161-.464-.282Z" />
    </svg>
  )
}

// ── Curtain-type pictograms ───────────────────────────────────────────────────
// Used in Configure screen to visually distinguish curtain styles.

export function IconCurtainPleated({ size = 32 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Hanging rod */}
      <line x1="4" y1="5" x2="28" y2="5" />
      {/* Pleated folds — three wavy drapes */}
      <path d="M7 5 Q8.5 12 7 19 Q8.5 26 7 32" />
      <path d="M12 5 Q13.5 12 12 19 Q13.5 26 12 32" />
      <path d="M17 5 Q18.5 12 17 19 Q18.5 26 17 32" />
      <path d="M22 5 Q23.5 12 22 19 Q23.5 26 22 32" />
      <path d="M27 5 Q28 12 27 19 Q28 26 27 32" />
    </svg>
  )
}

export function IconCurtainEyelet({ size = 32 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Rod */}
      <line x1="3" y1="5" x2="29" y2="5" />
      {/* Eyelet rings */}
      <circle cx="8"  cy="5" r="2.5" />
      <circle cx="16" cy="5" r="2.5" />
      <circle cx="24" cy="5" r="2.5" />
      {/* Flat panels hanging from rings */}
      <path d="M5.5 7.5 L5.5 30 Q8 32 10.5 30 L10.5 7.5" />
      <path d="M13.5 7.5 L13.5 30 Q16 32 18.5 30 L18.5 7.5" />
      <path d="M21.5 7.5 L21.5 30 Q24 32 26.5 30 L26.5 7.5" />
    </svg>
  )
}

export function IconCurtainRoman({ size = 32 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Flat panel */}
      <rect x="5" y="5" width="22" height="26" rx="1" />
      {/* Horizontal fold lines */}
      <line x1="5" y1="12" x2="27" y2="12" />
      <line x1="5" y1="19" x2="27" y2="19" />
      <line x1="5" y1="26" x2="27" y2="26" />
    </svg>
  )
}

export function IconCurtainRoller({ size = 32 } = {}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      {/* Roller tube */}
      <rect x="3" y="3" width="26" height="6" rx="3" />
      {/* Flat fabric drop */}
      <rect x="6" y="9" width="20" height="20" rx="1" />
      {/* Bottom hem */}
      <line x1="6" y1="29" x2="26" y2="29" />
      {/* Pull cord */}
      <line x1="16" y1="29" x2="16" y2="32" />
      <circle cx="16" cy="32" r="1" fill="currentColor" />
    </svg>
  )
}
