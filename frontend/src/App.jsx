import { Routes, Route, Navigate } from 'react-router-dom'
import SiteShell from './site/SiteShell.jsx'
import Landing   from './site/Landing.jsx'
import VeeloApp  from './veelo/VeeloApp.jsx'

// ── Top-level route shell ────────────────────────────────────────────────────
// Two siblings:
//   /          — Vicky Israel marketing site (textile & design studio)
//   /veelo/*   — Veelo curtain visualizer (the configurator PWA)
//
// The marketing site uses SiteShell as a layout route so future sub-pages
// (e.g. /studio, /work) can slot in via <Outlet /> without re-wiring routing.
//
// Veelo intentionally does NOT inherit SiteShell — it owns its own viewport
// (locked, full-bleed) and is reachable from the marketing site's "Try the
// visualizer" CTA. The redirect catches any unknown path and sends visitors
// home instead of showing a blank screen.

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route path="/" element={<Landing />} />
      </Route>
      <Route path="/veelo/*" element={<VeeloApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
