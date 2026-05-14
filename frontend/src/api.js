// api.js — centralised backend fetch helper
//
// In local dev: VITE_API_BASE is undefined → base is '' → Vite proxy handles
//   /analyze, /generate, /catalog, /saves, /status normally.
//
// In production (Netlify): VITE_API_BASE is set to the Railway backend URL
//   e.g. https://veelo-production.up.railway.app
//   All fetch calls are prefixed with it so they hit Railway directly.

export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

/**
 * Thin wrapper around fetch that prepends API_BASE to every path.
 * Usage: apiFetch('/generate', { method: 'POST', body: fd })
 */
export function apiFetch(path, init) {
  return fetch(`${API_BASE}${path}`, init)
}
