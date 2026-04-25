import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { methodManager } from '@host/platform'

methodManager.registerMethod('bootstrap.hello', () => {
  console.trace('Bootstrap method invoked from method manager')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
