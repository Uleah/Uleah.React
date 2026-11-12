import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// In a real app: import '@uleah/react/styles.css' (and optionally '@uleah/react/base.css').
import '../../src/styles/index.scss';
import '../../src/styles/base.scss';
import { App } from './App.js';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
