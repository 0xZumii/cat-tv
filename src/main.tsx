import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrivyWrapper } from './lib/privy';
import { ApiProvider } from './contexts/ApiContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrivyWrapper>
      <ApiProvider>
        <App />
      </ApiProvider>
    </PrivyWrapper>
  </React.StrictMode>,
);
