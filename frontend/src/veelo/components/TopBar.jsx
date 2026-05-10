// ── TopBar ────────────────────────────────────────────────────────────────────
// Shared top navigation bar used across all Veelo screens.
// Props:
//   title      — screen heading (string)
//   onBack     — if provided, shows a back-arrow button
//   right      — optional right-side slot (ReactNode)
//   style      — style overrides on the wrapper

import { IconArrowLeft } from './icons.jsx'

export default function TopBar({ title, onBack, right, style }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: 52,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      ...style,
    }}>
      {/* Left — back button + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--r-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background var(--duration)',
            }}
          >
            <IconArrowLeft size={18} />
          </button>
        )}
        {title && (
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        )}
      </div>

      {/* Right slot */}
      {right && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          marginLeft: 8,
        }}>
          {right}
        </div>
      )}
    </div>
  )
}
