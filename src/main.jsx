import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { MaterialHistoryProvider } from './contexts/MaterialHistoryContext'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <MaterialHistoryProvider>
        <App />
      </MaterialHistoryProvider>
    </AuthProvider>
  </StrictMode>,
)
