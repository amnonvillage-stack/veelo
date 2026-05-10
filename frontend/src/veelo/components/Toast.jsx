// ── Toast ─────────────────────────────────────────────────────────────────────
// Lightweight ephemeral notification (2 s auto-dismiss).
// Usage: <Toast message="Saved!" visible={toastVisible} />

const TOAST_CSS = `
@keyframes toast-in  { from { opacity:0; transform:translateY(8px) translateX(-50%); } to { opacity:1; transform:translateY(0) translateX(-50%); } }
@keyframes toast-out { from { opacity:1; } to { opacity:0; } }
`

export default function Toast({ message, visible, icon }) {
  if (!visible) return null
  return (
    <>
      <style>{TOAST_CSS}</style>
      <div style={{
        position: 'absolute',
        bottom: 'calc(var(--nav-height) + 14px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'var(--ink)',
        color: 'var(--text-on-ink)',
        borderRadius: 'var(--r-full)',
        padding: '10px 20px',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: 'var(--shadow-lg)',
        animation: 'toast-in 0.22s var(--ease-out) forwards',
      }}>
        {icon && <span style={{ lineHeight: 1 }}>{icon}</span>}
        {message}
      </div>
    </>
  )
}

// ── useToast hook — manages show/hide with auto-dismiss ───────────────────────
import { useState, useCallback, useRef } from 'react'

export function useToast(durationMs = 2200) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [icon,    setIcon]    = useState(null)
  const timerRef = useRef(null)

  const show = useCallback((msg, icn = null) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    setIcon(icn)
    setVisible(true)
    timerRef.current = setTimeout(() => setVisible(false), durationMs)
  }, [durationMs])

  return { visible, message, icon, show }
}
