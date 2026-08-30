import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import { NotificationProvider } from './lib/NotificationContext'
import { Toaster } from 'sonner'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <App />
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-body)" } }} />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
)
