import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { BlinkProvider, BlinkAuthProvider } from '@blinkdotnew/react'
import { CompanyProvider } from './hooks/useCompany'
import App from './App'
import './index.css'

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = window.location.hostname
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  if (match) return match[1]
  return 'fusionbiz-platform-eqm2kch7'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BlinkProvider 
      projectId={getProjectId()}
      publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY}
    >
      <BlinkAuthProvider>
        <CompanyProvider>
          <Toaster position="top-right" richColors />
          <App />
        </CompanyProvider>
      </BlinkAuthProvider>
    </BlinkProvider>
  </React.StrictMode>,
)