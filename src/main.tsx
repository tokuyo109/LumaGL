import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import Router from './Router.tsx';
import './reset.css';
import './index.css';

console.log('service_worker.js');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <Router />
    </HelmetProvider>
  </StrictMode>,
);
