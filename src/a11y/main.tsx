import React from 'react';
import ReactDOM from 'react-dom/client';
import { A11yHarness } from './A11yHarness';
import '../newtab/styles/global.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <A11yHarness />
    </React.StrictMode>,
  );
}
