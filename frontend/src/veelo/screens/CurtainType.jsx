// ── CurtainType — Step 2 of the Veelo flow ───────────────────────────────────
// User picks a curtain type, and optionally enables precision mode.
//
// Card UI — each type shown as a tall photo card:
//   • Dark photo area (top 62%) shows the actual product photo.
//   • Name + descriptor text below on a surface background.
//   • Selected state: accent border + ✓ badge in top-right corner.
//   • Falls back gracefully to an illustrated SVG if the photo hasn't been
//     dropped into assets/site/curtain-types/ yet.
//
// To swap photos: replace the PNGs in /assets/site/curtain-types/ — no code change needed.

import { useState } from 'react'
import TopBar      from '../components/TopBar.jsx'
import BottomNav   from '../components/BottomNav.jsx'
import MobileMenu  from '../components/MobileMenu.jsx'
import { useDesktop } from '../hooks/useDesktop.js'
import { useT } from '../../i18n/useT.js'
import { IconScissors } from '../components/icons.jsx'

// ── Curtain type definitions ─────────────────────────────────────────────────
// `photo`  → path served from /assets/site/curtain-types/ (Vite dev + Netlify prod)
// `descKey` → i18n key for the one-line descriptor under the name

const CURTAIN_TYPES = [
  {
    value:   'eyelet',
    photo:   '/assets/site/curtain-types/eyelet.png',
    descKey: 'app.curtain_type.desc_eyelet',
    svgFill: '#8B7355',
  },
  {
    value:   'pleated',
    photo:   '/assets/site/curtain-types/pleated.png',
    descKey: 'app.curtain_type.desc_pleated',
    svgFill: '#9A8268',
  },
  {
    value:   'roman',
    photo:   '/assets/site/curtain-types/roman.png',
    descKey: 'app.curtain_type.desc_roman',
    svgFill: '#7A6B57',
  },
  {
    value:   'roller',
    photo:   '/assets/site/curtain-types/roller.png',
    descKey: 'app.curtain_type.desc_roller',
    svgFill: '#8C7B68',
  },
  {
    value:   'zebra',
    photo:   '/assets/site/curtain-types/zebra.png',
    descKey: 'app.curtain_type.desc_zebra',
    svgFill: '#A09080',
  },
]

// ── Fallback SVG icons (shown until real photos arrive) ───────────────────────
// Each is a tiny, recognisable silhouette of the curtain style.
function FallbackSVG({ value, fill }) {
  const base = { width: '100%', height: '100%' }
  switch (value) {
    case 'eyelet':
      return (
        <svg viewBox="0 0 100 140" style={base} xmlns="http://www.w3.org/2000/svg">
          {/* Rod */}
          <rect x="5" y="12" width="90" height="5" rx="2.5" fill="#555" />
          {/* Rings */}
          {[18,32,46,60,74,86].map(x => (
            <circle key={x} cx={x} cy="14.5" r="5" fill="none" stroke={fill} strokeWidth="2.5" />
          ))}
          {/* Fabric panels */}
          <path d="M10 18 Q14 60 10 120 L90 120 Q86 60 90 18 Z" fill={fill} opacity=".85" />
          <line x1="25" y1="18" x2="25" y2="120" stroke="rgba(0,0,0,.12)" strokeWidth="1" />
          <line x1="50" y1="18" x2="50" y2="120" stroke="rgba(0,0,0,.12)" strokeWidth="1" />
          <line x1="75" y1="18" x2="75" y2="120" stroke="rgba(0,0,0,.12)" strokeWidth="1" />
        </svg>
      )
    case 'pleated':
      return (
        <svg viewBox="0 0 100 140" style={base} xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="10" width="90" height="4" rx="2" fill="#555" />
          {/* Pleated fabric — alternating light/dark folds */}
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <rect key={i} x={5 + i*9} y="14" width="5" height="110" rx="1"
              fill={fill} opacity={i%2===0 ? 0.9 : 0.55} />
          ))}
          <rect x="5" y="14" width="90" height="110" rx="1" fill={fill} opacity=".08" />
        </svg>
      )
    case 'roman':
      return (
        <svg viewBox="0 0 100 140" style={base} xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="8" width="90" height="4" rx="2" fill="#555" />
          {/* Horizontal folds */}
          <rect x="10" y="12" width="80" height="118" rx="2" fill={fill} opacity=".7" />
          {[38,62,86].map(y => (
            <g key={y}>
              <rect x="10" y={y} width="80" height="6" rx="0" fill={fill} opacity=".9" />
              <line x1="10" y1={y} x2="90" y2={y} stroke="rgba(0,0,0,.15)" strokeWidth="1" />
            </g>
          ))}
        </svg>
      )
    case 'zebra':
      return (
        <svg viewBox="0 0 100 140" style={base} xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="80" height="10" rx="5" fill="#555" />
          {/* Alternating sheer/opaque stripes */}
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="15" y={20 + i * 13} width="70" height="13" rx="0"
              fill={fill} opacity={i % 2 === 0 ? 0.85 : 0.25} />
          ))}
          <line x1="82" y1="20" x2="82" y2="125" stroke="#888" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="82" cy="128" r="4" fill="#888" />
        </svg>
      )
    case 'roller':
    default:
      return (
        <svg viewBox="0 0 100 140" style={base} xmlns="http://www.w3.org/2000/svg">
          {/* Roller tube */}
          <rect x="10" y="10" width="80" height="10" rx="5" fill="#555" />
          {/* Flat blind */}
          <rect x="15" y="20" width="70" height="100" rx="1" fill={fill} opacity=".85" />
          {/* Subtle horizontal texture lines */}
          {[40,60,80,100].map(y => (
            <line key={y} x1="15" y1={y} x2="85" y2={y} stroke="rgba(0,0,0,.07)" strokeWidth="1" />
          ))}
          {/* Bead chain */}
          <line x1="82" y1="20" x2="82" y2="125" stroke="#888" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="82" cy="128" r="4" fill="#888" />
        </svg>
      )
  }
}

// ── Photo card ────────────────────────────────────────────────────────────────
function CurtainCard({ type, active, onClick, isDesktop, fullWidth = false }) {
  const t = useT()
  const [imgError, setImgError] = useState(false)

  const label = t(`app.configure.${type.value}`)
  const desc  = t(type.descKey)

  // Full-width (last odd card) gets a landscape-ish height so it doesn't look stretched
  const cardHeight = fullWidth
    ? (isDesktop ? 160 : 170)
    : (isDesktop ? 200 : 220)

  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--surface)',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
        height: cardHeight,
        transition: 'border-color var(--duration), box-shadow var(--duration)',
        boxShadow: active
          ? '0 0 0 3px var(--accent-glow), 0 4px 16px rgba(0,0,0,.12)'
          : '0 1px 4px rgba(0,0,0,.06)',
      }}
    >
      {/* ── Photo area ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 62%',
        background: '#f0ece6',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {!imgError ? (
          <img
            src={type.photo}
            alt={label}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        ) : (
          /* Graceful SVG fallback until real photos are in the assets folder */
          <div style={{ width: '100%', height: '100%', padding: '16px 20%' }}>
            <FallbackSVG value={type.value} fill={type.svgFill} />
          </div>
        )}

        {/* ── Selected checkmark badge ──────────────────────────────────── */}
        {active && (
          <div style={{
            position: 'absolute',
            top: 8, right: 8,
            width: 22, height: 22,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem',
            color: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.35)',
          }}>
            ✓
          </div>
        )}
      </div>

      {/* ── Text area ──────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: '9px 11px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        background: active ? 'var(--accent-dim)' : 'var(--surface)',
        transition: 'background var(--duration)',
      }}>
        <div style={{
          fontSize: '0.8rem',
          fontWeight: active ? 700 : 600,
          color: active ? 'var(--accent)' : 'var(--ink)',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '0.62rem',
          color: active ? 'var(--accent)' : 'var(--text-3)',
          lineHeight: 1.4,
          opacity: active ? 0.85 : 1,
        }}>
          {desc}
        </div>
      </div>
    </button>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CurtainType({ roomUrl, onBack, onDone }) {
  const t         = useT()
  const isDesktop = useDesktop()
  const [selectedType, setSelectedType] = useState('')
  const [precision,    setPrecision]    = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)

  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          height: 4, borderRadius: 2,
          width: i === 1 ? 24 : 14,
          background: i <= 1 ? 'var(--accent)' : 'var(--surface-3)',
          transition: 'width var(--duration)',
        }} />
      ))}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginLeft: 4 }}>
        {t('app.curtain_type.step')}
      </span>
    </div>
  )

  // ── Shared controls ────────────────────────────────────────────────────────
  const controls = (
    <>
      {/* Section label */}
      <div style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        marginBottom: 12, marginTop: 16,
      }}>
        {t('app.curtain_type.title')}
      </div>

      {/* Photo-card grid — 2 cols; last odd card spans full width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 20,
      }}>
        {CURTAIN_TYPES.map((type, i) => (
          <div
            key={type.value}
            style={
              // If there's an odd number of types, span the last card across both columns
              CURTAIN_TYPES.length % 2 !== 0 && i === CURTAIN_TYPES.length - 1
                ? { gridColumn: '1 / -1' }
                : undefined
            }
          >
            <CurtainCard
              type={type}
              active={selectedType === type.value}
              onClick={() => setSelectedType(type.value)}
              isDesktop={isDesktop}
              fullWidth={CURTAIN_TYPES.length % 2 !== 0 && i === CURTAIN_TYPES.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Precision mode toggle */}
      <div
        onClick={() => setPrecision(p => !p)}
        style={{
          background: precision ? 'rgba(192,112,80,.06)' : 'var(--surface)',
          border: `1px solid ${precision ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--r-md)',
          padding: '12px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          cursor: 'pointer',
          transition: 'all var(--duration)',
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 600,
            color: precision ? 'var(--accent)' : 'var(--ink)',
            marginBottom: 3,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            🎯 {t('app.curtain_type.precision_label')}
          </div>
          <div style={{ fontSize: '0.67rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
            {t('app.curtain_type.precision_hint')}
          </div>
        </div>
        {/* Toggle pill */}
        <div style={{
          width: 42, height: 24, borderRadius: 12,
          flexShrink: 0, marginTop: 2,
          background: precision ? 'var(--accent)' : 'var(--surface-3)',
          position: 'relative', transition: 'background var(--duration)',
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3,
            left: precision ? 21 : 3,
            transition: 'left var(--duration)',
            boxShadow: '0 1px 3px rgba(0,0,0,.25)',
          }} />
        </div>
      </div>

      {/* Continue CTA */}
      <button
        onClick={() => selectedType && onDone(selectedType, precision)}
        disabled={!selectedType}
        style={{
          width: '100%', padding: '13px 20px',
          borderRadius: 'var(--r-md)',
          background: selectedType ? 'var(--ink)' : 'var(--surface-3)',
          color: selectedType ? 'var(--text-on-ink)' : 'var(--text-3)',
          fontSize: '0.85rem', fontWeight: 600,
          letterSpacing: '0.04em',
          border: 'none',
          cursor: selectedType ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background var(--duration)',
        }}
      >
        <span>{t('app.curtain_type.continue')}</span>
        <span style={{ opacity: .55, fontSize: '1.1rem' }}>→</span>
      </button>
    </>
  )

  // ── Room photo thumbnail ───────────────────────────────────────────────────
  const roomThumb = roomUrl && (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-ink)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <img
        src={roomUrl}
        alt="Room"
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: isDesktop ? 'calc(100vh - 160px)' : 'min(32vh, 240px)',
          width: 'auto',
          height: 'auto',
        }}
      />
    </div>
  )

  // ── Desktop: side-by-side ─────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <TopBar title={t('app.curtain_type.title')} onBack={onBack} right={stepIndicator} />

        <div style={{
          flex: 1, minHeight: 0,
          display: 'grid',
          gridTemplateColumns: roomUrl ? '1fr 360px' : '1fr',
          gap: 0,
        }}>
          {roomUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 32,
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              overflow: 'hidden',
            }}>
              {roomThumb}
            </div>
          )}

          <div className="scroll" style={{
            overflowY: 'auto',
            padding: '8px 24px',
            paddingBottom: 'calc(var(--nav-height) + 24px)',
          }}>
            {controls}
          </div>
        </div>

        <BottomNav activeIcon={IconScissors} activeLabel={t('app.curtain_type.nav_label')} hasPhoto={true} onMenu={() => setMenuOpen(true)} />
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    )
  }

  // ── Mobile: stacked ───────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar title={t('app.curtain_type.title')} onBack={onBack} right={stepIndicator} />

      <div className="scroll" style={{
        flex: 1, overflowY: 'auto',
        padding: '0 20px',
        paddingBottom: 'calc(var(--nav-height) + 20px)',
      }}>
        {roomUrl && (
          <div style={{ margin: '14px 0 4px' }}>
            {roomThumb}
          </div>
        )}
        {controls}
      </div>

      <BottomNav activeIcon={IconScissors} activeLabel={t('app.curtain_type.nav_label')} hasPhoto={true} onMenu={() => setMenuOpen(true)} />
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
