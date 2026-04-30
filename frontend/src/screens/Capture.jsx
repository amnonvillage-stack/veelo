import { useRef, useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav.jsx'

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatRelative(ts) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60)          return 'just now'
  if (diff < 3600)        return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)       return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7)   return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
  logoItalic: {
    fontStyle: 'italic',
  },
  logoSub: {
    fontSize: '0.62rem',
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginTop: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.02em',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0 20px',
    paddingBottom: 'calc(var(--nav-height) + 16px)',
  },
  uploadZone: {
    border: '1.5px dashed var(--border-2)',
    borderRadius: 'var(--r-lg)',
    overflow: 'hidden',
    cursor: 'pointer',
    marginBottom: 16,
    background: 'var(--surface)',
    transition: 'border-color var(--duration)',
  },
  uploadInner: {
    height: 260,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadIcon: {
    width: 68,
    height: 68,
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  },
  uploadTitle: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: 'var(--ink)',
    textAlign: 'center',
  },
  uploadSub: {
    fontSize: '0.72rem',
    color: 'var(--text-3)',
    textAlign: 'center',
  },
  ctaRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderTop: '1px solid var(--border)',
  },
  ctaBtn: {
    padding: '13px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    letterSpacing: '0.02em',
  },
  tip: {
    background: 'var(--accent-dim)',
    border: '1px solid rgba(192,112,80,.2)',
    borderRadius: 'var(--r-md)',
    padding: '12px 14px',
    marginBottom: 20,
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  tipText: {
    fontSize: '0.72rem',
    color: 'var(--text-2)',
    lineHeight: 1.6,
  },
  secLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginBottom: 10,
    marginTop: 4,
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },
  recentCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  recentThumb: {
    height: 90,
    background: 'var(--surface-2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
  },
  recentInfo: {
    padding: '8px 10px 10px',
  },
  recentName: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--ink)',
  },
  recentSub: {
    fontSize: '0.62rem',
    color: 'var(--text-3)',
    marginTop: 2,
  },
}

// ── Saved image card ────────────────────────────────────────────────────────
function SaveCard({ save, onClick }) {
  const label = save.fabric_name || 'Saved'
  const sub   = [save.curtain_type, formatRelative(save.created_at)].filter(Boolean).join(' · ')
  return (
    <div style={S.recentCard} onClick={onClick}>
      <div style={{ ...S.recentThumb, padding: 0, background: 'var(--surface-3)' }}>
        <img
          src={save.path}
          alt={label}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />
      </div>
      <div style={S.recentInfo}>
        <div style={S.recentName}>{label}</div>
        {sub && <div style={S.recentSub}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Skeleton card (loading state) ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ ...S.recentCard, cursor: 'default' }}>
      <div style={{ ...S.recentThumb, background: 'var(--surface-3)' }}>
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(90deg,var(--surface-3) 25%,var(--surface-2) 50%,var(--surface-3) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }} />
      </div>
      <div style={{ ...S.recentInfo, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ height: 10, borderRadius: 4, background: 'var(--surface-3)', width: '70%' }} />
        <div style={{ height: 8,  borderRadius: 4, background: 'var(--surface-3)', width: '50%' }} />
      </div>
    </div>
  )
}

// ── Image preview overlay ───────────────────────────────────────────────────
function PreviewOverlay({ save, onClose }) {
  if (!save) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <img
        src={save.path}
        alt={save.fabric_name}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: 'var(--r-md)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
          {save.fabric_name || 'Saved curtain'}
        </div>
        <div style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.72rem', marginTop: 4 }}>
          {[save.curtain_type, formatRelative(save.created_at)].filter(Boolean).join(' · ')}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          background: 'rgba(255,255,255,.12)',
          border: '1px solid rgba(255,255,255,.2)',
          borderRadius: 'var(--r-full)',
          color: '#fff',
          padding: '8px 24px',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
      >
        Close
      </button>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Capture({ onRoomPicked, onAdmin }) {
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)

  const [saves,       setSaves]       = useState([])
  const [savesState,  setSavesState]  = useState('loading') // 'loading' | 'ready' | 'error'
  const [preview,     setPreview]     = useState(null)

  // ── Fetch saves on mount ─────────────────────────────────────────────────
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
    const url = URL.createObjectURL(file)
    onRoomPicked(file, url)
  }

  const showRecent = savesState === 'loading' || saves.length > 0

  return (
    <div style={S.screen}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes shimmer  { 0%,100% { background-position: 200% 0; } 50% { background-position: -200% 0; } }
      `}</style>

      {/* Full-screen image preview */}
      <PreviewOverlay save={preview} onClose={() => setPreview(null)} />

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.logo}>
            Vee<span style={S.logoItalic}>lo</span>
          </div>
          <div style={S.logoSub}>Curtain Visualiser</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <div style={S.avatar}>A</div>
        </div>
      </div>

      {/* Scroll body */}
      <div className="scroll" style={S.scroll}>

        {/* Upload zone */}
        <div
          style={S.uploadZone}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        >
          <div style={S.uploadInner}>
            <div style={S.uploadIcon}>🏠</div>
            <div>
              <div style={S.uploadTitle}>Snap or upload a room</div>
              <div style={S.uploadSub}>Point your camera at the window</div>
            </div>
          </div>
          <div style={S.ctaRow}>
            <button
              style={{ ...S.ctaBtn, color: 'var(--accent)', borderRight: '1px solid var(--border)' }}
              onClick={e => { e.stopPropagation(); cameraInputRef.current?.click() }}
            >
              📷 Camera
            </button>
            <button
              style={{ ...S.ctaBtn, color: 'var(--text-2)' }}
              onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
            >
              🖼️ Gallery
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {/* Tip card */}
        <div style={S.tip}>
          <span style={{ fontSize: '1.1rem', marginTop: 1 }}>💡</span>
          <div style={S.tipText}>
            <strong style={{ color: 'var(--ink)' }}>Best results: </strong>
            Shoot straight so that the entire window frame is visible, preferably ceiling to floor, in natural daylight. Avoid backlighting.
          </div>
        </div>

        {/* Recent saved visualisations */}
        {showRecent && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
              <div style={S.secLabel}>Saved</div>
              {saves.length > 0 && (
                <span style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>
                  {saves.length} {saves.length === 1 ? 'visualisation' : 'visualisations'}
                </span>
              )}
            </div>

            <div style={S.recentGrid}>
              {savesState === 'loading' ? (
                // Skeleton placeholders
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                saves.map(save => (
                  <SaveCard
                    key={save.id}
                    save={save}
                    onClick={() => setPreview(save)}
                  />
                ))
              )}

              {/* New project card — always last, only shown when grid isn't odd-numbered loading */}
              {savesState === 'ready' && (
                <div
                  style={{ ...S.recentCard, opacity: 0.45 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ ...S.recentThumb, fontSize: '1.4rem', color: 'var(--text-3)' }}>+</div>
                  <div style={S.recentInfo}>
                    <div style={{ ...S.recentName, color: 'var(--text-3)' }}>New visualisation</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

      </div>

      <BottomNav activeIcon="🏠" activeLabel="Home" />
    </div>
  )
}
