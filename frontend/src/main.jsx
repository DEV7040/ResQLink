import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development-disabled') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[ResQLink PWA] Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('[ResQLink PWA] Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
