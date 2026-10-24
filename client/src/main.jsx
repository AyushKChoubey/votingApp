import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

const handleAppUrl = (url) => {
  try {
    const callbackUrl = new URL(url)
    window.history.pushState({}, '', `${callbackUrl.pathname}${callbackUrl.search}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  } catch {
    // Ignore unrelated or malformed deep links.
  }
}

CapacitorApp.addListener('appUrlOpen', ({ url }) => handleAppUrl(url))
CapacitorApp.getLaunchUrl().then((launchUrl) => {
  if (launchUrl?.url) handleAppUrl(launchUrl.url)
})
