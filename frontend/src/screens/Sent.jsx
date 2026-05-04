import BottomNav from '../components/BottomNav.jsx'

// ── Sent — terminal confirmation screen for the v1.3 flow ─────────────────────
// User has just clicked "Send" on Results and POST /inquiry succeeded.
// We show a calm thank-you, what to expect, and one CTA to start over.

export default function Sent({ email, onStartOver }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--bg)',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '64px 24px 40px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', textAlign: 'center',
      }}>
        {/* Check mark badge */}
        <div style={{
          width: 84, height: 84, borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
          fontSize: '2.4rem',
          color: 'var(--accent)',
        }}>
          ✓
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.8rem', fontWeight: 400,
          color: 'var(--ink)', lineHeight: 1.2,
          marginBottom: 14, letterSpacing: '-0.01em',
        }}>
          Inquiry sent.
        </div>

        <div style={{
          fontSize: '0.92rem', color: 'var(--text-2)',
          lineHeight: 1.6, marginBottom: 8, maxWidth: 320,
        }}>
          We've received your design and will be in touch within 1 business day.
        </div>

        {email && (
          <div style={{
            fontSize: '0.78rem', color: 'var(--text-3)',
            marginBottom: 36,
          }}>
            A copy is on its way to <strong style={{ color: 'var(--text-2)' }}>{email}</strong>.
          </div>
        )}

        {/* What's next */}
        <div style={{
          width: '100%', maxWidth: 360,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '16px 18px',
          textAlign: 'left',
          marginBottom: 28,
        }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--text-3)', marginBottom: 10,
          }}>
            What happens next
          </div>
          <ol style={{
            margin: 0, paddingLeft: 20,
            fontSize: '0.84rem', color: 'var(--text-2)',
            lineHeight: 1.7,
          }}>
            <li>We review your simulation and dimensions.</li>
            <li>You'll get a final quote and lead time by email.</li>
            <li>If you're happy, we schedule production and install.</li>
          </ol>
        </div>

        <button
          onClick={onStartOver}
          style={{
            padding: '12px 28px', borderRadius: 'var(--r-full)',
            background: 'transparent',
            border: '1.5px solid var(--border-2)',
            color: 'var(--text-2)',
            fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Design another →
        </button>
      </div>

      <BottomNav activeIcon="✓" activeLabel="Sent" />
    </div>
  )
}
