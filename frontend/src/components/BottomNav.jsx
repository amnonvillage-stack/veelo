const S = {
  nav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 'var(--nav-height)',
    background: 'var(--bg)',
    borderTop: '1px solid var(--border)',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    padding: '8px 0 20px',
    zIndex: 50,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    fontSize: '0.58rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: '2px 0',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
  },
}

const ITEMS = [
  { id: 'home',    label: 'Home',    icon: '🏠' },
  { id: 'active',  label: 'Current', icon: '✦'  },
  { id: 'menu',    label: 'Menu',    icon: '☰'  },
]

export default function BottomNav({ activeIcon, activeLabel }) {
  const items = [
    { id: 'home',  label: 'Home',      icon: '🏠' },
    { id: 'mid',   label: activeLabel, icon: activeIcon },
    { id: 'menu',  label: 'Menu',      icon: '☰'  },
  ]
  return (
    <div style={S.nav}>
      {items.map((item, i) => {
        const isActive = i === 1
        return (
          <button key={item.id} style={{
            ...S.item,
            color: isActive ? 'var(--accent)' : 'var(--text-3)',
          }}>
            <div style={{
              ...S.icon,
              background: isActive ? 'var(--accent-dim)' : 'transparent',
            }}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
