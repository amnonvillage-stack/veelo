import { useRef, useState, useEffect, useCallback } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

// ── MarkWindow — step 5 in the v1.3 flow ──────────────────────────────────────
// Comes after the user has uploaded a photo. They mark the 4 corners of the curtain
// area + enter real-world width/height in cm.
//
// Extracted from the original Configure.jsx — same canvas/anchor logic as before.
// Curtain type is no longer chosen here (it lives in ConfigureCurtain), so this
// screen is purely about spatial constraint + dimensions.

// ── Drawing helpers ───────────────────────────────────────────────────────────
function drawScene(canvas, img, points, dragIdx) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  if (img) ctx.drawImage(img, 0, 0, W, H)

  if (points.length === 0) return

  const lw = Math.max(2, W / 250)
  const hr = Math.max(10, W / 55)

  // Curtain-area polygon (amber)
  if (points.length === 4) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = 'rgba(192,112,80,0.10)'
    ctx.fill()
    ctx.strokeStyle = 'var(--accent, #c07050)'
    ctx.lineWidth = lw
    ctx.stroke()
    ctx.restore()
  } else {
    // Partial path
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = 'var(--accent, #c07050)'
    ctx.lineWidth = lw
    ctx.setLineDash([lw * 4, lw * 3])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  const labels = ['A', 'B', 'C', 'D']
  points.forEach((p, i) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, hr + lw * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(p.x, p.y, hr, 0, Math.PI * 2)
    ctx.fillStyle = dragIdx === i ? '#d49070' : '#c07050'
    ctx.fill()

    ctx.strokeStyle = '#fff'
    ctx.lineWidth = lw * 1.5
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(hr * 1.05)}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels[i], p.x, p.y)
  })
}

function getCanvasPos(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect()
  return {
    x: (clientX - r.left) * (canvas.width  / r.width),
    y: (clientY - r.top)  * (canvas.height / r.height),
  }
}

function hitPoint(pts, px, py, canvas) {
  const r   = canvas.getBoundingClientRect()
  const thr = 22 * (canvas.width / r.width)
  for (let i = 0; i < pts.length; i++) {
    const dx = pts[i].x - px, dy = pts[i].y - py
    if (dx*dx + dy*dy < thr*thr) return i
  }
  return -1
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MarkWindow({
  roomUrl,
  initialPoints,
  initialWidthCm,
  initialHeightCm,
  curtainType,    // shown as a read-only badge (set on ConfigureCurtain)
  onBack,
  onDone,
}) {
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)
  const dragRef   = useRef(-1)

  const [points, setPoints] = useState(initialPoints || [])
  const [czW,    setCzW]    = useState(initialWidthCm  || '')
  const [czH,    setCzH]    = useState(initialHeightCm || '')

  // Load room image into canvas
  useEffect(() => {
    if (!roomUrl) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      redraw()
    }
    img.src = roomUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    drawScene(canvas, imgRef.current, points, dragRef.current)
  }, [points])

  useEffect(() => { redraw() }, [redraw])

  // Pointer events
  const onPointerDown = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getCanvasPos(canvas, e.clientX, e.clientY)

    const hi = hitPoint(points, pos.x, pos.y, canvas)
    if (hi !== -1) {
      dragRef.current = hi
      canvas.setPointerCapture(e.pointerId)
      e.preventDefault()
      return
    }

    if (points.length < 4) {
      setPoints(prev => [...prev, pos])
      e.preventDefault()
    }
  }, [points])

  const onPointerMove = useCallback(e => {
    if (dragRef.current === -1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getCanvasPos(canvas, e.clientX, e.clientY)
    setPoints(prev => {
      const next = [...prev]
      next[dragRef.current] = pos
      return next
    })
    e.preventDefault()
  }, [])

  const onPointerUp = useCallback(() => { dragRef.current = -1 }, [])
  const clearPoints = () => setPoints([])

  const handleContinue = () => {
    onDone({ points, widthCm: czW, heightCm: czH })
  }

  // Step 4 of 5 user-facing steps (config, email, photo, mark, results)
  const STEP = 4, TOTAL = 5

  const canContinue = roomUrl && points.length === 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <TopBar
        title="Mark the curtain area"
        onBack={onBack}
        right={
          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
            Step {STEP} of {TOTAL}
          </span>
        }
      />

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '4px 0 10px' }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i + 1 === STEP ? 28 : 14,
            background: i + 1 <= STEP ? 'var(--accent)' : 'var(--surface-3)',
          }} />
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        flex: '1 1 0', minHeight: '42vh',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ink)', overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%', maxHeight: '100%',
            touchAction: 'none', cursor: 'crosshair',
            display: 'block',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        {points.length < 4 && roomUrl && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(26,22,16,.85)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 'var(--r-full)',
            padding: '5px 16px',
            fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {points.length === 0
              ? 'Tap the 4 corners where the curtain will hang'
              : `Corner ${points.length} of 4 placed — ${4 - points.length} to go`}
          </div>
        )}

        {!roomUrl && (
          <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
            No photo loaded — go back and capture a room photo
          </div>
        )}

        {/* Tip overlay — appears once 4 corners are placed, reinforces that
            the area, not the window, is what's being measured. */}
        {points.length === 4 && roomUrl && (
          <div style={{
            position: 'absolute', bottom: 16, left: 12, right: 12,
            background: 'rgba(26,22,16,.85)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 'var(--r-md)',
            padding: '8px 14px',
            fontSize: '0.7rem', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 8,
            pointerEvents: 'none',
            lineHeight: 1.4,
          }}>
            <span style={{ fontSize: '0.9rem' }}>📐</span>
            <span>This is your <strong>curtain</strong> — drag corners to adjust. Now enter the size below.</span>
          </div>
        )}

        {/* Curtain-type badge (read-only, contextual) */}
        {curtainType && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(26,22,16,.8)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 'var(--r-full)',
            padding: '4px 12px',
            fontSize: '0.66rem', color: '#fff', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {curtainType}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div className="scroll" style={{
        flex: '0 1 auto',
        maxHeight: '50vh',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'calc(var(--nav-height) + 4px)',
        overflowY: 'auto',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '10px auto 14px' }} />

        <div style={{
          display: 'flex', gap: 8, padding: '0 20px 12px',
          fontSize: '0.68rem', color: 'var(--text-2)', alignItems: 'center',
        }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>● Where the curtain hangs</span>
          {points.length > 0 && (
            <button
              onClick={clearPoints}
              style={{
                marginLeft: 'auto', fontSize: '0.66rem', color: 'var(--text-3)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ height: 1, background: 'var(--border)', margin: '0 20px 12px' }} />

        {/* Dimensions — these are CURTAIN dimensions (not the window itself).
            The 4 corners above define WHERE the curtain hangs; these inputs
            tell us the real-world size of that area, which drives the price
            estimate and helps the model render at the correct scale. */}
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4,
          }}>
            Curtain size
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>
              {' '}(needed for accurate price)
            </span>
          </div>
          <div style={{
            fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 10, lineHeight: 1.5,
          }}>
            How wide and how tall do you want the finished curtain to be — measure the area you marked above, including any extension beyond the window frame.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
              }}>Curtain width (cm)</div>
              <input
                type="number"
                value={czW}
                onChange={e => setCzW(e.target.value)}
                placeholder="e.g. 160"
                style={{
                  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                  borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: '0.88rem',
                  fontWeight: 700, color: 'var(--ink)', outline: 'none',
                }}
              />
            </div>
            <div>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
              }}>Curtain drop (cm)</div>
              <input
                type="number"
                value={czH}
                onChange={e => setCzH(e.target.value)}
                placeholder="e.g. 240"
                style={{
                  width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                  borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: '0.88rem',
                  fontWeight: 700, color: 'var(--ink)', outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 20px 0' }}>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            style={{
              width: '100%', padding: '14px', borderRadius: 'var(--r-md)',
              background: canContinue ? 'var(--ink)' : 'var(--surface-3)',
              color: canContinue ? 'var(--bg)' : 'var(--text-3)',
              fontSize: '0.85rem', fontWeight: 500,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              border: 'none',
              cursor: canContinue ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background var(--duration)',
            }}
          >
            <span>Visualise →</span>
            <span style={{ opacity: 0.6 }}>→</span>
          </button>
        </div>
      </div>

      <BottomNav activeIcon="📐" activeLabel="Mark" />
    </div>
  )
}
