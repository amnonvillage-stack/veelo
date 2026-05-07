import BottomNav from '../components/BottomNav.jsx'

// ── Sent — terminal confirmation screen for the v1.3 WhatsApp flow ────────────
// User has just clicked "Send" on Results: the backend persisted the inquiry
// and we opened wa.me in a new tab pre-filled with a Hebrew summary. Their
// WhatsApp app/web client is now showing the draft message — they still have
// to tap Send there to actually contact us. This screen exists for the moment
// they switch back to our tab: we confirm the inquiry was saved on our side
// and tell them what to expect next.
//
// The WhatsApp tab might have been blocked (popup blockers, mobile in-app
// browsers). We can't reliably detect that, so the copy is written to work
// either way: even if WhatsApp didn't open, the inquiry is recorded and the
// founder will see it.

export default function Sent({ name, onStartOver }) {
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
          {name ? `Thanks, ${name}.` : 'Thanks!'}
        </div>

        <div style={{
          fontSize: '0.92rem', color: 'var(--text-2)',
          lineHeight: 1.6, marginBottom: 8, maxWidth: 340,
        }}>
          Your design is queued. We just opened WhatsApp with a pre-written
          message — tap <strong style={{ color: 'var(--text-2)' }}>Send</strong> there
          to finish the handoff.
        </div>

        <div style={{
          fontSize: '0.78rem', color: 'var(--text-3)',
          marginBottom: 36, maxWidth: 320,
        }}>
          Didn't see WhatsApp open? Your inquiry is still saved on our side —
          we'll reach out from <strong style={{ color: 'var(--text-2)' }}>+972 52 377 0639</strong> shortly.
        </div>

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
            <li>You'll get a final quote and lead time on WhatsApp.</li>
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
