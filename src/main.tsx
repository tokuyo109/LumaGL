// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import Router from './Router.tsx';
import './reset.css';
import './index.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(() => {})
    .catch((err) => {
      console.error('Service Worker登録失敗', err);
    });
}

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <Router />
  </HelmetProvider>,
  // <StrictMode>
  //   <HelmetProvider>
  //     <Router />
  //   </HelmetProvider>
  // </StrictMode>,
);
