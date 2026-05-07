import { useState } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

// ── Email — step 2 in the v1.3 flow ───────────────────────────────────────────
// Per PRD §3 & §9.4, the email is collected before the simulation so we have a way
// to send the inquiry summary later. PRD §13 flags this as a conversion risk and
// suggests moving it to the Send step (v1.3.1). Until that decision lands, we
// implement the email-up-front flow but keep this component dumb so it can later
// be re-pointed at the Send step with no logic changes.

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i

export default function Email({ initialEmail, onBack, onContinue }) {
  const [email, setEmail]     = useState(initialEmail || '')
  const [touched, setTouched] = useState(false)

  const valid = EMAIL_RX.test(email.trim())
  const showError = touched && email.length > 0 && !valid

  const STEP = 2, TOTAL = 5

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!valid) { setTouched(true); return }
    onContinue(email.trim().toLowerCase())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar
        title="Your email"
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
        {/* Hero copy */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem', fontWeight: 400,
          color: 'var(--ink)', lineHeight: 1.2,
          marginBottom: 12,
          letterSpacing: '-0.01em',
        }}>
          Where should we<br />send your design?
        </div>
        <div style={{
          fontSize: '0.85rem', color: 'var(--text-2)',
          lineHeight: 1.5, marginBottom: 32, maxWidth: 320,
        }}>
          We'll use your email to send a copy of your simulation and a non-binding price estimate.
        </div>

        {/* Email field */}
        <label style={{
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--text-3)', marginBottom: 8,
        }}>
          Email address
        </label>
        <input
          type="email"
          autoFocus
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="you@example.com"
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
            Please enter a valid email
          </div>
        )}

        {/* Privacy note */}
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--text-3)',
          marginTop: 14,
          lineHeight: 1.5,
        }}>
          We won't spam you. Your address is only used for this inquiry — no marketing without your consent.
        </div>

        {/* Spacer pushes CTA to bottom */}
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

      <BottomNav activeIcon="✉️" activeLabel="Email" />
    </div>
  )
}
