// ── Capture — Home screen ─────────────────────────────────────────────────────
// Entry point of the Veelo flow. The user takes/uploads a room photo here,
// and can browse previously saved visualisations.

import { useRef, useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav.jsx'
import MobileMenu from '../components/MobileMenu.jsx'
import { useDesktop } from '../hooks/useDesktop.js'
import { useT } from '../../i18n/useT.js'
import {
  IconCamera, IconImage, IconSettings, IconLightbulb,
  IconUpload, IconHome, IconX, IconTrash, IconMenu,
} from '../components/icons.jsx'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatRelative(ts, t) {
  const diff = Math.floor(Date.now() / 1000) - ts
  if (diff < 60)        return t('app.capture.just_now')
  if (diff < 3600)      return `${Math.floor(diff / 60)}${t('app.capture.min_ago')}`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}${t('app.capture.hour_ago')}`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}${t('app.capture.day_ago')}`
  return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ── Saved image card ──────────────────────────────────────────────────────────
function SaveCard({ save, onClick, onDelete }) {
  const t = useT()
  const [hovered, setHovered] = useState(false)
  const label = save.fabric_name || t('app.capture.saved_label')
  const sub   = [save.curtain_type, formatRelative(save.created_at, t)].filter(Boolean).join(' · ')

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(save)
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.15s var(--ease), box-shadow var(--duration)',
        position: 'relative',
      }}
    >
      <div style={{ height: 90, background: 'var(--surface-3)', position: 'relative' }}>
        <img
          src={save.path} alt={label} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Delete button — always visible on touch devices, hover-reveal on desktop */}
        <button
          onClick={handleDelete}
          title="Delete"
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 26, height: 26, borderRadius: '50%',
            background: 'rgba(26,22,16,0.7)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s ease',
            // Always visible on touch/mobile (no hover state)
            '@media (hover: none)': { opacity: 1 },
          }}
          onTouchStart={(e) => { e.currentTarget.style.opacity = 1 }}
        >
          <IconTrash size={13} strokeWidth={2} />
        </button>
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
function PreviewOverlay({ save, onClose, onDelete }) {
  const t = useT()
  if (!save) return null

  const handleDelete = () => {
    onDelete(save)
    onClose()
  }

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
      <div
        onClick={e => e.stopPropagation()}
        style={{ marginTop: 20, display: 'flex', gap: 10 }}
      >
        <button
          onClick={handleDelete}
          style={{
            background: 'rgba(200,50,50,.25)',
            border: '1px solid rgba(200,80,80,.4)', borderRadius: 'var(--r-full)',
            color: '#ff8080', padding: '8px 20px',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <IconTrash size={14} strokeWidth={2} /> {t('app.capture.delete')}
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.22)', borderRadius: 'var(--r-full)',
            color: '#fff', padding: '8px 24px',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <IconX size={14} /> {t('app.capture.close')}
        </button>
      </div>
    </div>
  )
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ dragOver, onDragOver, onDragLeave, onDrop, onClick, onCamera, onGallery, isDesktop }) {
  const t = useT()
  return (
    <div
      style={{
        border: `1.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-2)'}`,
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        background: dragOver ? 'var(--accent-dim)' : 'var(--surface)',
        transition: 'border-color var(--duration), background var(--duration)',
        animation: dragOver ? 'none' : 'zone-pulse 3s ease-in-out infinite',
        display: 'flex',
        flexDirection: 'column',
        flex: isDesktop ? '1 1 0' : undefined,
      }}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Zone body */}
      <div style={{
        flex: 1,
        minHeight: isDesktop ? 260 : 240,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        padding: '20px 16px',
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
            fontSize: isDesktop ? '1.05rem' : '0.95rem', fontWeight: 500,
            color: dragOver ? 'var(--accent)' : 'var(--ink)',
            transition: 'color var(--duration)',
          }}>
            {dragOver ? t('app.capture.drop_to_upload') : t('app.capture.snap_or_upload')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
            {isDesktop ? t('app.capture.drag_hint_desktop') : t('app.capture.drag_hint_mobile')}
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
          onClick={e => { e.stopPropagation(); onCamera() }}
        >
          <IconCamera size={17} />
          {t('app.capture.camera')}
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
          onClick={e => { e.stopPropagation(); onGallery() }}
        >
          <IconImage size={17} />
          {t('app.capture.gallery')}
        </button>
      </div>
    </div>
  )
}

// ── Tip card ──────────────────────────────────────────────────────────────────
function TipCard() {
  const t = useT()
  return (
    <div style={{
      background: 'var(--accent-dim)',
      border: '1px solid rgba(192,112,80,.2)',
      borderRadius: 'var(--r-md)',
      padding: '12px 14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ color: 'var(--accent)', flexShrink: 0, paddingTop: 1 }}>
        <IconLightbulb size={18} />
      </span>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
        <strong style={{ color: 'var(--ink)' }}>{t('app.capture.tip_title')} </strong>
        {t('app.capture.tip_body')}
      </div>
    </div>
  )
}

// ── Saved section ─────────────────────────────────────────────────────────────
function SavedSection({ saves, savesState, onPreview, onDelete, onNew, cols }) {
  const t = useT()
  const showRecent = savesState === 'loading' || saves.length > 0
  if (!showRecent) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 2 }}>
        <div style={{
          fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: 'var(--text-3)',
        }}>
          {t('app.capture.saved_label')}
        </div>
        {saves.length > 0 && (
          <span style={{
            fontSize: '0.6rem', color: 'var(--text-3)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-full)',
            padding: '2px 8px',
          }}>
            {saves.length} {saves.length === 1 ? t('app.capture.vis_one') : t('app.capture.vis_many')}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
        {savesState === 'loading' ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            {cols >= 3 && <SkeletonCard />}
          </>
        ) : (
          saves.map(save => (
            <SaveCard key={save.id} save={save} onClick={() => onPreview(save)} onDelete={onDelete} />
          ))
        )}

        {/* "New" placeholder */}
        {savesState === 'ready' && (
          <div
            onClick={onNew}
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
              {t('app.capture.new_vis')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Capture({ onRoomPicked, onAdmin }) {
  const t              = useT()
  const fileInputRef   = useRef(null)
  const cameraInputRef = useRef(null)
  const isDesktop      = useDesktop()

  const [saves,      setSaves]      = useState([])
  const [savesState, setSavesState] = useState('loading')
  const [preview,    setPreview]    = useState(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)

  // Fetch saves on mount
  useEffect(() => {
    let cancelled = false
    fetch('/saves')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { if (!cancelled) { setSaves(data); setSavesState('ready') } })
      .catch(() => { if (!cancelled) setSavesState('error') })
    return () => { cancelled = true }
  }, [])

  // Delete a save — optimistic removal, rollback on network error
  const handleDelete = async (save) => {
    setSaves(prev => prev.filter(s => s.id !== save.id))
    try {
      const res = await fetch(`/saves/${save.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      // Rollback: re-insert at original position
      setSaves(prev => {
        const next = [...prev, save]
        next.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
        return next
      })
    }
  }

  const handleFile = (file) => {
    if (!file) return
    onRoomPicked(file, URL.createObjectURL(file))
  }

  const zoneProps = {
    dragOver,
    onDragOver: e => { e.preventDefault(); setDragOver(true) },
    onDragLeave: () => setDragOver(false),
    onDrop: e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) },
    onClick: () => fileInputRef.current?.click(),
    onCamera: () => cameraInputRef.current?.click(),
    onGallery: () => fileInputRef.current?.click(),
    isDesktop,
  }

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

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <PreviewOverlay save={preview} onClose={() => setPreview(null)} onDelete={handleDelete} />

      {/* ── Header ── */}
      <div style={{
        padding: isDesktop ? '16px 32px 12px' : '12px 20px',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <div>
          <img
            src="/logo.png"
            alt="Vicky Israel · Textile & Design Studio"
            style={{ height: isDesktop ? 52 : 44, width: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hamburger — mobile only */}
          {!isDesktop && (
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              style={{
                width: 40, height: 40, borderRadius: 'var(--r-sm)',
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--ink)', cursor: 'pointer',
              }}
            >
              <IconMenu size={24} />
            </button>
          )}

          {/* Admin button — desktop only */}
          {isDesktop && (
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
          )}
          {isDesktop && (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff',
            }}>
              V
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*"                   style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />

      {isDesktop ? (
        /* ── Desktop: two-column layout ── */
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          overflow: 'hidden',
          maxWidth: 1280,
          width: '100%',
          alignSelf: 'center',
          padding: '28px 32px',
          paddingBottom: 'calc(var(--nav-height) + 20px)',
          boxSizing: 'border-box',
        }}>
          {/* Column 1: upload zone */}
          <div style={{
            paddingInlineEnd: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            overflow: 'hidden',
          }}>
            <UploadZone {...zoneProps} />
          </div>

          {/* Column 2: tip + saved */}
          <div className="scroll" style={{
            paddingInlineStart: 20,
            borderInlineStart: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
          }}>
            {/* Tagline */}
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem', fontWeight: 300, color: 'var(--ink)',
                lineHeight: 1.3, marginBottom: 8,
              }}>
                {t('app.capture.tagline')} <span style={{ fontStyle: 'italic' }}>{t('app.capture.tagline_em')}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {t('app.capture.tagline_sub')}
              </div>
            </div>

            <TipCard />

            <SavedSection
              saves={saves}
              savesState={savesState}
              onPreview={setPreview}
              onDelete={handleDelete}
              onNew={() => fileInputRef.current?.click()}
              cols={3}
            />
          </div>
        </div>
      ) : (
        /* ── Mobile: single-column scroll ── */
        <div className="scroll" style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '0 18px',
          paddingBottom: 'calc(var(--nav-height) + 16px)',
        }}>
          <div style={{ marginBottom: 14, paddingTop: 14 }}>
            <UploadZone {...zoneProps} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <TipCard />
          </div>

          <SavedSection
            saves={saves}
            savesState={savesState}
            onPreview={setPreview}
            onDelete={handleDelete}
            onNew={() => fileInputRef.current?.click()}
            cols={2}
          />
        </div>
      )}

      <BottomNav activeIcon={IconHome} activeLabel={t('app.capture.home')} onMenu={() => setMenuOpen(true)} />
    </div>
  )
}
