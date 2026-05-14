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
// The Home tab always navigates to '/' (Vicky Israel site) via React Router.

import { useNavigate } from 'react-router-dom'
import { useDesktop } from '../hooks/useDesktop.js'
import { IconHome, IconMenu } from './icons.jsx'

export default function BottomNav({ activeIcon: ActiveIcon, activeLabel, onMenu }) {
  const navigate  = useNavigate()
  const isDesktop = useDesktop()

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
          label="Home"
          icon={<IconHome size={18} />}
          active={false}
          onClick={() => navigate('/veelo')}
          pill
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
        label="Home"
        icon={<IconHome size={22} />}
        active={false}
        onClick={() => navigate('/veelo')}
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

function NavItem({ label, icon, active, onClick, pill }) {
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
          color: active ? '#fff' : 'var(--text-3)',
          border: 'none',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all var(--duration)',
          fontSize: '0.72rem',
          fontWeight: active ? 700 : 500,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
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
        color: active ? 'var(--accent)' : 'var(--text-3)',
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'color var(--duration)',
        position: 'relative',
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
