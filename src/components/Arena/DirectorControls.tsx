import { useDebateStore } from '../../store/debateStore'
import { FireMeter } from './FireMeter'

interface DirectorControlsProps {
  onProvoke: () => void
  onWrapUp: () => void
  isStreaming: boolean
}

export function DirectorControls({ onProvoke, onWrapUp, isStreaming }: DirectorControlsProps) {
  const { phase, intensity, setIntensity, pauseDebate, resumeDebate, startConcluding } =
    useDebateStore()

  const isPaused = phase === 'paused'
  const isConcluding = phase === 'concluding'
  const isDone = phase === 'done'
  const isActive = phase === 'debating' || phase === 'paused'

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-700/60 bg-zinc-900/80 px-6 py-4 backdrop-blur-sm shadow-xl">
      <span className="w-full text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
        Director Controls
      </span>

      {/* Stop / Resume */}
      {isActive && (
        <button
          onClick={isPaused ? resumeDebate : pauseDebate}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${
            isPaused
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
          aria-label={isPaused ? 'Resume debate' : 'Pause debate'}
        >
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      )}

      {/* Fire meter */}
      <FireMeter intensity={intensity} onChange={setIntensity} disabled={isDone} />

      {/* Provoke */}
      <button
        onClick={onProvoke}
        disabled={isDone || isConcluding || isStreaming}
        className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        title="You gonna let them talk to you like that?"
      >
        😤 Provoke
      </button>

      {/* Wrap it up */}
      {!isConcluding && !isDone && (
        <button
          onClick={() => {
            startConcluding()
            onWrapUp()
          }}
          disabled={isStreaming}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🏁 Wrap It Up
        </button>
      )}

      {isConcluding && (
        <span className="rounded-lg bg-violet-900/50 px-4 py-2 text-sm font-bold text-violet-300">
          🏁 Closing statements…
        </span>
      )}

      {isDone && (
        <span className="rounded-lg bg-green-900/50 px-4 py-2 text-sm font-bold text-green-300">
          ✅ Debate concluded
        </span>
      )}
    </div>
  )
}
