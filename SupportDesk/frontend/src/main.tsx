/**
 * Browser entry point.
 *
 * StrictMode intentionally double-invokes effects in development to surface
 * missing cleanup. Our fetch effect aborts on unmount, so it behaves correctly
 * under that check.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find #root element in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
