import { Model } from '../../types'

interface ModelCardProps {
  model: Model
  isDragging?: boolean
  isAssigned?: boolean
}

export function ModelCard({ model, isDragging, isAssigned }: ModelCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('modelId', model.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex cursor-grab items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40 scale-95' : 'hover:scale-105'
      } ${isAssigned ? 'border-zinc-600 bg-zinc-800/50 opacity-60' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
      style={{ borderColor: isAssigned ? undefined : model.color + '44' }}
    >
      <span className="text-base">{model.emoji}</span>
      <div>
        <p className="text-white text-xs font-bold">{model.name}</p>
        <p className="text-zinc-500 text-xs">{model.provider}</p>
      </div>
    </div>
  )
}
