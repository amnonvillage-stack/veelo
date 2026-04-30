import { useRef, useState, useEffect, useCallback } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

const CURTAIN_TYPES = [
  { value: 'pleated',  label: 'Pleated' },
  { value: 'eyelet',   label: 'Eyelet'  },
  { value: 'roman',    label: 'Roman'   },
  { value: 'roller',   label: 'Roller'  },
]

// ── Drawing helpers ────────────────────────────────────────────────────────────
function drawScene(canvas, img, points, dragIdx) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  if (img) ctx.drawImage(img, 0, 0, W, H)

  if (points.length === 0) return

  const lw = Math.max(2, W / 250)
  const hr = Math.max(10, W / 55)

  // ── Curtain area polygon (amber) ──────────────────────────────────────────
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
    // Partial path while placing corners
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

  // Corner handles
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

// ── Component ──────────────────────────────────────────────────────────────────
export default function Configure({
  roomUrl, roomFile, analysis,
  initialPoints, initialType,
  onBack, onDone,
}) {
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)
  const dragRef   = useRef(-1)

  const [points,      setPoints]      = useState(initialPoints || [])
  const [curtainType, setCurtainType] = useState(initialType   || '')
  const [czW, setCzW] = useState('')
  const [czH, setCzH] = useState('')

  // ── Load room image ────────────────────────────────────────────────────────
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
  }, [roomUrl])

  // Pre-suggest corners from analysis (if available and none placed yet)
  useEffect(() => {
    if (!analysis || !imgRef.current || initialPoints?.length === 4) return
    const w = analysis.window
    if (!w || w.width_pct == null) return
    const W = imgRef.current.naturalWidth
    const H = imgRef.current.naturalHeight
    const x0 = W * (w.x_pct       / 100)
    const y0 = H * (w.top_pct     / 100)
    const x1 = x0 + W * (w.width_pct  / 100)
    const y1 = y0 + H * (w.height_pct / 100)
    setPoints([{ x:x0,y:y0 }, { x:x1,y:y0 }, { x:x1,y:y1 }, { x:x0,y:y1 }])
  }, [analysis])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgRef.current) return
    drawScene(canvas, imgRef.current, points, dragRef.current)
  }, [points])

  useEffect(() => { redraw() }, [redraw])

  // ── Pointer events ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback(e => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pos = getCanvasPos(canvas, e.clientX, e.clientY)

    // Hit existing handle → drag it
    const hi = hitPoint(points, pos.x, pos.y, canvas)
    if (hi !== -1) {
      dragRef.current = hi
      canvas.setPointerCapture(e.pointerId)
      e.preventDefault()
      return
    }

    // Place next corner (up to 4)
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

  // ── Continue ───────────────────────────────────────────────────────────────
  const handleContinue = () => {
    onDone(points, curtainType, czW, czH)
  }

  const canContinue = roomUrl != null

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <TopBar
        title="Mark curtain area"
        onBack={onBack}
        right={
          <span style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>Step 2 of 3</span>
        }
      />

      {/* Step dots */}
      <div style={{ display:'flex', gap:6, justifyContent:'center', padding:'0 0 10px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i === 0 ? 20 : i === 1 ? 28 : 14,
            background: i <= 1 ? 'var(--accent)' : 'var(--surface-3)',
          }} />
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ink)',
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            touchAction: 'none',
            cursor: 'crosshair',
            display: 'block',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        {/* Placement hint */}
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
              ? 'Tap the 4 corners of the curtain area'
              : `Corner ${points.length} of 4 placed — ${4 - points.length} to go`}
          </div>
        )}
        {!roomUrl && (
          <div style={{ color:'var(--text-3)', fontSize:'0.85rem' }}>
            No room photo loaded
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'calc(var(--nav-height) + 4px)',
      }}>
        <div style={{ width:36, height:4, borderRadius:2, background:'var(--border)', margin:'10px auto 14px' }} />

        {/* Legend + clear */}
        <div style={{ display:'flex', gap:8, padding:'0 20px 12px', fontSize:'0.68rem', color:'var(--text-2)', alignItems:'center' }}>
          <span style={{ color:'var(--accent)', fontWeight:600 }}>● Curtain area</span>
          {points.length > 0 && (
            <button onClick={clearPoints} style={{ marginLeft:'auto', fontSize:'0.66rem', color:'var(--text-3)', background:'none', border:'none', cursor:'pointer' }}>
              Clear
            </button>
          )}
        </div>
        <div style={{ height:1, background:'var(--border)', margin:'0 20px 12px' }} />

        {/* Curtain type */}
        <div style={{ padding:'0 20px 12px' }}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>
            Curtain type
          </div>
          <div className="scroll-x" style={{ display:'flex', gap:8 }}>
            {CURTAIN_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setCurtainType(t.value)}
                style={{
                  flexShrink: 0,
                  padding: '6px 16px',
                  borderRadius: 'var(--r-full)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  background: curtainType === t.value ? 'var(--accent-dim)' : 'var(--surface-2)',
                  border: curtainType === t.value ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                  color: curtainType === t.value ? 'var(--accent)' : 'var(--text-2)',
                  transition: 'all var(--duration)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height:1, background:'var(--border)', margin:'0 20px 12px' }} />

        {/* Dimensions */}
        <div style={{ padding:'0 20px 12px' }}>
          <div style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>
            Actual size <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--accent)', marginBottom:4 }}>Width (cm)</div>
              <input
                type="number"
                value={czW}
                onChange={e => setCzW(e.target.value)}
                placeholder="e.g. 145"
                style={{
                  width:'100%', background:'var(--surface-2)', border:'1px solid var(--border-2)',
                  borderRadius:'var(--r-sm)', padding:'8px 12px', fontSize:'0.88rem',
                  fontWeight:700, color:'var(--ink)', outline:'none',
                }}
              />
            </div>
            <div>
              <div style={{ fontSize:'0.58rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--accent)', marginBottom:4 }}>Height / drop (cm)</div>
              <input
                type="number"
                value={czH}
                onChange={e => setCzH(e.target.value)}
                placeholder="e.g. 240"
                style={{
                  width:'100%', background:'var(--surface-2)', border:'1px solid var(--border-2)',
                  borderRadius:'var(--r-sm)', padding:'8px 12px', fontSize:'0.88rem',
                  fontWeight:700, color:'var(--ink)', outline:'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Continue */}
        <div style={{ padding:'4px 20px 0' }}>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            style={{
              width:'100%', padding:'14px', borderRadius:'var(--r-md)',
              background: canContinue ? 'var(--ink)' : 'var(--surface-3)',
              color: canContinue ? 'var(--bg)' : 'var(--text-3)',
              fontSize:'0.85rem', fontWeight:500,
              letterSpacing:'0.06em', textTransform:'uppercase',
              border:'none', cursor: canContinue ? 'pointer' : 'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              transition:'background var(--duration)',
            }}
          >
            <span>Browse Catalogue</span>
            <span style={{ opacity:.6 }}>→</span>
          </button>
        </div>
      </div>

      <BottomNav activeIcon="✏️" activeLabel="Configure" />
    </div>
  )
}
