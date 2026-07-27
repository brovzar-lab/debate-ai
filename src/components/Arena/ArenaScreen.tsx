import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebateStore } from '../../store/debateStore'
import { useTurnEngine } from '../../hooks/useTurnEngine'
import { DebaterBubble } from './DebaterBubble'
import { SpeakerHeader } from './SpeakerHeader'
import { TurnIndicator } from './TurnIndicator'
import { DirectorControls } from './DirectorControls'
import { ToastManager } from '../shared/Toast'
import { isDemoMode } from '../../lib/demo'

interface ArenaScreenProps {
  onReset: () => void
}

interface ToastItem {
  id: string
  message: string
}

let toastCounter = 0

export function ArenaScreen({ onReset }: ArenaScreenProps) {
  const { config, turns, phase, currentSide, turnCount, setDirectorInstruction } = useDebateStore()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const transcriptRef = useRef<HTMLDivElement>(null)

  const pushToast = useCallback((message: string) => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { id, message }])
  }, [])

  const { runNextTurn, abortCurrentTurn } = useTurnEngine(pushToast)

  const isStreaming = turns.some((t) => t.status === 'streaming')
  const newestTurnId = turns.at(-1)?.id

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [turns])

  // Turn loop driver
  useEffect(() => {
    if (phase !== 'debating' && phase !== 'concluding') return
    if (isStreaming || isRunningRef.current) return

    isRunningRef.current = true
    runNextTurn().finally(() => {
      isRunningRef.current = false
    })
  }, [phase, isStreaming, runNextTurn])

  if (!config) return null

  const leftDebater = config.debaters[0]
  const rightDebater = config.debaters[1]
  const leftIsActive = currentSide === 'left'
  const isDone = phase === 'done'

  const handleProvoke = () => {
    if (isDemoMode()) {
      setDirectorInstruction('provoke — you gonna let them talk to you like that?')
    } else {
      setDirectorInstruction(
        "The director just said: 'You gonna let them talk to you like that?' — respond with more passion and fight back harder."
      )
    }
  }

  const handleWrapUp = () => {
    pushToast('🏁 Wrapping up — final statements incoming…')
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Fighter header — arena staging */}
      <div className="flex shrink-0 items-center border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 shadow-lg">
        <SpeakerHeader
          debater={leftDebater}
          side="left"
          isActive={leftIsActive && !isDone}
          isStreaming={isStreaming && leftIsActive}
          phase={phase}
        />

        <div className="flex shrink-0 flex-col items-center gap-0.5 px-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">vs</span>
          <button
            onClick={() => {
              abortCurrentTurn()
              onReset()
            }}
            className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors whitespace-nowrap"
          >
            ← new
          </button>
        </div>

        <SpeakerHeader
          debater={rightDebater}
          side="right"
          isActive={!leftIsActive && !isDone}
          isStreaming={isStreaming && !leftIsActive}
          phase={phase}
        />
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {/* Topic banner */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 px-5 text-center text-sm italic text-zinc-500">
            "{config.topic}"
          </div>

          {turns.map((turn) => (
            <DebaterBubble
              key={turn.id}
              turn={turn}
              config={config}
              isNewest={turn.id === newestTurnId}
            />
          ))}
        </div>
      </div>

      {/* Turn indicator + director controls */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/90 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
          <TurnIndicator
            currentSide={currentSide}
            config={config}
            phase={phase}
            isStreaming={isStreaming}
            turnCount={turnCount}
            turnCap={config.turnCap}
          />
          <DirectorControls
            onProvoke={handleProvoke}
            onWrapUp={handleWrapUp}
            isStreaming={isStreaming}
          />
        </div>
      </div>

      <ToastManager toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  )
}
