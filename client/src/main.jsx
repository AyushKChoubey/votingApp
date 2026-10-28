import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

const handleAppUrl = (url) => {
  try {
    // Dismiss any active Chrome Custom Tab immediately upon deep link arrival
    if (url.includes('auth/callback')) {
      Browser.close().catch(() => {})
    }

    const callbackUrl = new URL(url)
    const route =
      callbackUrl.protocol === 'votebooth:' && callbackUrl.host === 'auth'
        ? `/auth${callbackUrl.pathname}`
        : callbackUrl.pathname
    window.history.pushState({}, '', `${route}${callbackUrl.search}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  } catch {
    // Ignore unrelated or malformed deep links.
  }
}

CapacitorApp.addListener('appUrlOpen', ({ url }) => handleAppUrl(url))
CapacitorApp.getLaunchUrl().then((launchUrl) => {
  if (launchUrl?.url) handleAppUrl(launchUrl.url)
})
