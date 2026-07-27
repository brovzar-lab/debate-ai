import { Turn } from '../../types'
import { DebateConfig } from '../../types'

interface DebaterBubbleProps {
  turn: Turn
  config: DebateConfig
}

export function DebaterBubble({ turn, config }: DebaterBubbleProps) {
  const isLeft = turn.side === 'left'
  const isVerdict = turn.turnNumber === -1
  const debater = isVerdict ? null : config.debaters[isLeft ? 0 : 1]

  if (isVerdict) {
    return (
      <div className="my-4 flex justify-center">
        <div className="max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-950/40 px-6 py-4 text-amber-100 text-sm leading-relaxed">
          {turn.text}
          {turn.status === 'streaming' && <Cursor />}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex w-full gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      <div
        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl shadow-md"
        style={{ backgroundColor: debater?.model.color + '33', border: `2px solid ${debater?.model.color}` }}
      >
        {debater?.model.emoji}
      </div>

      <div className={`max-w-[72%] ${isLeft ? '' : ''}`}>
        <p
          className={`mb-1 text-xs font-semibold uppercase tracking-wide ${isLeft ? 'text-left' : 'text-right'}`}
          style={{ color: debater?.model.color }}
        >
          {debater?.personaName}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed text-white shadow-md ${
            isLeft
              ? 'rounded-tl-sm bg-zinc-800'
              : 'rounded-tr-sm bg-zinc-700'
          }`}
        >
          {turn.text}
          {turn.status === 'streaming' && <Cursor />}
        </div>
      </div>
    </div>
  )
}

function Cursor() {
  return (
    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-fast bg-white align-middle opacity-90" />
  )
}
