import { Link } from 'react-router-dom'
import { useT } from '../../i18n/useT.js'

// VeeloTeaser — dark band, deliberate "moment" before contact.
// CTA uses react-router <Link> so the SPA transition into Veelo is instant
// (no full page reload), preserving any visit context the founder wants to
// preserve later (utm tags, A/B variant, etc).
//
// Media well: an inline SVG phone mockup showing a "room photo" with a
// curtain swatch grid overlay — telegraphs what Veelo does in one glance.
// Replace later with a real screen recording / simulator screenshot once
// the production UI is locked.

export default function VeeloTeaser() {
  const t = useT()

  return (
    <section className="veelo-teaser section" id="veelo-teaser">
      <div className="container">
        <div className="veelo-teaser__grid">
          <div>
            <p className="eyebrow">{t('veelo.eyebrow')}</p>
            <h2 className="display-2">
              {t('veelo.headline_1')}
              <br />
              <em className="display-italic">{t('veelo.headline_2')}</em>
            </h2>
            <p className="veelo-teaser__lede">{t('veelo.lede')}</p>
            <Link to="/veelo" className="btn btn-on-dark">
              {t('veelo.cta')}
              <span className="arrow-forward" aria-hidden="true">&nbsp;→</span>
            </Link>
          </div>

          <div className="veelo-teaser__media">
            <img
              src="/assets/sitePhotos/main_lay.jpg"
              alt="Veelo curtain visualiser app on a phone"
              className="veelo-teaser__phone"
              loading="lazy"
              decoding="async"
              width="1376"
              height="768"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// Stylized phone frame with a "room behind window" inside and a curtain
// swatch picker below. Pure SVG — no asset request, scales cleanly.
function PhoneMockup() {
  // Six swatch tiles. Hex tones picked from the Vicky palette + neutrals
  // a customer would realistically swap between (sand, terracotta, sage,
  // bronze, charcoal, cream).
  const swatches = ['#e8d4b5', '#c07050', '#8a9b7c', '#8B6549', '#3a3530', '#faf6f0']
  const activeIndex = 1 // terracotta — matches the curtain shown in-frame

  return (
    <svg
      className="veelo-teaser__phone"
      viewBox="0 0 360 480"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      role="presentation"
    >
      <defs>
        {/* Phone body gradient — subtle metallic */}
        <linearGradient id="phone-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#2a2520" />
          <stop offset="100%" stopColor="#0f0c08" />
        </linearGradient>
        {/* Sky behind the simulated window */}
        <linearGradient id="phone-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3a2a1f" />
          <stop offset="60%" stopColor="#a05838" />
          <stop offset="100%" stopColor="#e8b894" />
        </linearGradient>
        {/* Sheer curtain panel inside the phone */}
        <linearGradient id="phone-curtain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c07050" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a05838" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      {/* Phone outer body */}
      <rect x="60" y="20" width="240" height="440" rx="32" fill="url(#phone-body)" />
      {/* Inner bezel inset */}
      <rect x="68" y="28" width="224" height="424" rx="26" fill="#1a1610" />

      {/* Screen */}
      <g>
        {/* Status bar */}
        <rect x="68" y="28" width="224" height="22" rx="0" fill="#1a1610" />
        <circle cx="180" cy="39" r="4" fill="#0f0c08" />

        {/* Room/window canvas */}
        <rect x="68" y="50" width="224" height="270" fill="url(#phone-sky)" />

        {/* Arched window inside the phone */}
        <path
          d="M 100 200 Q 100 110 180 110 Q 260 110 260 200 L 260 320 L 100 320 Z"
          fill="#fff2dc"
          opacity="0.55"
        />
        <line x1="180" y1="115" x2="180" y2="320" stroke="#3a2820" strokeWidth="1" opacity="0.4" />
        <line x1="100" y1="245" x2="260" y2="245" stroke="#3a2820" strokeWidth="1" opacity="0.4" />

        {/* Curtain panels — left and right of the window, terracotta */}
        <path
          d="M 68 50 L 130 50 Q 122 180 130 320 L 68 320 Z"
          fill="url(#phone-curtain)"
        />
        <path
          d="M 230 50 Q 238 180 230 320 L 292 320 L 292 50 Z"
          fill="url(#phone-curtain)"
        />

        {/* Floor band */}
        <rect x="68" y="305" width="224" height="15" fill="#1a1610" opacity="0.45" />

        {/* Swatch picker tray */}
        <rect x="68" y="320" width="224" height="132" fill="#faf6f0" />

        {/* Tray label */}
        <text
          x="180" y="344"
          textAnchor="middle"
          fontFamily="DM Sans, system-ui, sans-serif"
          fontWeight="700"
          fontSize="9"
          fill="#8B6549"
          letterSpacing="2.5"
        >
          CHOOSE YOUR FABRIC
        </text>

        {/* Six swatch tiles in a 6-column row */}
        {swatches.map((hex, i) => {
          const isActive = i === activeIndex
          const tileW = 28
          const tileGap = 6
          const totalW = swatches.length * tileW + (swatches.length - 1) * tileGap
          const startX = 180 - totalW / 2
          const x = startX + i * (tileW + tileGap)
          return (
            <g key={i}>
              <rect
                x={x}
                y={362}
                width={tileW}
                height={tileW}
                rx="6"
                fill={hex}
                stroke={isActive ? '#c07050' : '#e8e0d4'}
                strokeWidth={isActive ? 2 : 1}
              />
              {isActive && (
                <circle cx={x + tileW / 2} cy={400} r="2" fill="#c07050" />
              )}
            </g>
          )
        })}

        {/* CTA button inside the phone */}
        <rect x="100" y="412" width="160" height="32" rx="16" fill="#c07050" />
        <text
          x="180" y="432"
          textAnchor="middle"
          fontFamily="DM Sans, system-ui, sans-serif"
          fontWeight="500"
          fontSize="11"
          fill="#faf6f0"
          letterSpacing="0.5"
        >
          Preview on my window
        </text>
      </g>

      {/* Subtle screen reflection sweep */}
      <path
        d="M 68 28 L 180 28 L 100 452 L 68 452 Z"
        fill="#faf6f0"
        opacity="0.025"
      />
    </svg>
  )
}
