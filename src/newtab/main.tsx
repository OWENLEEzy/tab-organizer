import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { I18nProvider } from './providers/I18nProvider';
import './styles/global.css';

const root = document.getElementById('root');
if (root) {
  const rootContainer = ReactDOM.createRoot(root);
  rootContainer.render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
}
