// ── BottomNav ─────────────────────────────────────────────────────────────────
// Three-item bottom tab bar shared by all Veelo screens.
// Props:
//   activeIcon   — SVG icon component for the centre/active tab
//   activeLabel  — label for the centre tab
//
// The Home tab always navigates to '/' (Vicky Israel site) via React Router.

import { useNavigate } from 'react-router-dom'
import { IconHome, IconMenu } from './icons.jsx'

export default function BottomNav({ activeIcon: ActiveIcon, activeLabel }) {
  const navigate = useNavigate()

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

      {/* Home → Vicky Israel site */}
      <NavItem
        label="Home"
        icon={<IconHome size={22} />}
        active={false}
        onClick={() => navigate('/')}
      />

      {/* Current screen (active) */}
      <NavItem
        label={activeLabel}
        icon={ActiveIcon ? <ActiveIcon size={22} /> : null}
        active={true}
        onClick={null}
      />

      {/* Menu (future drawer) */}
      <NavItem
        label="Menu"
        icon={<IconMenu size={22} />}
        active={false}
        onClick={null}
      />

    </div>
  )
}

function NavItem({ label, icon, active, onClick }) {
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
