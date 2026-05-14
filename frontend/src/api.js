// api.js — centralised backend fetch helper
//
// In local dev: VITE_API_BASE is undefined → base is '' → Vite proxy handles
//   /analyze, /generate, /catalog, /saves, /status normally.
//
// In production (Netlify): VITE_API_BASE is set to the Railway backend URL
//   e.g. https://veelo-production.up.railway.app
//   All fetch calls are prefixed with it so they hit Railway directly.

export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// ── Anonymous session identity ────────────────────────────────────────────────
// A UUID generated on first visit and persisted in localStorage.
// Sent as X-Session-ID on every request so each visitor only sees their
// own saves. No login required — privacy through obscurity is fine for a
// teaser tool. Upgrade to phone/email auth later without breaking anything.

const SESSION_KEY = 'veelo.session'

export function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // localStorage blocked (private mode, etc.) — generate ephemeral ID
    return crypto.randomUUID()
  }
}

/**
 * Thin wrapper around fetch that prepends API_BASE and injects X-Session-ID.
 * Usage: apiFetch('/generate', { method: 'POST', body: fd })
 */
export function apiFetch(path, init = {}) {
  const sessionId = getSessionId()
  const headers = {
    'X-Session-ID': sessionId,
    ...(init.headers || {}),
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}
