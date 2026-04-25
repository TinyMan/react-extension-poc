import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { methodManager } from '@host/platform'

methodManager.registerMethod('bootstrap.hello', () => {
  console.trace('Bootstrap method invoked from method manager')
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
