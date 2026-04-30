// Shared top navigation bar — back arrow + title + optional right slot

const S = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px 12px',
    background: 'var(--bg)',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 'var(--r-sm)',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    color: 'var(--ink)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background var(--duration)',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--ink)',
    letterSpacing: '-0.01em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
}

export default function TopBar({ title, onBack, right, style }) {
  return (
    <div style={{ ...S.bar, ...style }}>
      <div style={S.left}>
        {onBack && (
          <button style={S.backBtn} onClick={onBack} aria-label="Go back">
            ←
          </button>
        )}
        {title && <span style={S.title}>{title}</span>}
      </div>
      {right && <div style={S.right}>{right}</div>}
    </div>
  )
}
