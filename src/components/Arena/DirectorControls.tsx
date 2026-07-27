import { useState, useEffect } from 'react'
import { useDebateStore } from '../../store/debateStore'
import { FireMeter } from './FireMeter'

interface DirectorControlsProps {
  onProvoke: () => void
  onWrapUp: () => void
  isStreaming: boolean
}

interface InjectedFeedback {
  key: number
  label: string
}

export function DirectorControls({ onProvoke, onWrapUp, isStreaming }: DirectorControlsProps) {
  const { phase, intensity, setIntensity, pauseDebate, resumeDebate, startConcluding } =
    useDebateStore()
  const [injected, setInjected] = useState<InjectedFeedback | null>(null)
  const feedbackKey = injected?.key ?? 0

  const isPaused = phase === 'paused'
  const isConcluding = phase === 'concluding'
  const isDone = phase === 'done'
  const isActive = phase === 'debating' || phase === 'paused'

  const showFeedback = (label: string) => {
    setInjected({ key: Date.now(), label })
  }

  // Clear feedback after animation duration
  useEffect(() => {
    if (!injected) return
    const t = setTimeout(() => setInjected(null), 2200)
    return () => clearTimeout(t)
  }, [injected])

  const handleProvoke = () => {
    onProvoke()
    showFeedback('⚡ Provocation injected')
  }

  const handleWrapUp = () => {
    startConcluding()
    onWrapUp()
    showFeedback('🏁 Closing statements triggered')
  }

  if (isDone) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-green-900/40 border border-green-700/40 px-5 py-2 text-sm font-bold text-green-300">
          ✅ Debate concluded
        </span>
      </div>
    )
  }

  if (isConcluding) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-violet-900/40 border border-violet-700/40 px-5 py-2 text-sm font-bold text-violet-300 animate-pulse">
          🏁 Final statements…
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Injected feedback banner */}
      {injected && (
        <div
          key={feedbackKey}
          className="animate-injected flex justify-center pointer-events-none"
        >
          <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-4 py-1 text-xs font-bold text-yellow-300 tracking-wide">
            {injected.label}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-700/50 bg-zinc-900/80 px-5 py-3 backdrop-blur-sm shadow-xl">
        <span className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Director Controls
        </span>

        {/* Stop / Resume — most prominent */}
        {isActive && (
          <button
            onClick={isPaused ? resumeDebate : pauseDebate}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-black tracking-wide transition-all shadow-md ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
            aria-label={isPaused ? 'Resume debate' : 'Pause debate'}
          >
            {isPaused ? '▶ Resume' : '⏸ Stop'}
          </button>
        )}

        {/* Intensity / Fire meter */}
        <FireMeter intensity={intensity} onChange={setIntensity} disabled={isDone} />

        <div className="flex gap-2">
          {/* Provoke */}
          <button
            onClick={handleProvoke}
            disabled={isDone || isConcluding || isStreaming}
            className="flex items-center gap-1.5 rounded-xl bg-orange-600/90 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-orange-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 shadow-md shadow-orange-950/50"
            title="You gonna let them talk to you like that?"
          >
            😤 Provoke
          </button>

          {/* Wrap it up */}
          <button
            onClick={handleWrapUp}
            disabled={isStreaming}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600/90 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 shadow-md shadow-violet-950/50"
          >
            🏁 Wrap Up
          </button>
        </div>
      </div>
    </div>
  )
}
