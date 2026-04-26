import { useEffect, useMemo, useState } from 'react'
import { shuffle } from 'lodash-es'
import * as Highcharts from 'highcharts'
import Button from '@mui/material/Button'
import ELK from 'elkjs/lib/elk.bundled.js'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { methodManager } from '@host/platform'

type SharedDepsCheckResult = {
  results: Array<{
    packageName: string
    actualVersion: string
    expectedVersion: string | null
    matches: boolean
  }>
  message: string
}

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState(
    'Bootstrap method will run on page load; click the button to invoke again.',
  )
  const [sharedDepsMessage, setSharedDepsMessage] = useState('')
  const pocInfo = useMemo(() => {
    try {
      const shuffled = shuffle([1, 2, 3, 4, 5])
      const highchartsVersion = (Highcharts as { version?: string }).version ?? 'unknown'
      const elkStatus = typeof ELK === 'function' ? 'ELK imported' : 'ELK import failed'

      return {
        lodash: shuffled.join(', '),
        highcharts: highchartsVersion,
        elk: elkStatus,
      }
    } catch (error) {
      console.error('POC imports failed:', error)
      return {
        lodash: '',
        highcharts: 'unknown',
        elk: 'POC import failed',
      }
    }
  }, [])

  useEffect(() => {
    try {
      methodManager.invokeMethod('bootstrap.hello')
    } catch (error) {
      console.error('Bootstrap method failed on load:', error)
    }
  }, [])

  const handleInvoke = () => {
    try {
      methodManager.invokeMethod('bootstrap.hello')
      setMessage('Bootstrap method invoked from button')
    } catch (error) {
      setMessage('Bootstrap method failed: ' + (error as Error).message)
    }
  }

  const handleCheckSharedDeps = async () => {
    try {
      const result = (await Promise.resolve(
        methodManager.invokeMethod('extension.sharedDeps.check'),
      )) as unknown as SharedDepsCheckResult

      if (result?.results?.length) {
        setSharedDepsMessage(result.message)
      } else {
        setSharedDepsMessage('Shared dependency check ran; see console logs for results.')
      }
    } catch (error) {
      setSharedDepsMessage('Shared dependency check failed: ' + (error as Error).message)
    }
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
          <p>{message}</p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
        <button className="counter" onClick={handleInvoke}>
          Invoke bootstrap method
        </button>
        <button className="counter" onClick={handleCheckSharedDeps}>
          Check shared extension deps
        </button>
        <Button
          variant="contained"
          onClick={() => setMessage('MUI button clicked')}
          sx={{ marginTop: '1rem' }}
        >
          MUI Button
        </Button>
        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
          <p>Lodash shuffle: {pocInfo.lodash}</p>
          <p>Highcharts version: {pocInfo.highcharts}</p>
          <p>{pocInfo.elk}</p>
          <p style={{ marginTop: '1rem', fontWeight: '700' }}>
            Shared dep check: {sharedDepsMessage || 'Not run yet'}
          </p>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
