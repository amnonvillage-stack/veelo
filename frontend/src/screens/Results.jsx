import { useState, useRef } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

// Fullness factor per curtain type (for fabric quantity estimate)
const FULLNESS = { pleated: 2.5, eyelet: 2.0, roman: 1.1, roller: 1.0 }

function estimateFabric(czW, czH, type) {
  const w = parseFloat(czW), h = parseFloat(czH)
  if (!w || !h) return null
  const factor = FULLNESS[type] || 2.0
  const meters = (w / 100) * factor * (h / 100)
  return Math.ceil(meters * 10) / 10
}

// ── Two-phase progress UI ─────────────────────────────────────────────────────
const CSS_ANIM = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slide {
    0%   { transform: translateX(-100%); }
    50%  { transform: translateX(0%);    }
    100% { transform: translateX(100%);  }
  }
`

function StepRow({ num, label, sublabel, status, barPct }) {
  // status: 'pending' | 'active' | 'done'
  const done    = status === 'done'
  const active  = status === 'active'

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

      {/* Circle badge */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: done ? '0.9rem' : '0.72rem',
        fontWeight: 800,
        background: done
          ? 'var(--accent)'
          : active ? 'var(--accent-dim)' : 'var(--surface-2)',
        border: `2px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
        color: done ? '#fff' : active ? 'var(--accent)' : 'var(--text-3)',
        transition: 'all 0.3s ease',
      }}>
        {done ? '✓' : num}
      </div>

      {/* Text + bar */}
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2,
          color: active || done ? 'var(--ink)' : 'var(--text-3)',
          transition: 'color 0.3s',
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2,
          marginBottom: active ? 10 : 0,
        }}>
          {sublabel}
        </div>

        {active && (
          <div style={{
            height: 4, borderRadius: 2,
            background: 'var(--surface-3)',
            overflow: 'hidden',
            position: 'relative',
          }}>
            {barPct == null ? (
              /* Indeterminate sliding bar */
              <div style={{
                position: 'absolute', top: 0, left: 0,
                height: '100%', width: '40%',
                background: 'var(--accent)',
                borderRadius: 2,
                animation: 'slide 1.4s ease-in-out infinite',
              }} />
            ) : (
              /* Determinate fill */
              <div style={{
                height: '100%',
                width: `${Math.max(4, barPct)}%`,
                background: 'var(--accent)',
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressSteps({ analysing, generating, ready, total }) {
  const step1 = analysing ? 'active' : 'done'
  const step2 = analysing ? 'pending' : (generating || ready > 0) ? 'active' : 'done'
  const genBarPct = total > 0 ? (ready / total) * 100 : 0

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 32px',
    }}>
      <style>{CSS_ANIM}</style>

      <div style={{
        width: '100%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}>
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--text-3)',
        }}>
          Preparing your visualisation
        </div>

        <StepRow
          num={1}
          label="Analysing room"
          sublabel={analysing
            ? 'Reading light, perspective & window geometry…'
            : 'Room understood ✓'}
          status={step1}
          barPct={null}
        />

        <StepRow
          num={2}
          label={`Generating ${total} visualisation${total > 1 ? 's' : ''}`}
          sublabel={analysing
            ? 'Waiting for analysis…'
            : generating
              ? `${ready} of ${total} complete — ~15–30 s each`
              : `${ready} of ${total} complete`}
          status={step2}
          barPct={genBarPct}
        />
      </div>
    </div>
  )
}

// ── Compact generation bar (shown above results while more are pending) ────────
function GenBar({ ready, total }) {
  return (
    <div style={{
      padding: '8px 20px 6px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 5,
      }}>
        <span style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>
          Generating…
        </span>
        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--accent)' }}>
          {ready} / {total}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${(ready / total) * 100}%`,
          background: 'var(--accent)',
          borderRadius: 2,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ── Result card ───────────────────────────────────────────────────────────────
function CompareThumbnail({ result, rank, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect(result)}
      style={{
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px var(--accent-dim)' : 'none',
        transition: 'border-color var(--duration)',
      }}
    >
      <div style={{ height: 140, background: 'var(--ink)', position: 'relative', overflow: 'hidden' }}>
        <img
          src={result.imageUrl}
          alt={result.fabric.name}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
        {rank === 0 && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: 'var(--accent)', color: '#fff',
            fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.08em',
            padding: '2px 7px', borderRadius: 4,
          }}>
            ★ TOP
          </div>
        )}
      </div>
      <div style={{ padding: '8px 10px', background: 'var(--surface)' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2,
        }}>
          {result.fabric.name}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-2)', marginTop: 2 }}>
          ₪{result.fabric.price_per_m} / m
        </div>
      </div>
    </div>
  )
}

// ── Prompt Preview Panel ──────────────────────────────────────────────────────
function PromptPreview({ preview, onContinue, onCancel }) {
  const { prompt, fabrics } = preview
  const fabricNames = fabrics.map(f => f.name).join(', ')

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      {/* Header strip */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(192,112,80,.06)',
        borderBottom: '1px solid rgba(192,112,80,.2)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4,
        }}>
          🔬 Debug — Gemini prompt preview
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
          Based on fabric: <strong style={{ color: 'var(--ink)' }}>{fabricNames}</strong>.
          Review the prompt then continue to generate, or go back to adjust.
        </div>
      </div>

      {/* Scrollable prompt text */}
      <div className="scroll" style={{
        flex: 1,
        padding: '16px 20px',
        minHeight: 0,
      }}>
        <pre style={{
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          lineHeight: 1.65,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '14px 16px',
        }}>
          {prompt}
        </pre>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 10, textAlign: 'right' }}>
          {prompt.length} chars · {fabrics.length} fabric{fabrics.length > 1 ? 's' : ''} queued
        </div>
      </div>

      {/* Action buttons */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
        paddingBottom: 'calc(var(--nav-height) + 12px)',
        background: 'var(--bg)',
      }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '13px',
            borderRadius: 'var(--r-md)',
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            fontSize: '0.8rem', fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back to catalogue
        </button>
        <button
          onClick={onContinue}
          style={{
            flex: 2, padding: '13px',
            borderRadius: 'var(--r-md)',
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
          }}
        >
          Generate {fabrics.length} visualisation{fabrics.length > 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}

// ── Source thumbnail card ─────────────────────────────────────────────────────
function SourceThumbnail({ roomUrl, selected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        border: selected ? '2px solid var(--border-2)' : '1px solid var(--border)',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px rgba(26,22,16,.12)' : 'none',
        transition: 'border-color var(--duration)',
      }}
    >
      <div style={{ height: 140, background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
        <img
          src={roomUrl}
          alt="Original"
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'rgba(26,22,16,.72)', color: '#fff',
          fontSize: '0.54rem', fontWeight: 800, letterSpacing: '0.08em',
          padding: '2px 7px', borderRadius: 4,
        }}>
          ORIGINAL
        </div>
      </div>
      <div style={{ padding: '8px 10px', background: 'var(--surface)' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2,
        }}>
          Before
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>
          Original room
        </div>
      </div>
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Results({
  results, selectedFabrics, roomUrl,
  czWidthCm, czHeightCm, curtainType,
  analysing, generating, promptPreview, onContinue, onCancelPreview,
  error, onBack, onNewRoom,
}) {
  // activeIdx: -1 = source image, 0..n-1 = generated results
  const [activeIdx, setActiveIdx] = useState(0)
  const [saved,     setSaved]     = useState(new Set()) // saved result indices
  const [saving,    setSaving]    = useState(false)
  const compareRef = useRef(null)   // anchor for the Compare-button scroll target

  const total   = selectedFabrics.length
  const ready   = results.length
  const loading = analysing || (ready === 0 && generating && !promptPreview)

  const fabricMeters = estimateFabric(czWidthCm, czHeightCm, curtainType)
  const isSource     = activeIdx === -1
  const activeResult = isSource ? null : (results[activeIdx] ?? null)

  // ── Favourite — persist to project folder via server ─────────────────────
  const handleFavourite = async () => {
    if (!activeResult || saving) return
    // Toggle off if already saved (optimistic UI, no server-side delete yet)
    if (saved.has(activeIdx)) {
      setSaved(prev => { const s = new Set(prev); s.delete(activeIdx); return s })
      return
    }
    setSaving(true)
    try {
      const blob = await fetch(activeResult.imageUrl).then(r => r.blob())
      const fd   = new FormData()
      fd.append('image',        blob, 'curtain.png')
      fd.append('fabric_name',  activeResult.fabric.name)
      fd.append('fabric_id',    activeResult.fabric.id)
      fd.append('curtain_type', curtainType)
      const res = await fetch('/saves', { method: 'POST', body: fd })
      if (res.ok) setSaved(prev => new Set(prev).add(activeIdx))
      else        console.error('Favourite failed:', res.status)
    } catch (e) {
      console.error('Favourite failed:', e)
    } finally {
      setSaving(false)
    }
  }

  // ── Swipe — range is -1 (source) to results.length-1 ─────────────────────
  const [touchStart, setTouchStart] = useState(null)
  const handleTouchStart = e => setTouchStart(e.touches[0].clientX)
  const handleTouchEnd   = e => {
    if (touchStart === null) return
    const delta = touchStart - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      setActiveIdx(prev =>
        delta > 0 ? Math.min(prev + 1, results.length - 1) : Math.max(prev - 1, -1)
      )
    }
    setTouchStart(null)
  }

  // Current image URL for the main viewer
  const viewerSrc = isSource ? roomUrl : activeResult?.imageUrl

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <style>{CSS_ANIM}</style>

      <TopBar
        title="Results"
        onBack={onBack}
        right={
          analysing
            ? <span style={{ fontSize:'0.7rem', color:'var(--accent)' }}>Analysing…</span>
            : promptPreview
              ? <span style={{ fontSize:'0.7rem', color:'var(--accent)', fontWeight:700 }}>⏸ Paused</span>
              : generating
                ? <span style={{ fontSize:'0.7rem', color:'var(--accent)' }}>
                    {ready} / {total} ready…
                  </span>
                : <span style={{ fontSize:'0.7rem', color:'var(--text-3)' }}>
                    {ready} of {total} ready
                  </span>
        }
      />

      {/* ── Loading: no results yet ── */}
      {loading && !error && (
        <ProgressSteps
          analysing={analysing}
          generating={generating}
          ready={ready}
          total={total}
        />
      )}

      {/* ── Debug: prompt preview panel ── */}
      {promptPreview && !ready && (
        <PromptPreview
          preview={promptPreview}
          onContinue={onContinue}
          onCancel={onCancelPreview}
        />
      )}

      {/* ── Error with no results ── */}
      {!loading && ready === 0 && error && (
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:12, padding:24,
        }}>
          <div style={{ fontSize:'2rem' }}>⚠️</div>
          <div style={{ fontSize:'.82rem', color:'var(--ink)', fontWeight:500, textAlign:'center' }}>
            Generation failed
          </div>
          <div style={{ fontSize:'.72rem', color:'var(--text-2)', textAlign:'center' }}>{error}</div>
          <button onClick={onBack} style={{
            marginTop:8, padding:'10px 24px', borderRadius:'var(--r-md)',
            background:'var(--ink)', color:'var(--bg)', border:'none',
            fontSize:'.8rem', fontWeight:500, cursor:'pointer',
          }}>
            ← Try again
          </button>
        </div>
      )}

      {/* ── Results view ── */}
      {ready > 0 && (
        <>
          {/* Compact progress bar while still generating */}
          {generating && <GenBar ready={ready} total={total} />}

          {/* Main image viewer — scales with viewport so the compare grid stays visible on mobile */}
          <div
            style={{
              height: 'min(38vh, 280px)',
              position:'relative',
              background:'var(--ink)',
              flexShrink:0,
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={viewerSrc}
              alt={isSource ? 'Original room' : activeResult?.fabric.name}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />

            {/* Label overlay */}
            <div style={{
              position:'absolute', top:12, left:12,
              background:'rgba(250,246,240,.92)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(26,22,16,.1)', borderRadius:'var(--r-sm)',
              padding:'7px 12px',
            }}>
              {isSource ? (
                <>
                  <div style={{ fontSize:'0.54rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:1 }}>
                    Before
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:500, color:'var(--ink)', lineHeight:1.1 }}>
                    Original room
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'0.54rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:1 }}>
                    {activeResult.fabric.collection} · {activeResult.fabric.type}
                  </div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:500, color:'var(--ink)', lineHeight:1.1 }}>
                    {activeResult.fabric.name}
                  </div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-2)', marginTop:1 }}>
                    ₪{activeResult.fabric.price_per_m} / m
                  </div>
                </>
              )}
            </div>

            {/* Swipe dots — source dot first, then one per result */}
            <div style={{
              position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
              display:'flex', gap:6,
            }}>
              {/* Source dot */}
              <div onClick={() => setActiveIdx(-1)} style={{
                width: activeIdx === -1 ? 20 : 8,
                height: 4, borderRadius: 2, cursor:'pointer',
                background: activeIdx === -1 ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.3)',
                transition: 'all var(--duration)',
              }} />
              {results.map((_, i) => (
                <div key={i} onClick={() => setActiveIdx(i)} style={{
                  width: i === activeIdx ? 20 : 8,
                  height: 4, borderRadius: 2, cursor:'pointer',
                  background: i === activeIdx ? '#fff' : 'rgba(255,255,255,.4)',
                  transition: 'all var(--duration)',
                }} />
              ))}
              {generating && (
                <div style={{ width:8, height:4, borderRadius:2, background:'rgba(255,255,255,.2)' }} />
              )}
            </div>
          </div>

          {/* Action row */}
          <div style={{
            display:'flex', gap:8, padding:'10px 18px',
            borderBottom:'1px solid var(--border)', flexShrink:0,
          }}>
            {/* Favourite */}
            <button
              onClick={handleFavourite}
              disabled={isSource || saving}
              style={{
                flex:1, padding:'9px 4px', borderRadius:'var(--r-sm)',
                border: saved.has(activeIdx)
                  ? '1px solid rgba(210,70,80,.35)'
                  : '1px solid var(--border)',
                background: saved.has(activeIdx) ? 'rgba(210,70,80,.08)' : 'var(--surface-2)',
                fontSize:'0.68rem', fontWeight:700,
                color: isSource
                  ? 'var(--text-4)'
                  : saved.has(activeIdx)
                    ? 'rgb(210,70,80)'
                    : 'var(--text-2)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                cursor: isSource ? 'default' : 'pointer',
                transition: 'all var(--duration)',
              }}
            >
              <span style={{
                fontSize: '1.15rem',
                lineHeight: 1,
                transition: 'transform 0.15s ease',
                display: 'block',
                transform: saving ? 'scale(0.85)' : saved.has(activeIdx) ? 'scale(1.1)' : 'scale(1)',
              }}>
                {saved.has(activeIdx) ? '♥' : '♡'}
              </span>
              {saving ? '…' : saved.has(activeIdx) ? 'Saved' : 'Save'}
            </button>

            {/* Share (placeholder) */}
            <button style={{
              flex:1, padding:'9px 4px', borderRadius:'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              fontSize:'0.68rem', fontWeight:700, color:'var(--text-2)',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              cursor:'pointer',
            }}>
              <span style={{ fontSize:'1rem' }}>↗</span>
              Share
            </button>

            {/* Compare — scrolls the compare grid into view (uses a ref, not a brittle selector) */}
            <button
              onClick={() => compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{
                flex:1, padding:'9px 4px', borderRadius:'var(--r-sm)',
                border: '1px solid var(--accent)',
                background: 'var(--accent-dim)',
                fontSize:'0.68rem', fontWeight:700, color:'var(--accent)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                cursor:'pointer',
              }}
            >
              <span style={{ fontSize:'1rem' }}>⊞</span>
              Compare
            </button>
          </div>

          {/* Scrollable lower section */}
          <div className="scroll" style={{ flex:1, paddingBottom:'calc(var(--nav-height) + 16px)' }}>

            {/* Compare grid — always shown once there's at least 1 result */}
            <div ref={compareRef} style={{
              fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.14em',
              textTransform:'uppercase', color:'var(--text-3)',
              padding:'10px 20px 8px',
              scrollMarginTop: 8,
            }}>
              Compare options
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'0 20px' }}>
              {/* Source always first */}
              <SourceThumbnail
                roomUrl={roomUrl}
                selected={activeIdx === -1}
                onSelect={() => setActiveIdx(-1)}
              />
              {results.map((r, i) => (
                <CompareThumbnail
                  key={r.fabric.id}
                  result={r}
                  rank={i}
                  selected={i === activeIdx}
                  onSelect={() => setActiveIdx(i)}
                />
              ))}
            </div>

            {/* Quote strip — only shown when a generated result is active */}
            {fabricMeters && activeResult && (
              <div style={{
                margin:'14px 20px 0',
                background:'var(--accent-dim)',
                border:'1px solid rgba(192,112,80,.2)',
                borderRadius:'var(--r-md)',
                padding:'12px 16px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--accent)' }}>
                    Ready to order?
                  </div>
                  <div style={{ fontSize:'0.62rem', color:'var(--text-2)', marginTop:2 }}>
                    Est. {fabricMeters} m · ₪{Math.round(fabricMeters * activeResult.fabric.price_per_m).toLocaleString()}
                  </div>
                </div>
                <button style={{
                  padding:'9px 16px', borderRadius:'var(--r-sm)',
                  background:'var(--accent)', color:'#fff',
                  border:'none', fontSize:'0.76rem', fontWeight:700,
                  cursor:'pointer', letterSpacing:'0.02em',
                }}>
                  Get quote →
                </button>
              </div>
            )}

            {/* New room */}
            <div style={{ padding:'14px 20px 0' }}>
              <button onClick={onNewRoom} style={{
                width:'100%', padding:'12px', borderRadius:'var(--r-md)',
                background:'none', border:'1px solid var(--border)',
                color:'var(--text-2)', fontSize:'0.78rem', fontWeight:500,
                letterSpacing:'0.04em', cursor:'pointer',
              }}>
                + Start new room
              </button>
            </div>

          </div>
        </>
      )}

      <BottomNav activeIcon="✨" activeLabel="Results" />
    </div>
  )
}
