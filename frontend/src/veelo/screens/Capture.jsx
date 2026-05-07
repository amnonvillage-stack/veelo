// ── Capture — Home screen ─────────────────────────────────────────────────────
// Entry point of the Veelo flow. The user takes/uploads a room photo here,
// and can browse previously saved visualisations.

import { useRef, useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import {
  IconCamera, IconImage, IconSettings, IconLightbulb,
  IconUpload, IconHome, IconX,
} from '../components/icons.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRelative(ts) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Saved image card ──────────────────────────────────────────────────────────
function SaveCard({ save, onClick }) {
  const label = save.fabric_name || 'Saved'
  const sub   = [save.curtain_type, formatRelative(save.created_at)].filter(Boolean).join(' · ')
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.15s var(--ease), box-shadow var(--duration)',
      }}
    >
      <div style={{ height: 90, background: 'var(--surface-3)' }}>
        <img
          src={save.path} alt={label} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div style={{ padding: '8px 10px 10px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', overflow: 'hidden',
    }}>
      <div style={{
        height: 90,
        background: 'linear-gradient(90deg,var(--surface-3) 25%,var(--surface-2) 50%,var(--surface-3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }} />
      <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ height: 10, borderRadius: 4, background: 'var(--surface-3)', width: '65%' }} />
        <div style={{ height: 8,  borderRadius: 4, background: 'var(--surface-3)', width: '45%' }} />
      </div>
    </div>
  )
}

// ── Full-screen preview overlay ───────────────────────────────────────────────
function PreviewOverlay({ save, onClose }) {
  if (!save) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.9)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <img
        src={save.path} alt={save.fabric_name}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain',
          borderRadius: 'var(--r-md)', boxShadow: '0 8px 40px rgba(0,0,0,.6)',
        }}
      />
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
          {save.fabric_name || 'Saved curtain'}
        </div>
        <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.7rem', marginTop: 4 }}>
          {[save.curtain_type, formatRelative(save.created_at)].filter(Boolean).join(' · ')}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: 20, background: 'rgba(255,255,255,.12)',
          border: '1px solid rgba(255,255,255,.22)', borderRadius: 'var(--r-full)',
          color: '#fff', padding: '8px 24px',
          fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <IconX size={14} /> Close
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Capture({ onRoomPicked, onAdmin }) {
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  const [saves,      setSaves]      = useState([])
  const [savesState, setSavesState] = useState('loading')  // 'loading' | 'ready' | 'error'
  const [preview,    setPreview]    = useState(null)
  const [dragOver,   setDragOver]   = useState(false)

  // Fetch saves on mount
  useEffect(() => {
    let cancelled = false
    fetch('/saves')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (!cancelled) { setSaves(data); setSavesState('ready') } })
      .catch(() => { if (!cancelled) setSavesState('error') })
    return () => { cancelled = true }
  }, [])

  const handleFile = (file) => {
    if (!file) return
    onRoomPicked(file, URL.createObjectURL(file))
  }

  const showRecent = savesState === 'loading' || saves.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', position: 'relative' }}>
      <style>{`
        @keyframes shimmer {
          0%,100% { background-position:  200% 0; }
          50%      { background-position: -200% 0; }
        }
        @keyframes zone-pulse {
          0%, 100% { border-color: rgba(192,112,80,.28); }
          50%       { border-color: rgba(192,112,80,.6);  }
        }
      `}</style>

      <PreviewOverlay save={preview} onClose={() => setPreview(null)} />

      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px 10px', flexShrink: 0,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '2.2rem',
            fontWeight: 300, letterSpacing: '0.04em', color: 'var(--ink)', lineHeight: 1,
          }}>
            Vee<span style={{ fontStyle: 'italic' }}>lo</span>
          </div>
          <div style={{
            fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'var(--text-3)', marginTop: 4,
          }}>
            Curtain Visualiser
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onAdmin}
            title="Admin"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-2)', cursor: 'pointer',
              transition: 'background var(--duration)',
            }}
          >
            <IconSettings size={17} />
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff',
          }}>
            V
          </div>
        </div>
      </div>

      {/* ── Scroll body ── */}
      <div className="scroll" style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '0 18px',
        paddingBottom: 'calc(var(--nav-height) + 16px)',
      }}>

        {/* Upload drop zone */}
        <div
          style={{
            border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-2)'}`,
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            marginBottom: 14,
            background: dragOver ? 'var(--accent-dim)' : 'var(--surface)',
            transition: 'border-color var(--duration), background var(--duration)',
            animation: dragOver ? 'none' : 'zone-pulse 3s ease-in-out infinite',
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        >
          {/* Zone body */}
          <div style={{
            height: 240,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14,
          }}>
            <div style={{
              width: 68, height: 68,
              borderRadius: 'var(--r-md)',
              background: dragOver ? 'rgba(192,112,80,.15)' : 'var(--surface-2)',
              border: `1px solid ${dragOver ? 'rgba(192,112,80,.3)' : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dragOver ? 'var(--accent)' : 'var(--text-3)',
              transition: 'all var(--duration)',
            }}>
              {dragOver ? <IconUpload size={30} /> : <IconCamera size={30} />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.95rem', fontWeight: 500,
                color: dragOver ? 'var(--accent)' : 'var(--ink)',
                transition: 'color var(--duration)',
              }}>
                {dragOver ? 'Drop to upload' : 'Snap or upload a room'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                Point your camera at the window
              </div>
            </div>
          </div>

          {/* Camera / Gallery row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border)' }}>
            <button
              style={{
                padding: '13px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--accent)',
                background: 'none', border: 'none',
                borderRight: '1px solid var(--border)',
                cursor: 'pointer', letterSpacing: '0.02em',
              }}
              onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
            >
              <IconCamera size={17} />
              Camera
            </button>
            <button
              style={{
                padding: '13px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: '0.78rem', fontWeight: 600,
                color: 'var(--text-2)',
                background: 'none', border: 'none',
                cursor: 'pointer', letterSpacing: '0.02em',
              }}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              <IconImage size={17} />
              Gallery
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input ref={fileInputRef}   type="file" accept="image/*"                   style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />

        {/* Tip card */}
        <div style={{
          background: 'var(--accent-dim)',
          border: '1px solid rgba(192,112,80,.2)',
          borderRadius: 'var(--r-md)',
          padding: '12px 14px',
          marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, paddingTop: 1 }}>
            <IconLightbulb size={18} />
          </span>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--ink)' }}>Best results: </strong>
            Shoot straight so that the entire window frame is visible, preferably ceiling to floor, in natural daylight. Avoid backlighting.
          </div>
        </div>

        {/* Saved visualisations */}
        {showRecent && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 2 }}>
              <div style={{
                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'var(--text-3)',
              }}>
                Saved
              </div>
              {saves.length > 0 && (
                <span style={{
                  fontSize: '0.6rem', color: 'var(--text-3)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-full)',
                  padding: '2px 8px',
                }}>
                  {saves.length} {saves.length === 1 ? 'visualisation' : 'visualisations'}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {savesState === 'loading' ? (
                <><SkeletonCard /><SkeletonCard /></>
              ) : (
                saves.map(save => (
                  <SaveCard key={save.id} save={save} onClick={() => setPreview(save)} />
                ))
              )}

              {/* "New" placeholder — always shown when ready */}
              {savesState === 'ready' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'var(--surface)',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    minHeight: 120, gap: 8,
                    color: 'var(--text-4)',
                    cursor: 'pointer',
                    transition: 'border-color var(--duration), color var(--duration)',
                  }}
                >
                  <IconUpload size={22} />
                  <span style={{ fontSize: '0.64rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                    New visualisation
                  </span>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      <BottomNav activeIcon={IconHome} activeLabel="Home" />
    </div>
  )
}
