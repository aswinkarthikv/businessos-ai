import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { setupMockApi } from './mockApi'

// Enable Client-side Mock API when hosted on GitHub Pages
if (window.location.hostname.includes('github.io')) {
  setupMockApi();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
