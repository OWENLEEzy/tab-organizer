import React from 'react';
import ReactDOM from 'react-dom/client';
import { E2EHarness } from './E2EHarness';
import { mockChromeApi } from './mock-chrome';
import '../newtab/styles/global.css';

// Set up Chrome API mock before rendering
mockChromeApi();

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <E2EHarness />
    </React.StrictMode>,
  );
}
