import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { validateAuthOnStartup } from './store/appStore'
import './index.css'

// Validate the persisted JWT before first render.
// If the token is expired, this clears isAuthenticated so the navbar
// correctly shows "Sign In" instead of "Dashboard" on the production URL.
validateAuthOnStartup().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>,
  )
})
