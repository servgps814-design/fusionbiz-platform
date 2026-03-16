import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { CompanyProvider } from './hooks/useCompany'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CompanyProvider>
      <Toaster position="top-right" richColors />
      <App />
    </CompanyProvider>
  </React.StrictMode>,
)
