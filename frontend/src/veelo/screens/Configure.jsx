// ── Configure — Mark Curtain Area ────────────────────────────────────────────
// Step 2 of the Veelo flow.
// The user marks 4 corner points on their room photo to define the curtain zone,
// picks a curtain type, and optionally enters real-world dimensions.

import { useRef, useState, useEffect, useCallback } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MobileMenu from '../components/MobileMenu.jsx'
import { useDesktop } from '../hooks/useDesktop.js'
import { useT } from '../../i18n/useT.js'
import {
  IconCurtainPleated, IconCurtainEyelet,
  IconCurtainRoman, IconCurtainRoller,
  IconCamera,
} from '../components/icons.jsx'

const CURTAIN_TYPE_DEFS = [
  { value: 'pleated', key: 'pleated', Icon: IconCurtainPleated },
  { value: 'eyelet',  key: 'eyelet',  Icon: IconCurtainEyelet  },
  { value: 'roman',   key: 'roman',   Icon: IconCurtainRoman   },
  { value: 'roller',  key: 'roller',  Icon: IconCurtainRoller  },
]

// ── Canvas helpers ─────────────────────────────────────────────────────────────
function drawScene(canvas, img, points, dragIdx) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  if (img) ctx.drawImage(img, 0, 0, W, H)
  if (points.length === 0) return

  const lw = Math.max(2, W / 250)
  const hr = Math.max(10, W / 55)

  // Curtain area polygon
  if (points.length === 4) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = 'rgba(192,112,80,0.09)'
    ctx.fill()
    ctx.strokeStyle = '#c07050'
    ctx.lineWidth = lw
    ctx.stroke()
    ctx.restore()
  } else {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = '#c07050'
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
    ctx.fillStyle = 'rgba(0,0,0,0.20)'
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
    if (dx * dx + dy * dy < thr * thr) return i
  }
  return -1
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Configure({
  roomUrl, roomFile, analysis,
  initialPoints, initialType,
  onBack, onDone,
}) {
  const canvasRef = useRef(null)
  const imgRef    = useRef(null)
  const dragRef   = useRef(-1)
  const isDesktop = useDesktop()
  const t = useT()

  const CURTAIN_TYPES = CURTAIN_TYPE_DEFS.map(d => ({
    ...d,
    label: t(`app.configure.${d.key}`),
  }))

  const [menuOpen,    setMenuOpen]    = useState(false)
  const [points,      setPoints]      = useState(initialPoints || [])
  const [curtainType, setCurtainType] = useState(initialType   || '')
  const [czW, setCzW] = useState('')
  const [czH, setCzH] = useState('')

  // Load room image
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

  // Pre-suggest corners from analysis
  useEffect(() => {
    if (!analysis || !imgRef.current || initialPoints?.length === 4) return
    const w = analysis.window
    if (!w || w.width_pct == null) return
    const W = imgRef.current.naturalWidth
    const H = imgRef.current.naturalHeight
    const x0 = W * (w.x_pct      / 100)
    const y0 = H * (w.top_pct    / 100)
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

  const canContinue = roomUrl != null

  // Shared canvas element
  const canvasEl = (
    <canvas
      ref={canvasRef}
      style={{
        maxWidth: '100%', maxHeight: '100%',
        touchAction: 'none', cursor: 'crosshair', display: 'block',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    />
  )

  // Step progress indicator for TopBar
  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          height: 4, borderRadius: 2,
          width: i === 1 ? 24 : 14,
          background: i <= 1 ? 'var(--accent)' : 'var(--surface-3)',
          transition: 'width var(--duration)',
        }} />
      ))}
      <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginLeft: 4 }}>{t('app.configure.step')}</span>
    </div>
  )

  // Controls panel content (shared mobile/desktop)
  const controlsPanel = (isScrollable) => (
    <div
      className={isScrollable ? 'scroll' : undefined}
      style={{
        overflowY: isScrollable ? 'auto' : undefined,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Drag handle (mobile only) */}
      {!isDesktop && (
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '10px auto 16px' }} />
      )}

      {/* Legend + clear */}
      <div style={{ display: 'flex', alignItems: 'center', padding: isDesktop ? '16px 24px 10px' : '0 20px 10px' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>
          ● {t('app.configure.curtain_zone')}
        </span>
        {points.length > 0 && (
          <button
            onClick={() => setPoints([])}
            style={{
              marginLeft: 'auto',
              fontSize: '0.66rem', color: 'var(--text-3)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-full)', padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            {t('app.configure.clear')}
          </button>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: isDesktop ? '0 24px 14px' : '0 20px 14px' }} />

      {/* Curtain type */}
      <div style={{ padding: isDesktop ? '0 24px 14px' : '0 20px 14px' }}>
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10,
        }}>
          {t('app.configure.curtain_type')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CURTAIN_TYPES.map(({ value, label, Icon }) => {
            const active = curtainType === value
            return (
              <button
                key={value}
                onClick={() => setCurtainType(value)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 'var(--r-md)',
                  background: active ? 'var(--accent-dim)' : 'var(--surface)',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  transition: 'all var(--duration)',
                  boxShadow: active ? '0 0 0 2px var(--accent-glow)' : 'none',
                }}
              >
                <Icon size={30} />
                <span style={{ fontSize: '0.7rem', fontWeight: active ? 700 : 500, letterSpacing: '0.04em' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: isDesktop ? '0 24px 14px' : '0 20px 14px' }} />

      {/* Dimensions (optional) */}
      <div style={{ padding: isDesktop ? '0 24px 14px' : '0 20px 14px' }}>
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10,
        }}>
          {t('app.configure.actual_size')}{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-4)' }}>
            ({t('app.configure.optional')})
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: t('app.configure.width_cm'),    val: czW, set: setCzW, placeholder: t('app.configure.width_ph') },
            { label: t('app.configure.height_drop'), val: czH, set: setCzH, placeholder: t('app.configure.height_ph') },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--brand-bronze)', marginBottom: 5,
              }}>
                {label}
              </div>
              <input
                type="number"
                value={val}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  padding: '9px 12px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Continue CTA */}
      <div style={{ padding: isDesktop ? '4px 24px 24px' : '4px 20px 0' }}>
        <button
          onClick={() => onDone(points, curtainType, czW, czH)}
          disabled={!canContinue}
          style={{
            width: '100%', padding: '14px 20px',
            borderRadius: 'var(--r-md)',
            background: canContinue ? 'var(--ink)' : 'var(--surface-3)',
            color: canContinue ? 'var(--text-on-ink)' : 'var(--text-3)',
            fontSize: '0.85rem', fontWeight: 600,
            letterSpacing: '0.04em',
            border: 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background var(--duration)',
          }}
        >
          <span>{t('app.configure.browse')}</span>
          <span style={{ opacity: .55, fontSize: '1.1rem' }}>→</span>
        </button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
        <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <TopBar title={t('app.configure.title')} onBack={onBack} right={stepIndicator} />

        {/* ── Desktop: canvas left, controls right ── */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          overflow: 'hidden',
        }}>
          {/* Canvas panel */}
          <div style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--surface-2)',
            overflow: 'hidden',
          }}>
            {canvasEl}

            {/* Placement hint pill */}
            {points.length < 4 && roomUrl && (
              <div style={{
                position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(26,22,16,.88)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 'var(--r-full)',
                padding: '6px 16px',
                fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}>
                {points.length === 0
                  ? t('app.configure.click_corners')
                  : `${t('app.configure.corner_placed')} ${points.length} ${t('app.configure.corner_of')} ${4 - points.length} ${t('app.configure.corner_to_go')}`}
              </div>
            )}

            {!roomUrl && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,.3)',
              }}>
                <IconCamera size={36} />
                <span style={{ fontSize: '0.8rem' }}>{t('app.configure.no_photo')}</span>
              </div>
            )}
          </div>

          {/* Controls panel */}
          <div style={{
            borderInlineStart: '1px solid var(--border)',
            background: 'var(--bg)',
            overflowY: 'auto',
            paddingBottom: 'calc(var(--nav-height) + 6px)',
          }}>
            {controlsPanel(false)}
          </div>
        </div>

        <BottomNav activeIcon={IconCamera} activeLabel={t('app.configure.nav_label')} onMenu={() => setMenuOpen(true)} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <TopBar title={t('app.configure.title')} onBack={onBack} right={stepIndicator} />

      {/* ── Canvas viewer ── */}
      <div style={{
        flex: '1 1 0',
        minHeight: '42vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1610',
        overflow: 'hidden',
      }}>
        {canvasEl}

        {/* Placement hint pill */}
        {points.length < 4 && roomUrl && (
          <div style={{
            position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(26,22,16,.88)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 'var(--r-full)',
            padding: '6px 16px',
            fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {points.length === 0
              ? t('app.configure.tap_corners')
              : `${t('app.configure.corner_placed')} ${points.length} ${t('app.configure.corner_of')} ${4 - points.length} ${t('app.configure.corner_to_go')}`}
          </div>
        )}

        {!roomUrl && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: 'rgba(255,255,255,.3)',
          }}>
            <IconCamera size={36} />
            <span style={{ fontSize: '0.8rem' }}>No room photo loaded</span>
          </div>
        )}
      </div>

      {/* ── Bottom sheet ── */}
      <div className="scroll" style={{
        flex: '0 1 auto',
        maxHeight: '55vh',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'calc(var(--nav-height) + 6px)',
        overflowY: 'auto',
      }}>
        {controlsPanel(false)}
      </div>

      <BottomNav activeIcon={IconCamera} activeLabel={t('app.configure.nav_label')} onMenu={() => setMenuOpen(true)} />
    </div>
  )
}
