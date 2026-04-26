import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { methodManager } from '@host/platform'
import Button from '@mui/material/Button'
import { shuffle } from 'lodash-es'
import ELK from 'elkjs/lib/elk.bundled.js'
import { loadExtension } from './extension-loader.ts'

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
loadExtension();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
