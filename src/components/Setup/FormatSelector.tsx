import { DEBATE_FORMATS, DebateFormatId } from '../../data/debateFormats'

interface FormatSelectorProps {
  value: DebateFormatId
  onChange: (id: DebateFormatId) => void
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const formats = Object.values(DEBATE_FORMATS)
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
        Debate Format
      </label>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {formats.map((fmt) => {
          const selected = value === fmt.id
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => onChange(fmt.id)}
              className={`flex flex-col gap-1 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                selected
                  ? 'border-red-500 bg-red-950/40'
                  : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-500'
              }`}
            >
              <span className="text-base leading-none">{fmt.emoji}</span>
              <span className={`text-xs font-bold leading-tight ${selected ? 'text-red-400' : 'text-zinc-200'}`}>
                {fmt.label}
              </span>
              <span className="text-[11px] leading-snug text-zinc-500">{fmt.blurb}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
