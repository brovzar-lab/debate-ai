import { useState } from 'react'
import { Model, Side } from '../../types'
import { MODELS } from '../../data/models'

interface DebaterPodiumProps {
  side: Side
  model: Model | null
  personaName: string
  stance: string
  onModelDrop: (model: Model) => void
  onPersonaChange: (name: string) => void
  onStanceChange: (stance: string) => void
}

export function DebaterPodium({
  side,
  model,
  personaName,
  stance,
  onModelDrop,
  onPersonaChange,
  onStanceChange,
}: DebaterPodiumProps) {
  const [dragOver, setDragOver] = useState(false)
  const isLeft = side === 'left'

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const modelId = e.dataTransfer.getData('modelId')
    const found = MODELS.find((m) => m.id === modelId)
    if (found) onModelDrop(found)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col gap-3 rounded-2xl border-2 p-5 transition-all duration-200 ${
        dragOver
          ? 'border-dashed border-white/60 bg-zinc-700/60 scale-105'
          : model
          ? 'border-zinc-700 bg-zinc-800/50'
          : 'border-dashed border-zinc-700 bg-zinc-900/40 hover:border-zinc-600'
      }`}
      style={model ? { borderColor: model.color + '55' } : undefined}
    >
      <div className={`flex items-center gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl transition-all"
          style={
            model
              ? { backgroundColor: model.color + '22', border: `2px solid ${model.color}` }
              : { backgroundColor: '#27272a', border: '2px dashed #52525b' }
          }
        >
          {model ? model.emoji : '?'}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            {isLeft ? 'Left Debater' : 'Right Debater'}
          </p>
          {model ? (
            <p className="font-bold text-sm" style={{ color: model.color }}>
              {model.name}
            </p>
          ) : (
            <p className="text-sm text-zinc-600">Drop a model here</p>
          )}
        </div>
      </div>

      {model && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={personaName}
            onChange={(e) => onPersonaChange(e.target.value)}
            placeholder="Persona name (e.g. ARIA-X)"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <input
            type="text"
            value={stance}
            onChange={(e) => onStanceChange(e.target.value)}
            placeholder="Their stance on the topic…"
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      )}
    </div>
  )
}
