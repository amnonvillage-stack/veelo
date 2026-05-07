import { useState, useEffect, useMemo } from 'react'
import TopBar    from '../components/TopBar.jsx'
import BottomNav from '../components/BottomNav.jsx'

// ── ConfigureCurtain — first interactive step in the v1.3 flow ───────────────
// Order: Curtain type → Fabric → Hanger → Wings → Continue (to Email)
//
// Design rationale:
//  • One screen, four decisions. Single-select everywhere — keeps UX honest with the
//    "1 simulation = 1 design" mental model. Multi-fabric exploration moves to Results
//    via in-place swap (per PRD §7.6).
//  • Fabric grid is filtered by curtain type — switching type clears any prior fabric
//    pick (an eyelet fabric isn't valid on a Roman shade and vice versa).
//  • Hanger options are filtered by curtain type via /hangers?curtain_type=... so we
//    never show "decorative rod" for a roller blind.
//  • Wings is hidden for curtain types where it doesn't apply (roman/roller — both are
//    single-panel by construction). Defaults to 2 for pleated/eyelet.

const CURTAIN_TYPES = [
  { value: 'pleated',  label: 'Pleated' },
  { value: 'eyelet',   label: 'Eyelet'  },
  { value: 'roman',    label: 'Roman'   },
  { value: 'roller',   label: 'Roller'  },
]

const TWO_PANEL_TYPES = new Set(['pleated', 'eyelet'])

// Same swatch fallback palette as Catalog — keep in sync if you add new fabrics.
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

// ── Section heading ───────────────────────────────────────────────────────────
function SectionLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <div style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
      }}>
        {children}
      </div>
      {hint && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

// ── Fabric tile (compact, single-select) ──────────────────────────────────────
function FabricTile({ product, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(product)}
      style={{
        background: 'var(--surface)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 0 0 3px var(--accent-dim)' : 'var(--shadow-sm)',
        transition: 'border-color var(--duration), box-shadow var(--duration)',
        opacity: product.in_stock ? 1 : 0.55,
      }}
    >
      <div style={{ position: 'relative', height: 78 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: SWATCH_COLORS[product.color_hex] || product.color_hex,
        }} />
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
            position: 'absolute', top: 6, right: 6,
            width: 20, height: 20, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.55rem', fontWeight: 800,
          }}>✓</div>
        )}
      </div>
      <div style={{ padding: '7px 9px 9px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.86rem',
          fontWeight: 500,
          color: 'var(--ink)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {product.name}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>
          ₪{product.price_per_m}/m
        </div>
      </div>
    </div>
  )
}

// ── Hanger pill ───────────────────────────────────────────────────────────────
function HangerOption({ hanger, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(hanger)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: selected ? 'var(--accent-dim)' : 'var(--surface)',
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'all var(--duration)',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: selected ? '5px solid var(--accent)' : '2px solid var(--border-2)',
        background: selected ? 'var(--bg)' : 'transparent',
        boxSizing: 'border-box',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--ink)' }}>
          {hanger.name}
        </div>
        {hanger.description && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2, lineHeight: 1.4 }}>
            {hanger.description}
          </div>
        )}
      </div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
        {hanger.price > 0 ? `+₪${hanger.price}` : '—'}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ConfigureCurtain({
  initialType,
  initialFabric,
  initialHanger,
  initialWings,
  onBack,
  onContinue,
}) {
  const [curtainType, setCurtainType] = useState(initialType || '')
  const [fabric,      setFabric]      = useState(initialFabric || null)
  const [hanger,      setHanger]      = useState(initialHanger || null)
  const [wings,       setWings]       = useState(initialWings || 2)

  const [fabrics,    setFabrics]    = useState([])
  const [hangers,    setHangers]    = useState([])
  const [loadingFab, setLoadingFab] = useState(false)
  const [loadingHan, setLoadingHan] = useState(false)
  const [error,      setError]      = useState(null)

  // ── Fetch fabrics whenever curtain type changes ─────────────────────────────
  useEffect(() => {
    if (!curtainType) { setFabrics([]); return }
    let cancelled = false
    setLoadingFab(true)
    fetch(`/catalog?type=${encodeURIComponent(curtainType)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (cancelled) return
        setFabrics(data)
        // If currently-selected fabric is no longer in the list, clear it
        if (fabric && !data.find(p => p.id === fabric.id)) setFabric(null)
      })
      .catch(err => { if (!cancelled) setError(`Couldn't load fabrics (${err})`) })
      .finally(() => { if (!cancelled) setLoadingFab(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curtainType])

  // ── Fetch hangers whenever curtain type changes ─────────────────────────────
  useEffect(() => {
    if (!curtainType) { setHangers([]); return }
    let cancelled = false
    setLoadingHan(true)
    fetch(`/hangers?curtain_type=${encodeURIComponent(curtainType)}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (cancelled) return
        setHangers(data)
        // Auto-select if there's only one option (e.g. roller → no rod)
        if (data.length === 1) setHanger(data[0])
        else if (hanger && !data.find(h => h.id === hanger.id)) setHanger(null)
      })
      .catch(err => { if (!cancelled) setError(`Couldn't load hangers (${err})`) })
      .finally(() => { if (!cancelled) setLoadingHan(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curtainType])

  // ── Auto-fix wings when curtain type changes ────────────────────────────────
  useEffect(() => {
    if (curtainType && !TWO_PANEL_TYPES.has(curtainType)) setWings(1)
  }, [curtainType])

  const showWings = curtainType && TWO_PANEL_TYPES.has(curtainType)
  const canContinue = !!curtainType && !!fabric && !!hanger

  // Step indicator: this is step 1 of 5 user-facing steps (config, email, photo, mark, results)
  const STEP = 1, TOTAL = 5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      <TopBar
        title="Design your curtain"
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
        padding: '0 20px',
        paddingBottom: 'calc(var(--nav-height) + 88px)',
      }}>

        {error && (
          <div style={{
            background: '#fdecea', border: '1px solid #f5c6c1',
            color: '#8a2a22', borderRadius: 'var(--r-sm)',
            padding: '8px 12px', fontSize: '0.78rem', marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {/* ── 1. Curtain type ──────────────────────────────────────────────── */}
        <SectionLabel>Curtain type</SectionLabel>
        <div className="scroll-x" style={{
          display: 'flex', gap: 8, marginBottom: 22,
          overflowX: 'auto', paddingBottom: 4,
        }}>
          {CURTAIN_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setCurtainType(t.value)}
              style={{
                flexShrink: 0,
                padding: '8px 18px',
                borderRadius: 'var(--r-full)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                background: curtainType === t.value ? 'var(--accent-dim)' : 'var(--surface-2)',
                border: curtainType === t.value ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                color: curtainType === t.value ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                transition: 'all var(--duration)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 2. Fabric ────────────────────────────────────────────────────── */}
        <SectionLabel hint={curtainType ? null : 'pick a curtain type first'}>
          Fabric
        </SectionLabel>

        {!curtainType && (
          <div style={{
            background: 'var(--surface)', border: '1px dashed var(--border-2)',
            borderRadius: 'var(--r-md)', padding: '20px 16px',
            fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center',
            marginBottom: 22,
          }}>
            Select a curtain type to see matching fabrics
          </div>
        )}

        {curtainType && loadingFab && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                height: 130, borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {curtainType && !loadingFab && fabrics.length === 0 && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '20px 16px',
            fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center',
            marginBottom: 22,
          }}>
            No fabrics available for {curtainType} yet.
          </div>
        )}

        {curtainType && !loadingFab && fabrics.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 22,
          }}>
            {fabrics.map(p => (
              <FabricTile
                key={p.id}
                product={p}
                selected={fabric?.id === p.id}
                onSelect={p.in_stock ? setFabric : () => {}}
              />
            ))}
          </div>
        )}

        {/* ── 3. Hanger ────────────────────────────────────────────────────── */}
        <SectionLabel hint={curtainType ? null : 'pick a curtain type first'}>
          Hanger
        </SectionLabel>

        {!curtainType && (
          <div style={{
            background: 'var(--surface)', border: '1px dashed var(--border-2)',
            borderRadius: 'var(--r-md)', padding: '14px 16px',
            fontSize: '0.78rem', color: 'var(--text-3)', textAlign: 'center',
            marginBottom: 22,
          }}>
            Hanger options depend on curtain type
          </div>
        )}

        {curtainType && loadingHan && (
          <div style={{ marginBottom: 22 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                height: 56, borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)', marginBottom: 8,
                animation: 'shimmer 1.4s ease-in-out infinite',
              }} />
            ))}
          </div>
        )}

        {curtainType && !loadingHan && hangers.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            {hangers.map(h => (
              <HangerOption
                key={h.id}
                hanger={h}
                selected={hanger?.id === h.id}
                onSelect={setHanger}
              />
            ))}
          </div>
        )}

        {/* ── 4. Wings (only for pleated/eyelet) ───────────────────────────── */}
        {showWings && (
          <>
            <SectionLabel>Number of wings</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[1, 2].map(n => (
                <button
                  key={n}
                  onClick={() => setWings(n)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: 'var(--r-md)',
                    background: wings === n ? 'var(--accent-dim)' : 'var(--surface)',
                    border: wings === n ? '2px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all var(--duration)',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.4rem', fontWeight: 500,
                    color: wings === n ? 'var(--accent)' : 'var(--ink)',
                    marginBottom: 2,
                  }}>
                    {n}
                  </div>
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: wings === n ? 'var(--accent)' : 'var(--text-3)',
                  }}>
                    {n === 1 ? 'Single panel' : 'Two panels'}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Sticky CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: 'var(--nav-height)',
        padding: '12px 20px',
        background: 'linear-gradient(0deg, var(--bg) 70%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => canContinue && onContinue({ curtainType, fabric, hanger, wings })}
          disabled={!canContinue}
          style={{
            pointerEvents: 'auto',
            width: '100%', padding: '14px',
            borderRadius: 'var(--r-md)',
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
          <span>Continue</span>
          <span style={{ opacity: 0.6 }}>→</span>
        </button>
      </div>

      <BottomNav activeIcon="✏️" activeLabel="Design" />
    </div>
  )
}
