import { useEffect, useState, useRef } from 'react'

// ── RenderingAnimation ────────────────────────────────────────────────────────
// Minimal process indicator for the 15–30s Gemini call. A thin indeterminate
// progress bar plus a single cycling status line. No illustration, no SVG —
// just type and a moving accent. Designed to feel calm rather than busy.
//
// Props:
//   stage:   'preparing' | 'analysing' | 'generating'
//   compact: bool — overlay variant (used over an existing image during regen)

const STAGE_MESSAGES = {
  preparing: [
    'Preparing',
    'Loading your room',
  ],
  analysing: [
    'Reading your room',
    'Mapping the corners',
    'Studying the light',
  ],
  generating: [
    'Selecting fabric',
    'Hanging the curtain',
    'Refining details',
    'Almost there',
  ],
}

const MESSAGE_INTERVAL_MS = 2400

export default function RenderingAnimation({ stage = 'generating', compact = false }) {
  const messages = STAGE_MESSAGES[stage] || STAGE_MESSAGES.generating
  const [idx, setIdx] = useState(0)
  const idxRef = useRef(0)

  useEffect(() => { setIdx(0); idxRef.current = 0 }, [stage])

  useEffect(() => {
    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % messages.length
      setIdx(idxRef.current)
    }, MESSAGE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [messages.length])

  const onDark = !compact          // full-screen variant sits on dark image bg
  const textColor = onDark ? '#fff' : 'var(--ink)'
  const subColor  = onDark ? 'rgba(255,255,255,0.55)' : 'var(--text-3)'
  const trackColor = onDark ? 'rgba(255,255,255,0.15)' : 'var(--border)'
  const barColor   = onDark ? '#fff' : 'var(--accent)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: compact ? '0 24px' : '0 32px',
        width: '100%',
        maxWidth: 280,
        textAlign: 'center',
      }}
    >
      {/* Indeterminate progress line */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 2,
          background: trackColor,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0,
            width: '40%',
            background: barColor,
            borderRadius: 1,
            animation: 'veelo-bar 1.6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Cycling status line */}
      <div style={{ minHeight: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div
          key={`${stage}-${idx}`}
          style={{
            fontSize: '0.88rem',
            fontWeight: 500,
            color: textColor,
            letterSpacing: '0.01em',
            animation: 'veelo-fade 2.4s ease-in-out',
          }}
        >
          {messages[idx]}
        </div>
        {!compact && (
          <div style={{ fontSize: '0.7rem', color: subColor }}>
            15–30 seconds
          </div>
        )}
      </div>

      <style>{`
        @keyframes veelo-bar {
          0%   { left: -40%; }
          100% { left: 100%; }
        }
        @keyframes veelo-fade {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
