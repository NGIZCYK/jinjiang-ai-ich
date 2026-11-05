import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './lib/i18n'
import './index.css'
import './journey.css'
import './experience-flow.css'
import './voice-settings.css'
import './styles/ops.css'
import './styles/guest-ui.css'
import './styles/stays.css'
import './styles/rooms.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>,
)
