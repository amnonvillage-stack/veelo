import { useState, useEffect, useMemo } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'
import RenderingAnimation from '../components/RenderingAnimation.jsx'

// ── ResultsV13 — terminal interactive screen of the v1.3 flow ─────────────────
// Single simulation, in-place fabric/hanger swap, non-binding price estimate,
// then "Send inquiry" → POST /inquiry → confirmation screen.
//
// Orchestration split:
//   This screen is dumb about HOW images are generated. App.jsx owns the
//   generate pipeline and hands us back a `simulation` (imageUrl + fabric).
//   When the user picks a different fabric we call onChangeFabric(fabric) and
//   wait for `simulation` to update from above. Hanger swaps are visual-only
//   and don't trigger regen (rod choice isn't in the prompt — it's a metadata
//   field that ships in the inquiry).
//
// Pricing model (non-binding, per PRD §6.4):
//   meters = (width_cm/100) × fullness × (height_cm/100)
//   total  = meters × fabric.price_per_m × wings + hanger.price
// Fullness factors: pleated 2.5, eyelet 2.0, roman 1.1, roller 1.0.
// We display ranges (±15%) so users don't anchor on an exact number we can't honour.

const FULLNESS = { pleated: 2.5, eyelet: 2.0, roman: 1.1, roller: 1.0 }

const SWATCH_COLORS = {
  '#d4c8a8': 'repeating-linear-gradient(0deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),repeating-linear-gradient(90deg,rgba(180,160,120,.2) 0,rgba(180,160,120,.2) 1px,transparent 1px,transparent 7px),#d4c8a8',
  '#3d1f60': 'radial-gradient(ellipse at 35% 35%,#7b5ea0,#3d1f60)',
  '#1e2f60': 'linear-gradient(160deg,#1e2f60,#0e1830)',
  '#f0ecff': 'linear-gradient(135deg,#f0ecff,#e8f4ff,#f0ecff)',
  '#c86050': 'linear-gradient(135deg,#c86050,#a04030)',
  '#e2d4c2': 'repeating-linear-gradient(45deg,rgba(255,255,255,.2) 0,rgba(255,255,255,.2) 2px,transparent 2px,transparent 8px),#e2d4c2',
  '#7a9e7e': 'repeating-linear-gradient(135deg,rgba(255,255,255,.1) 0,rgba(255,255,255,.1) 2px,transparent 2px,transparent 6px),#7a9e7e',
  '#f8f4ee': 'linear-gradient(135deg,#f8f4ee,#f0ece4)',
  '#3a3a3a': 'repeating-linear-gradient(135deg,rgba(255,255,255,.05) 0,rgba(255,255,255,.05) 2px,transparent 2px,transparent 5px),#3a3a3a',
  '#d4a0a0': 'linear-gradient(135deg,#d4a0a0,#c08888)',
  '#405020': 'repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0,rgba(255,255,255,.08) 2px,transparent 2px,transparent 6px),#405020',
  '#d8c8a0': 'linear-gradient(135deg,#d8c8a0,#c8b888)',
  '#5a5a5a': 'linear-gradient(135deg,#6a6a6a,#484848)',
}

function priceEstimate({ widthCm, heightCm, curtainType, fabric, hanger, wings }) {
  const w = parseFloat(widthCm), h = parseFloat(heightCm)
  if (!w || !h || !fabric) return null
  const factor = FULLNESS[curtainType] || 2.0
  const meters = (w / 100) * factor * (h / 100) * (wings || 1)
  const fabricCost = meters * (fabric.price_per_m || 0)
  const hangerCost = hanger?.price || 0
  const total = fabricCost + hangerCost
  return {
    meters: Math.ceil(meters * 10) / 10,
    fabricCost: Math.round(fabricCost),
    hangerCost: Math.round(hangerCost),
    total:      Math.round(total),
    low:        Math.round(total * 0.85),
    high:       Math.round(total * 1.15),
  }
}

// ── Tile in the swap drawer ───────────────────────────────────────────────────
function FabricSwapTile({ product, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(product)}
      style={{
        background: 'var(--surface)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: product.in_stock ? 1 : 0.45,
      }}
    >
      <div style={{ position: 'relative', height: 64 }}>
        <div style={{ position: 'absolute', inset: 0, background: SWATCH_COLORS[product.color_hex] || product.color_hex }} />
        {product.swatch_path && (
          <img
            src={product.swatch_path}
            alt={product.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        {selected && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontSize: '0.55rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✓</div>
        )}
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        <div style={{
          fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{product.name}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginTop: 1 }}>
          ₪{product.price_per_m}/m
        </div>
      </div>
    </div>
  )
}

// ── Bottom-sheet drawer ───────────────────────────────────────────────────────
function Drawer({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        zIndex: 91,
        maxHeight: '70vh',
        background: 'var(--bg)',
        borderTopLeftRadius: 'var(--r-lg)',
        borderTopRightRadius: 'var(--r-lg)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -20px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '10px auto' }} />
        <div style={{
          padding: '6px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}>
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1rem', color: 'var(--text-3)', padding: 4,
            }}
          >✕</button>
        </div>
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 24px' }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultsV13({
  // generation state
  simulation,        // { fabric, imageUrl } | null — current rendered image
  generating,        // bool — true while a regen is in flight
  analysing,
  error,
  // user config (read-only here)
  curtainType,
  widthCm, heightCm,
  // user config (mutable here)
  fabric, hanger, wings,
  // catalogue lookups (passed in to avoid re-fetch)
  fabricChoices,     // array filtered by curtain type
  hangerChoices,     // array filtered by curtain type
  // callbacks
  onChangeFabric,    // (fabric) => regen with new fabric
  onChangeHanger,    // (hanger) => purely visual
  onSend,            // ({ ... }) => POST /inquiry
  onBack,
  onNewRoom,
}) {
  const [sheet, setSheet]   = useState(null)        // 'fabric' | 'hanger' | null
  const [sending, setSending] = useState(false)
  const [sendErr,  setSendErr]  = useState(null)

  const STEP = 5, TOTAL = 5

  const estimate = useMemo(
    () => priceEstimate({ widthCm, heightCm, curtainType, fabric, hanger, wings }),
    [widthCm, heightCm, curtainType, fabric, hanger, wings]
  )

  const handleSend = async () => {
    if (!simulation || !fabric || sending) return
    setSending(true)
    setSendErr(null)
    try {
      await onSend({
        priceEstimate: estimate ? `₪${estimate.low.toLocaleString()}–${estimate.high.toLocaleString()}` : '',
      })
    } catch (e) {
      setSendErr(e.message || String(e))
    } finally {
      setSending(false)
    }
  }

  // Close drawer when fabric/hanger updates from above
  useEffect(() => {
    if (sheet === 'fabric' && fabric) setSheet(null)
  }, [fabric?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar
        title="Your visualisation"
        onBack={onBack}
        right={
          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
            Step {STEP} of {TOTAL}
          </span>
        }
      />

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '4px 0 12px' }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <div key={i} style={{
            height: 4, borderRadius: 2,
            width: i + 1 === STEP ? 28 : 14,
            background: i + 1 <= STEP ? 'var(--accent)' : 'var(--surface-3)',
          }} />
        ))}
      </div>

      <div className="scroll" style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        paddingBottom: 'calc(var(--nav-height) + 96px)',
      }}>

        {/* Image area */}
        <div style={{
          margin: '0 16px 18px',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden',
          background: 'var(--ink)',
          aspectRatio: '4 / 3',
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {simulation?.imageUrl ? (
            <img
              src={simulation.imageUrl}
              alt={simulation.fabric?.name || 'Curtain simulation'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : error ? (
            <div style={{ color: '#ffb4b0', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
              ❌ {error}
            </div>
          ) : (
            <RenderingAnimation
              stage={analysing ? 'analysing' : generating ? 'generating' : 'preparing'}
            />
          )}

          {/* Loading overlay during regen — full animation, not just a spinner */}
          {(generating || analysing) && simulation?.imageUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.62)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(3px)',
            }}>
              <RenderingAnimation
                stage={analysing ? 'analysing' : 'generating'}
              />
            </div>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Config summary — three swap rows */}
        <div style={{ padding: '0 20px', marginBottom: 18 }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--text-3)', marginBottom: 10,
          }}>
            Your design
          </div>

          {/* Fabric row */}
          <div
            onClick={() => setSheet('fabric')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '10px 12px',
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-sm)',
              flexShrink: 0, position: 'relative', overflow: 'hidden',
              background: SWATCH_COLORS[fabric?.color_hex] || fabric?.color_hex || 'var(--surface-2)',
            }}>
              {fabric?.swatch_path && (
                <img
                  src={fabric.swatch_path}
                  alt={fabric.name}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Fabric
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', marginTop: 1 }}>
                {fabric?.name || '—'}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>Swap →</div>
          </div>

          {/* Hanger row */}
          <div
            onClick={() => setSheet('hanger')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '10px 12px',
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-sm)',
              flexShrink: 0, background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem',
            }}>
              ⌐
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Hanger
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', marginTop: 1 }}>
                {hanger?.name || '—'}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>Swap →</div>
          </div>

          {/* Type + size + wings — read-only summary */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap',
            marginTop: 10,
          }}>
            <Chip>{curtainType}</Chip>
            {wings ? <Chip>{wings} {wings === 1 ? 'panel' : 'panels'}</Chip> : null}
            {widthCm && heightCm ? <Chip>{widthCm}×{heightCm} cm</Chip> : null}
          </div>
        </div>

        {/* Price estimate */}
        {estimate && (
          <div style={{
            margin: '0 20px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '14px 16px',
          }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--text-3)', marginBottom: 8,
            }}>
              Estimate (non-binding)
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem', fontWeight: 500,
              color: 'var(--ink)', lineHeight: 1.1,
            }}>
              ₪{estimate.low.toLocaleString()}–{estimate.high.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
              ~{estimate.meters} m fabric · {curtainType} fullness ×{FULLNESS[curtainType] || 2.0}
              {hanger?.price ? ` · hanger +₪${hanger.price}` : ''}
            </div>
            <div style={{
              fontSize: '0.66rem', color: 'var(--text-3)', marginTop: 8,
              fontStyle: 'italic',
            }}>
              Final price confirmed after on-site measurement.
            </div>
          </div>
        )}

        {!estimate && (
          <div style={{
            margin: '0 20px 18px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(192,112,80,.2)',
            borderRadius: 'var(--r-md)',
            padding: '12px 14px',
            fontSize: '0.76rem', color: 'var(--text-2)', lineHeight: 1.5,
          }}>
            💡 Add the curtain dimensions on the previous step to see a price estimate.
          </div>
        )}

        {sendErr && (
          <div style={{
            margin: '0 20px 12px',
            background: '#fdecea', border: '1px solid #f5c6c1',
            color: '#8a2a22', borderRadius: 'var(--r-sm)',
            padding: '8px 12px', fontSize: '0.78rem',
          }}>
            Couldn't send: {sendErr}
          </div>
        )}

        <div style={{ padding: '0 20px' }}>
          <button
            onClick={onNewRoom}
            style={{
              width: '100%', padding: '11px',
              background: 'transparent',
              border: '1px solid var(--border-2)',
              borderRadius: 'var(--r-full)',
              color: 'var(--text-2)',
              fontSize: '0.74rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Start over
          </button>
        </div>
      </div>

      {/* Sticky Send CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: 'var(--nav-height)',
        padding: '12px 20px',
        background: 'linear-gradient(0deg, var(--bg) 70%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={handleSend}
          disabled={!simulation?.imageUrl || sending || generating}
          style={{
            pointerEvents: 'auto',
            width: '100%', padding: '15px',
            borderRadius: 'var(--r-md)',
            background: (!simulation?.imageUrl || sending || generating)
              ? 'var(--surface-3)'
              : 'var(--accent)',
            color: (!simulation?.imageUrl || sending || generating)
              ? 'var(--text-3)'
              : '#fff',
            fontSize: '0.9rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            border: 'none',
            cursor: (!simulation?.imageUrl || sending || generating) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(192,112,80,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {sending ? (
            <>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#fff',
                display: 'inline-block',
                animation: 'spin 0.7s linear infinite',
              }} />
              Sending…
            </>
          ) : (
            <>Send inquiry →</>
          )}
        </button>
      </div>

      {/* Fabric swap drawer */}
      <Drawer
        open={sheet === 'fabric'}
        title={`Swap fabric · ${fabricChoices?.length || 0} options`}
        onClose={() => setSheet(null)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {(fabricChoices || []).map(p => (
            <FabricSwapTile
              key={p.id}
              product={p}
              selected={fabric?.id === p.id}
              onSelect={p.in_stock ? onChangeFabric : () => {}}
            />
          ))}
        </div>
      </Drawer>

      {/* Hanger swap drawer */}
      <Drawer
        open={sheet === 'hanger'}
        title="Swap hanger"
        onClose={() => setSheet(null)}
      >
        {(hangerChoices || []).map(h => (
          <div
            key={h.id}
            onClick={() => { onChangeHanger(h); setSheet(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              background: hanger?.id === h.id ? 'var(--accent-dim)' : 'var(--surface)',
              border: hanger?.id === h.id ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              border: hanger?.id === h.id ? '5px solid var(--accent)' : '2px solid var(--border-2)',
              background: hanger?.id === h.id ? 'var(--bg)' : 'transparent',
              boxSizing: 'border-box',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--ink)' }}>
                {h.name}
              </div>
              {h.description && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
                  {h.description}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
              {h.price > 0 ? `+₪${h.price}` : '—'}
            </div>
          </div>
        ))}
      </Drawer>

      <BottomNav activeIcon="✨" activeLabel="Result" />
    </div>
  )
}

function Chip({ children }) {
  if (!children) return null
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-2)',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      padding: '4px 10px', borderRadius: 'var(--r-full)',
    }}>
      {children}
    </span>
  )
}
