import { useRef, useEffect } from 'react'
import type { DebateFormatId, BrainstormSubject } from '../../data/debateFormats'
import { getPersonaTemplates, type PersonaTemplate } from '../../data/personaTemplates'
import { PersonaCard } from './PersonaCard'

interface PersonaSectionProps {
  format: DebateFormatId
  subject?: BrainstormSubject
  selectedTemplate: PersonaTemplate | null
  customText: string
  onTemplateSelect: (t: PersonaTemplate | null) => void
  onCustomTextChange: (text: string) => void
}

const MAX_CUSTOM_LENGTH = 300

export function PersonaSection({
  format,
  subject,
  selectedTemplate,
  customText,
  onTemplateSelect,
  onCustomTextChange,
}: PersonaSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const templates = getPersonaTemplates(format, subject)
  const universalOnlyCount = templates.filter((t) => t.format === 'universal').length
  const showFormatHint = universalOnlyCount === templates.length

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`
  }, [customText])

  const handleCardSelect = (t: PersonaTemplate) => {
    onTemplateSelect(t)
    onCustomTextChange('')
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CUSTOM_LENGTH)
    onTemplateSelect(null)
    onCustomTextChange(val)
  }

  const charCount = customText.length
  const showCounter = charCount >= MAX_CUSTOM_LENGTH * 0.8

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-zinc-500">Persona</p>

      {/* Card row */}
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {templates.map((t) => (
          <PersonaCard
            key={t.id}
            template={t}
            selected={selectedTemplate?.id === t.id}
            onSelect={handleCardSelect}
          />
        ))}
      </div>

      {showFormatHint && (
        <p className="text-xs text-zinc-600">
          Choose a format above to see suggested personas
        </p>
      )}

      {/* Custom persona textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={1}
          value={customText}
          onChange={handleCustomChange}
          placeholder="Or describe a custom persona…"
          className="w-full resize-none rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 overflow-hidden"
          style={{ minHeight: '32px' }}
        />
        {showCounter && (
          <span className="absolute bottom-2 right-3 text-xs text-zinc-500">
            {charCount}/{MAX_CUSTOM_LENGTH}
          </span>
        )}
      </div>
    </div>
  )
}
