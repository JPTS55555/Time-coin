import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;"><h3>Global Error:</h3><pre>${e.error?.stack || e.message}</pre></div>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<div style="color:red;padding:20px;font-family:monospace;"><h3>Unhandled Promise Rejection:</h3><pre>${e.reason?.stack || e.reason}</pre></div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
