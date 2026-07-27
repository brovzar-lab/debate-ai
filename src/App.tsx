import { useState } from 'react'
import { DebateConfig } from './types'
import { SetupScreen } from './components/Setup/SetupScreen'
import { ArenaScreen } from './components/Arena/ArenaScreen'
import { DemoBadge } from './components/shared/DemoBadge'
import { useDebateStore } from './store/debateStore'
import { isDemoMode } from './lib/demo'

export function App() {
  const [started, setStarted] = useState(false)
  const { startDebate, resetDebate } = useDebateStore()
  const demo = isDemoMode()

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
