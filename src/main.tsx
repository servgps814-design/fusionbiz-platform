import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { CompanyProvider } from './hooks/useCompany'
import App from './App'
import './index.css'

// ─── Initialize configuration and monitoring
import { config, validateConfig } from './lib/config'
import { logInfo, logError } from './lib/logger'
import { performanceMonitor } from './lib/performance'

// ─── Validate configuration in production
if (config.app.environment === 'production') {
  const errors = validateConfig()
  if (errors.length > 0) {
    logError('Configuration validation failed', new Error(errors.join(', ')))
  }
}

logInfo(`FusionBiz Platform ${config.app.version} starting...`, {
  environment: config.app.environment,
})

// ─── Initialize Google Analytics if configured
if (config.monitoring.googleAnalyticsId && typeof window !== 'undefined') {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.monitoring.googleAnalyticsId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', config.monitoring.googleAnalyticsId)
  ;(window as any).gtag = gtag
}

// ─── Initialize Mixpanel if configured
if (config.monitoring.mixpanelToken && typeof window !== 'undefined') {
  ;(window as any).mixpanel = {
    track: (event: string, props: any) => {
      if (config.features.logging) {
        logInfo(`Analytics event: ${event}`, props)
      }
    },
  }
}

// ─── Initialize Service Worker for PWA (if enabled)
if (config.cdn.enableServiceWorker && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logInfo('Service Worker registered successfully', {
          scope: registration.scope,
        })
      })
      .catch((error) => {
        logError('Service Worker registration failed', error)
      })
  })
}

// ─── Log performance metrics when page loads
if (config.features.analytics) {
  window.addEventListener('load', () => {
    const metrics = performanceMonitor.getPageMetrics()
    if (metrics) {
      logInfo('Page metrics collected', metrics)
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CompanyProvider>
      <Toaster position="top-right" richColors />
      <App />
    </CompanyProvider>
  </React.StrictMode>,
)

