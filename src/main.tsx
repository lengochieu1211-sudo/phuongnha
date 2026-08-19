import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CameraPoseProvider } from './providers/CameraPoseContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CameraPoseProvider>
      <App />
    </CameraPoseProvider>
  </StrictMode>,
);
