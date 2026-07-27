interface FireMeterProps {
  intensity: number
  onChange: (level: number) => void
  disabled?: boolean
}

const FLAME_EMOJIS = ['🕯️', '🔥', '🔥🔥', '🔥🔥🔥', '💀🔥💀']
const INTENSITY_LABELS = ['Simmering', 'Warm', 'Heated', 'Blazing', 'INFERNO']
const INTENSITY_COLORS = ['#94a3b8', '#f59e0b', '#f97316', '#ef4444', '#dc2626']

export function FireMeter({ intensity, onChange, disabled }: FireMeterProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="text-2xl transition-all duration-300"
        style={{
          filter: `drop-shadow(0 0 ${intensity * 4}px ${INTENSITY_COLORS[intensity - 1]})`,
          animation: intensity >= 3 ? 'flame 0.6s ease-in-out infinite alternate' : undefined,
        }}
      >
        {FLAME_EMOJIS[intensity - 1]}
      </div>
      <span className="text-xs font-bold" style={{ color: INTENSITY_COLORS[intensity - 1] }}>
        {INTENSITY_LABELS[intensity - 1]}
      </span>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            onClick={() => !disabled && onChange(level)}
            disabled={disabled}
            className={`h-5 w-5 rounded-full border-2 transition-all duration-200 ${
              level <= intensity
                ? 'scale-110'
                : 'opacity-30'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-125'}`}
            style={{
              backgroundColor: level <= intensity ? INTENSITY_COLORS[level - 1] : 'transparent',
              borderColor: INTENSITY_COLORS[level - 1],
            }}
            aria-label={`Set intensity to ${level}`}
          />
        ))}
      </div>
    </div>
  )
}
