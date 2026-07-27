import { useState, useEffect } from 'react'
import { DebateConfig } from './types'
import { SetupScreen } from './components/Setup/SetupScreen'
import { ArenaScreen } from './components/Arena/ArenaScreen'
import { DemoBadge } from './components/shared/DemoBadge'
import { useDebateStore } from './store/debateStore'
import { isDemoMode, setServerProxyAvailable } from './lib/demo'

export function App() {
  const [started, setStarted] = useState(false)
  const [demo, setDemo] = useState(isDemoMode())
  const { startDebate, resetDebate } = useDebateStore()

  useEffect(() => {
    fetch('/api/chat')
      .then((res) => res.json() as Promise<{ proxyAvailable?: boolean }>)
      .then((data) => {
        setServerProxyAvailable(data.proxyAvailable === true)
        setDemo(isDemoMode())
      })
      .catch(() => {
        setServerProxyAvailable(false)
      })
  }, [])

  const handleStart = (config: DebateConfig) => {
    startDebate(config)
    setStarted(true)
  }

  const handleReset = () => {
    resetDebate()
    setStarted(false)
  }

  return (
    <>
      {demo && <DemoBadge />}
      {started ? (
        <ArenaScreen onReset={handleReset} />
      ) : (
        <SetupScreen onStart={handleStart} />
      )}
    </>
  )
}
