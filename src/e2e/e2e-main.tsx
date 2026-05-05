import React from 'react';
import ReactDOM from 'react-dom/client';
import { E2EHarness } from './E2EHarness';
import { mockChromeApi } from './mock-chrome';
import type { E2EScenario } from './mock-chrome';
import '../newtab/styles/global.css';

const SCENARIOS = new Set<E2EScenario>(['default', 'duplicates', 'empty', 'many-tabs']);

function getScenario(): E2EScenario {
  const value = new URLSearchParams(window.location.search).get('scenario');
  return value && SCENARIOS.has(value as E2EScenario) ? (value as E2EScenario) : 'default';
}

// Set up Chrome API mock before rendering
const scenario = getScenario();
mockChromeApi(scenario);

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <E2EHarness scenario={scenario} />
    </React.StrictMode>,
  );
}
