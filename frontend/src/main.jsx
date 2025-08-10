import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

// PrimeReact core CSS
// Insert a theme link element with id for runtime switching
const themeId = 'primereact-theme-link';
if (!document.getElementById(themeId)) {
  const link = document.createElement('link');
  link.id = themeId;
  link.rel = 'stylesheet';
  // default theme; can be replaced at runtime
  const saved = localStorage.getItem('theme') || 'lara-light-blue';
  link.href = `https://unpkg.com/primereact/resources/themes/${saved}/theme.css`;
  document.head.appendChild(link);
}
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// Global styles (Sass)
import './styles/global.scss'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
