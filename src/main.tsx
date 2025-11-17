import { Buffer } from "buffer";

window.Buffer = Buffer;


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import {WalletContext} from './context/WalletContext.tsx';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletContext>
    <App />
    </WalletContext>
  </StrictMode>,
)
