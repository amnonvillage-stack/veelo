import { useState } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

// ── Name — step 2 in the v1.3 flow ────────────────────────────────────────────
// Replaces the old Email screen now that inquiries hand off via WhatsApp.
// We don't need the customer's phone — wa.me reveals it implicitly when they
// tap Send. We do still want a name so the founder sees a human, not an ID,
// when the WhatsApp message arrives.

export default function Name({ initialName, onBack, onContinue }) {
  const [name,    setName]    = useState(initialName || '')
  const [touched, setTouched] = useState(false)

  // Trim only on submit so users can type "Avi " without the trailing-space
  // erroring before they finish.
  const trimmed = name.trim()
  const valid = trimmed.length >= 1 && trimmed.length <= 80
  const showError = touched && name.length > 0 && !valid

  const STEP = 2, TOTAL = 5

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!valid) { setTouched(true); return }
    onContinue(trimmed)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar
        title="Your name"
        onBack={onBack}
        right={
          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
            Step {STEP} of {TOTAL}
          </span>
        }
      />

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '4px 0 16px' }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i + 1 === STEP ? 28 : 14,
            background: i + 1 <= STEP ? 'var(--accent)' : 'var(--surface-3)',
          }} />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '20px 24px',
          paddingBottom: 'calc(var(--nav-height) + 16px)',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem', fontWeight: 400,
          color: 'var(--ink)', lineHeight: 1.2,
          marginBottom: 12,
          letterSpacing: '-0.01em',
        }}>
          Who's reaching out?
        </div>
        <div style={{
          fontSize: '0.85rem', color: 'var(--text-2)',
          lineHeight: 1.5, marginBottom: 32, maxWidth: 320,
        }}>
          We'll greet you by name when you message us on WhatsApp at the end.
        </div>

        <label style={{
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--text-3)', marginBottom: 8,
        }}>
          Your name
        </label>
        <input
          type="text"
          autoFocus
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Lior"
          maxLength={80}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: showError
              ? '1.5px solid #c0524a'
              : '1.5px solid var(--border-2)',
            borderRadius: 'var(--r-md)',
            padding: '14px 16px',
            fontSize: '1rem',
            color: 'var(--ink)',
            outline: 'none',
            transition: 'border-color var(--duration)',
            marginBottom: showError ? 6 : 0,
          }}
        />
        {showError && (
          <div style={{ fontSize: '0.72rem', color: '#c0524a', marginBottom: 6 }}>
            Please enter your name (1–80 characters)
          </div>
        )}

        <div style={{
          fontSize: '0.7rem',
          color: 'var(--text-3)',
          marginTop: 14,
          lineHeight: 1.5,
        }}>
          We don't ask for your phone number — you'll send the inquiry from your own WhatsApp at the end of the flow.
        </div>

        <div style={{ flex: 1 }} />

        <button
          type="submit"
          disabled={!valid}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 'var(--r-md)',
            background: valid ? 'var(--ink)' : 'var(--surface-3)',
            color: valid ? 'var(--bg)' : 'var(--text-3)',
            fontSize: '0.9rem', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            border: 'none',
            cursor: valid ? 'pointer' : 'not-allowed',
            transition: 'background var(--duration)',
          }}
        >
          Continue →
        </button>
      </form>

      <BottomNav activeIcon="✦" activeLabel="Name" />
    </div>
  )
}
