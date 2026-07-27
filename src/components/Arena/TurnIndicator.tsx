import { DebateConfig, DebatePhase, Side } from '../../types'

interface TurnIndicatorProps {
  currentSide: Side
  config: DebateConfig
  phase: DebatePhase
  isStreaming: boolean
  turnCount: number
  turnCap: number
}

export function TurnIndicator({
  currentSide,
  config,
  phase,
  isStreaming,
  turnCount,
  turnCap,
}: TurnIndicatorProps) {
  const debater = config.debaters[currentSide === 'left' ? 0 : 1]
  const progress = Math.min(turnCount / (turnCap * 2), 1)

  if (phase === 'done') return null
  if (phase === 'concluding') {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-violet-900/50 px-4 py-1.5 text-sm font-semibold text-violet-200">
          🏁 Final statements
        </div>
      </div>
    )
  }
  if (phase === 'paused') {
    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-zinc-800 px-4 py-1.5 text-sm font-semibold text-zinc-400">
          ⏸ Paused
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        {isStreaming && (
          <span
            className="h-2 w-2 animate-pulse-fast rounded-full"
            style={{ backgroundColor: debater.model.color }}
          />
        )}
        <span className="text-sm font-semibold text-zinc-300">
          {isStreaming ? (
            <>
              {debater.model.emoji} <span style={{ color: debater.model.color }}>{debater.personaName}</span>{' '}
              is speaking…
            </>
          ) : (
            <>
              Waiting for {debater.model.emoji}{' '}
              <span style={{ color: debater.model.color }}>{debater.personaName}</span>…
            </>
          )}
        </span>
      </div>

      {/* Round progress bar */}
      <div className="h-1 w-40 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-400 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-xs text-zinc-600">
        Turn {Math.ceil(turnCount / 2)} of {turnCap}
      </span>
    </div>
  )
}
