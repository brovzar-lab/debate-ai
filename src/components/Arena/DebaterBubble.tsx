import { Turn, DebateConfig } from '../../types'

interface DebaterBubbleProps {
  turn: Turn
  config: DebateConfig
  isNewest?: boolean
  onReplayClick?: () => void
}

export function DebaterBubble({ turn, config, isNewest, onReplayClick }: DebaterBubbleProps) {
  const isLeft = turn.side === 'left'
  const isVerdict = turn.turnNumber === -1 && turn.role !== 'lead'
  const isLead = turn.role === 'lead'
  const debater = (isVerdict || isLead) ? null : config.debaters[isLeft ? 0 : 1]
  const color = debater?.model.color ?? '#d97706'
  const isStreaming = turn.status === 'streaming'

  if (isLead) {
    const isBestIdea = turn.turnNumber === -1
    return (
      <div className="my-4 flex justify-center">
        <div
          className="w-full max-w-2xl rounded-2xl border px-6 py-5 text-sm leading-relaxed"
          style={{
            borderColor: '#f59e0b88',
            backgroundColor: '#1c1a1699',
            boxShadow: '0 0 48px #f59e0b18',
          }}
        >
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-400">
            {isBestIdea ? '💡 Best Idea' : '💡 Lead'}
          </p>
          <p className="whitespace-pre-line text-amber-50">{turn.text}</p>
          {isStreaming && <Cursor color="#f59e0b" />}
        </div>
      </div>
    )
  }

  if (isVerdict) {
    return (
      <div className="my-6 flex justify-center">
        <div
          className="w-full max-w-2xl rounded-2xl border px-6 py-5 text-sm leading-relaxed"
          style={{
            borderColor: '#d97706aa',
            backgroundColor: '#431407cc',
            boxShadow: '0 0 40px #d9780622',
          }}
        >
          <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-500">
            ⚖️ Verdict
          </p>
          <p className="text-amber-100">{turn.text}</p>
          {isStreaming && <Cursor color="#d97706" />}
        </div>
      </div>
    )
  }

  const canReplay = !isStreaming && !!onReplayClick

  return (
    <div className={`flex w-full gap-3 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg shadow-md transition-all duration-200"
        style={{
          backgroundColor: color + '22',
          border: `2px solid ${isStreaming && isNewest ? color : color + '55'}`,
          boxShadow: isStreaming && isNewest ? `0 0 12px ${color}44` : 'none',
        }}
      >
        {debater?.model.emoji}
      </div>

      {/* Bubble content */}
      <div className={`max-w-[72%] flex flex-col gap-1 ${isLeft ? 'items-start' : 'items-end'}`}>
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          {debater?.personaName}
        </p>
        <div
          className={`group relative rounded-2xl px-4 py-3 text-sm leading-relaxed text-zinc-100 shadow-md${canReplay ? ' cursor-pointer' : ''}`}
          onClick={canReplay ? onReplayClick : undefined}
          title={canReplay ? 'Click to replay voice' : undefined}
          style={{
            background: isLeft
              ? `linear-gradient(135deg, #27272a 0%, #1c1c1f 100%)`
              : `linear-gradient(225deg, #303034 0%, #1c1c1f 100%)`,
            borderRadius: isLeft
              ? '4px 16px 16px 16px'
              : '16px 4px 16px 16px',
            borderLeft: isLeft ? `3px solid ${color}44` : undefined,
            borderRight: !isLeft ? `3px solid ${color}44` : undefined,
            boxShadow: isStreaming && isNewest ? `0 2px 16px ${color}22` : undefined,
          }}
        >
          {turn.text}
          {isStreaming && <Cursor color={color} />}
          {canReplay && (
            <span className="pointer-events-none absolute top-2 right-2 text-xs opacity-0 transition-opacity group-hover:opacity-60">
              🔊
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Cursor({ color }: { color: string }) {
  return (
    <span
      className="ml-0.5 inline-block w-0.5 align-middle animate-pulse-fast"
      style={{ height: '1em', backgroundColor: color, opacity: 0.9 }}
    />
  )
}
