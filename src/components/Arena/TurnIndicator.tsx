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
  const color = debater.model.color
  const totalTurns = turnCap * 2
  const progress = Math.min(turnCount / totalTurns, 1)
  const currentRound = Math.ceil((turnCount + 1) / 2)

  if (phase === 'done') return null

  if (phase === 'concluding') {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse-fast" />
        <span className="text-sm font-semibold text-violet-300">Final statements</span>
      </div>
    )
  }

  if (phase === 'paused') {
    return (
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-semibold text-zinc-500">⏸ Paused</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Speaker status row */}
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <WaveformBars color={color} />
        ) : (
          <span className="h-2 w-2 rounded-full bg-zinc-600 animate-pulse" />
        )}
        <span className="text-sm font-semibold text-zinc-300">
          {isStreaming ? (
            <>
              <span style={{ color }}>{debater.personaName}</span>
              {' '}is speaking
            </>
          ) : (
            <>
              Waiting for <span style={{ color }}>{debater.personaName}</span>
            </>
          )}
        </span>
        <span className="text-xs text-zinc-600">· Round {currentRound}/{turnCap}</span>
      </div>

      {/* Match progress */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: turnCap * 2 }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-3 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i < turnCount
                ? config.debaters[i % 2 === 0 ? 0 : 1].model.color + 'aa'
                : i === turnCount
                ? (isStreaming ? color : '#3f3f46')
                : '#27272a',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function WaveformBars({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5" style={{ height: 16 }}>
      <span
        className="w-1 rounded-full animate-waveform-1 self-center"
        style={{ backgroundColor: color, height: 4 }}
      />
      <span
        className="w-1 rounded-full animate-waveform-2 self-center"
        style={{ backgroundColor: color, height: 4 }}
      />
      <span
        className="w-1 rounded-full animate-waveform-3 self-center"
        style={{ backgroundColor: color, height: 4 }}
      />
    </div>
  )
}
