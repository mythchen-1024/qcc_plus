import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { ThemeProvider } from './themes'
import './themes/variables.css'
import './index.css'
import './App.css'

const root = document.getElementById('root') as HTMLElement

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
