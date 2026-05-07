import { Outlet } from 'react-router-dom'
import SiteHeader from './components/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import './site.css'

// SiteShell — header + main + footer wrapper for the marketing routes.
// Used as a layout route; <Outlet /> renders the matched child (Landing today,
// future routes like /about, /portfolio tomorrow).

export default function SiteShell() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="site-main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
