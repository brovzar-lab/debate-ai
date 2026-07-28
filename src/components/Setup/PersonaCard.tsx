import type { PersonaTemplate } from '../../data/personaTemplates'

interface PersonaCardProps {
  template: PersonaTemplate
  selected: boolean
  disabled?: boolean
  onSelect: (t: PersonaTemplate) => void
}

export function PersonaCard({ template, selected, disabled = false, onSelect }: PersonaCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(template)}
      aria-pressed={selected}
      className={[
        'relative flex shrink-0 flex-col justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-150',
        'w-36 h-[72px] md:w-[152px] md:h-20',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : selected
          ? 'border-2 border-indigo-500 bg-indigo-950/30'
          : 'border border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:shadow-sm cursor-pointer',
      ].join(' ')}
    >
      <p className="text-sm font-semibold leading-tight text-zinc-50 line-clamp-1">
        {template.name}
      </p>
      <p className="text-xs leading-snug text-zinc-400 line-clamp-2 mt-0.5">
        &ldquo;{template.vibe}&rdquo;
      </p>

      {selected && (
        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-white">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1,6 4.5,9.5 11,2.5" />
          </svg>
        </span>
      )}
    </button>
  )
}
