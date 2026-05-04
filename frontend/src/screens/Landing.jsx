import BottomNav from '../components/BottomNav.jsx'

// ── Landing screen — entry point of the v1.3 flow ─────────────────────────────
// User journey: Landing → ConfigureCurtain → Email → Capture → MarkWindow → Results → Sent
// This screen sets the brand tone and explains the value prop in 5 seconds.
//
// Design notes:
//  • Single-purpose: one primary CTA ("Start designing"). Anything else is friction.
//  • Hero image is decorative — keep it lightweight (CSS gradient placeholder until
//    we have a real hero asset). TODO: swap for real lifestyle photo before launch.
//  • Three-step "how it works" strip helps set expectation that this is fast and free.

const S = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg)',
    position: 'relative',
  },
  header: {
    padding: '14px 22px 10px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'var(--font-display)',
    fontSize: '2.2rem',
    fontWeight: 300,
    letterSpacing: '0.04em',
    color: 'var(--ink)',
    lineHeight: 1,
  },
  logoItalic: { fontStyle: 'italic' },
  logoSub: {
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginTop: 4,
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 20px',
    paddingBottom: 'calc(var(--nav-height) + 24px)',
  },
  hero: {
    marginTop: 8,
    marginBottom: 22,
    borderRadius: 'var(--r-lg)',
    height: 240,
    overflow: 'hidden',
    position: 'relative',
    background:
      'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface-2) 60%, var(--surface) 100%)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'flex-end',
  },
  heroOverlay: {
    padding: '20px 22px',
    width: '100%',
    background:
      'linear-gradient(0deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 60%)',
  },
  heroEyebrow: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.7rem',
    fontWeight: 400,
    color: 'var(--ink)',
    lineHeight: 1.15,
    letterSpacing: '-0.01em',
  },
  heroSub: {
    fontSize: '0.82rem',
    color: 'var(--text-2)',
    marginTop: 10,
    lineHeight: 1.5,
    maxWidth: 320,
  },
  ctaPrimary: {
    width: '100%',
    padding: '15px 20px',
    fontSize: '0.92rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: '#fff',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--r-full)',
    cursor: 'pointer',
    marginBottom: 28,
    boxShadow: '0 4px 14px rgba(192,112,80,0.28)',
  },
  ctaSecondary: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '0.78rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--text-2)',
    background: 'transparent',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-full)',
    cursor: 'pointer',
    marginBottom: 28,
    marginTop: -16,
  },
  secLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginBottom: 14,
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    padding: '13px 14px',
  },
  stepNum: {
    width: 28,
    height: 28,
    flexShrink: 0,
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.78rem',
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontSize: '0.86rem',
    fontWeight: 600,
    color: 'var(--ink)',
  },
  stepSub: {
    fontSize: '0.72rem',
    color: 'var(--text-3)',
    marginTop: 2,
    lineHeight: 1.5,
  },
  trust: {
    fontSize: '0.7rem',
    color: 'var(--text-3)',
    textAlign: 'center',
    lineHeight: 1.6,
  },
}

const STEPS = [
  {
    title: 'Pick your style',
    sub: 'Choose curtain type, fabric, hanger and number of wings.',
  },
  {
    title: 'Snap your window',
    sub: 'Take a photo or upload one — mark the window and enter the size.',
  },
  {
    title: 'See it in your room',
    sub: 'Get a photo-real preview and a non-binding price estimate.',
  },
]

export default function Landing({ onStart, onAdmin }) {
  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>
            Vee<span style={S.logoItalic}>lo</span>
          </div>
          <div style={S.logoSub}>Curtain Visualiser</div>
        </div>
        <button
          onClick={onAdmin}
          title="Admin"
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem',
            cursor: 'pointer',
            color: 'var(--text-2)',
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Scroll body */}
      <div className="scroll" style={S.scroll}>

        {/* Hero */}
        <div style={S.hero}>
          <div style={S.heroOverlay}>
            <div style={S.heroEyebrow}>See it before you buy</div>
            <div style={S.heroTitle}>Your window,<br />reimagined.</div>
          </div>
        </div>

        <div style={S.heroSub}>
          Design custom curtains for your home and preview them — photo-real — on your
          actual window. No measurement guesswork, no surprises.
        </div>

        <div style={{ height: 22 }} />

        {/* Primary CTA */}
        <button style={S.ctaPrimary} onClick={onStart}>
          Start designing →
        </button>

        {/* How it works */}
        <div style={S.secLabel}>How it works</div>
        <div style={S.steps}>
          {STEPS.map((step, i) => (
            <div key={i} style={S.stepRow}>
              <div style={S.stepNum}>{i + 1}</div>
              <div style={S.stepBody}>
                <div style={S.stepTitle}>{step.title}</div>
                <div style={S.stepSub}>{step.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.trust}>
          Free to try · No commitment · ~2 minutes
        </div>

      </div>

      <BottomNav activeIcon="🏠" activeLabel="Home" />
    </div>
  )
}
