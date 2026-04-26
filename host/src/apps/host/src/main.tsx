import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { methodManager } from '@host/platform'
import Button from '@mui/material/Button'
import { shuffle } from 'lodash-es'
import ELK from 'elkjs/lib/elk.bundled.js'

methodManager.registerMethod('bootstrap.hello', () => {
  console.trace('Bootstrap method invoked from method manager')
})

methodManager.registerMethod('host.sharedDeps.info', () => {
  return {
    react: React,
    Button,
    shuffle,
    ELK,
  }
})

// Dynamically load extension if available
try {  
  // @ts-expect-error - This import is resolved by the custom Vite plugin and may not exist in host-only mode
  const extension = await import('virtual:extension');
  console.log(extension)
  extension.register();
  console.log('Extension loaded successfully');
} catch (error) {
  console.log('Extension not available (host-only mode):', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
