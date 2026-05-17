// ── BottomNav ─────────────────────────────────────────────────────────────────
// Three-item bottom tab bar shared by all Veelo screens.
// On mobile: full-width bar pinned to bottom.
// On desktop: centered pill bar floating above the viewport edge.
//
// Props:
//   activeIcon   — SVG icon component for the centre/active tab
//   activeLabel  — label for the centre tab
//   onMenu       — optional callback when the Menu tab is tapped (mobile)
//
// Left tab:   "Vicky Israel" when no photo loaded → goes to /
//             "Visualizer"  when photo is loaded  → goes to /veelo (restart)
// Centre tab: current screen indicator (active, non-clickable)
// Right tab:  "Menu" — opens the slide-down navigation drawer

import { useDesktop } from '../hooks/useDesktop.js'
import { IconHome, IconMenu } from './icons.jsx'

// Tiny "exit" arrow icon — shown when no photo is loaded.
// Communicates "leave the tool and go back to the main site."
function IconSiteArrow({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M8 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4" />
      <path d="M11 3h6m0 0v6m0-6L9 11" />
    </svg>
  )
}

export default function BottomNav({ activeIcon: ActiveIcon, activeLabel, onMenu, hasPhoto = false }) {
  const isDesktop = useDesktop()

  // When no photo: exit to Vicky Israel marketing site.
  // When photo loaded: restart the visualizer flow (full reload resets state).
  const leftLabel  = hasPhoto ? 'Visualizer' : 'Vicky Israel'
  const leftAction = () => { window.location.href = hasPhoto ? '/veelo' : '/' }
  const LeftIcon   = hasPhoto ? IconHome : IconSiteArrow

  if (isDesktop) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        gap: 4,
        background: 'rgba(250,246,240,0.92)',
        backdropFilter: 'blur(14px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-full)',
        padding: '6px 8px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <NavItem
          label={leftLabel}
          icon={<LeftIcon size={18} />}
          active={false}
          onClick={leftAction}
          pill
          muted={!hasPhoto}
        />
        <NavItem
          label={activeLabel}
          icon={ActiveIcon ? <ActiveIcon size={18} /> : null}
          active={true}
          onClick={null}
          pill
        />
        <NavItem
          label="Menu"
          icon={<IconMenu size={18} />}
          active={false}
          onClick={onMenu || null}
          pill
        />
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      height: 'var(--nav-height)',
      background: 'var(--bg)',
      borderTop: '1px solid var(--border)',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      alignItems: 'stretch',
      padding: '0 0 env(safe-area-inset-bottom, 12px)',
      zIndex: 50,
    }}>
      <NavItem
        label={leftLabel}
        icon={<LeftIcon size={20} />}
        active={false}
        onClick={leftAction}
        muted={!hasPhoto}
      />
      <NavItem
        label={activeLabel}
        icon={ActiveIcon ? <ActiveIcon size={22} /> : null}
        active={true}
        onClick={null}
      />
      <NavItem
        label="Menu"
        icon={<IconMenu size={22} />}
        active={false}
        onClick={onMenu || null}
      />
    </div>
  )
}

function NavItem({ label, icon, active, onClick, pill, muted }) {
  if (pill) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          borderRadius: 'var(--r-full)',
          background: active ? 'var(--accent)' : 'transparent',
          color: active ? '#fff' : muted ? 'var(--text-4)' : 'var(--text-3)',
          border: 'none',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all var(--duration)',
          fontSize: muted ? '0.65rem' : '0.72rem',
          fontWeight: active ? 700 : 500,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          opacity: muted ? 0.7 : 1,
        }}
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingTop: 8,
        paddingBottom: 4,
        color: active ? 'var(--accent)' : muted ? 'var(--text-4)' : 'var(--text-3)',
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'color var(--duration)',
        position: 'relative',
        opacity: muted ? 0.65 : 1,
      }}
    >
      {/* Active indicator pill at top */}
      {active && (
        <div style={{
          position: 'absolute', top: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: 20, height: 3,
          borderRadius: '0 0 3px 3px',
          background: 'var(--accent)',
        }} />
      )}

      {/* Icon wrapper */}
      <div style={{
        width: 30, height: 30,
        borderRadius: 'var(--r-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--accent-dim)' : 'transparent',
        transition: 'background var(--duration)',
      }}>
        {icon}
      </div>

      {/* Label */}
      <span style={{
        fontSize: '0.56rem', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1,
      }}>
        {label}
      </span>
    </button>
  )
}
