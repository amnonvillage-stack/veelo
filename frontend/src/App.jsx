import { Routes, Route, Navigate } from 'react-router-dom'
import SiteShell from './site/SiteShell.jsx'
import Landing from './site/Landing.jsx'
import VeeloApp from './veelo/VeeloApp.jsx'

// App — top-level Routes. The marketing site at / sits inside SiteShell
// (header + footer chrome). Veelo is rendered as a single route at /veelo*
// because its internal flow holds enough cross-screen state that nesting
// router routes inside it would just add ceremony.
//
// TODO(perf): if the marketing landing grows past ~200KB gz, code-split:
//   const Landing = lazy(() => import('./site/Landing.jsx'))
//   const VeeloApp = lazy(() => import('./veelo/VeeloApp.jsx'))
// and wrap Routes in <Suspense>. Not worth doing today.

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route path="/" element={<Landing />} />
      </Route>
      <Route path="/veelo/*" element={<VeeloApp />} />

      {/* Anything unrecognised lands on the marketing home rather than 404'ing.
          For an MVP brochure site this is friendlier than a hard 404 page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
