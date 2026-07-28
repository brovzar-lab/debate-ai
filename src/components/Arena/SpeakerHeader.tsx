import { Debater, DebatePhase } from '../../types'

interface SpeakerHeaderProps {
  debater: Debater
  side: 'left' | 'right'
  isActive: boolean
  isStreaming: boolean
  phase: DebatePhase
  isMuted?: boolean
  onToggleMute?: () => void
}

export function SpeakerHeader({ debater, side, isActive, isStreaming, phase, isMuted, onToggleMute }: SpeakerHeaderProps) {
  const isRight = side === 'right'
  const isDone = phase === 'done'
  const color = debater.model.color

  return (
    <div className={`flex flex-1 items-center gap-3 min-w-0 ${isRight ? 'flex-row-reverse' : ''}`}>
      <div className="relative shrink-0">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all duration-300"
          style={{
            backgroundColor: color + '22',
            border: `2px solid ${isActive ? color : color + '44'}`,
            boxShadow: isActive && isStreaming ? `0 0 20px ${color}66, 0 0 6px ${color}44` : isActive ? `0 0 10px ${color}44` : 'none',
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
            opacity: isActive || isDone ? 1 : 0.45,
          }}
        >
          {debater.model.emoji}
        </div>

        {/* Pulsing ring when actively streaming */}
        {isStreaming && isActive && !isDone && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: color }}
          />
        )}

        {/* "SPEAKING" badge */}
        {isActive && isStreaming && !isDone && (
          <span
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-px text-[9px] font-black uppercase tracking-wider leading-tight"
            style={{ backgroundColor: color, color: '#000' }}
          >
            speaking
          </span>
        )}
      </div>

      <div className={`min-w-0 ${isRight ? 'text-right' : ''}`}>
        <p
          className={`truncate font-bold text-sm leading-tight transition-opacity flex items-center gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}
          style={{ color, opacity: isActive || isDone ? 1 : 0.4 }}
        >
          {debater.personaName}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs leading-none"
              title={isMuted ? 'Unmute this debater' : 'Mute this debater'}
            >
              {isMuted ? '🔇' : '🔉'}
            </button>
          )}
        </p>
        {debater.persona && (
          <p
            className={`text-xs italic leading-tight truncate max-w-[150px] transition-opacity ${isActive || isDone ? 'text-zinc-400' : 'text-zinc-600'}`}
            title={debater.persona.name}
          >
            {debater.persona.name.length > 24
              ? debater.persona.name.slice(0, 24) + '…'
              : debater.persona.name}
          </p>
        )}
        <p
          className={`text-xs leading-tight truncate max-w-[150px] transition-opacity ${isActive ? 'text-zinc-400' : 'text-zinc-600'}`}
        >
          {debater.stance}
        </p>
      </div>
    </div>
  )
}
