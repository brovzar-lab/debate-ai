import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebateStore } from '../../store/debateStore'
import { useVoiceStore } from '../../store/voiceStore'
import { useTurnEngine } from '../../hooks/useTurnEngine'
import { useVoiceQueue } from '../../hooks/useVoiceQueue'
import { DebaterBubble } from './DebaterBubble'
import { TurnIndicator } from './TurnIndicator'
import { DirectorControls } from './DirectorControls'
import { ToastManager } from '../shared/Toast'
import { isDemoMode } from '../../lib/demo'
import type { Debater, Side } from '../../types'

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
  const { enabled: voiceEnabled, leftMuted, rightMuted, speakingSide, toggleEnabled, setLeftMuted, setRightMuted } = useVoiceStore()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const transcriptRef = useRef<HTMLDivElement>(null)
  const isRunningRef = useRef(false)

  const pushToast = useCallback((message: string) => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { id, message }])
  }, [])

  const { runNextTurn, abortCurrentTurn } = useTurnEngine(pushToast)

  // Wire up sentence-by-sentence voice playback
  useVoiceQueue()

  const isStreaming = turns.some((t) => t.status === 'streaming')

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

  const handleProvoke = () => {
    if (isDemoMode()) {
      setDirectorInstruction('provoke — you gonna let them talk to you like that?')
    } else {
      setDirectorInstruction(
        "The director just said: 'You gonna let them talk to you like that?' — respond with more passion and fight back harder."
      )
    }
    pushToast('🔥 Provocation injected into next turn!')
  }

  const handleWrapUp = () => {
    pushToast('🏁 Wrapping up — final statements incoming…')
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-white">
      {/* Header / debater identities */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-6 py-3 shadow-md">
        <DebaterHeader
          debater={leftDebater}
          side="left"
          isSpeaking={speakingSide === 'left'}
          isMuted={leftMuted}
          onToggleMute={() => setLeftMuted(!leftMuted)}
        />

        <div className="flex flex-col items-center gap-1 px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">vs</span>
          <div className="flex items-center gap-2">
            {/* Global voice toggle */}
            <button
              onClick={toggleEnabled}
              className="rounded-md bg-zinc-800 px-2 py-1 text-sm transition-colors hover:bg-zinc-700"
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
            <button
              onClick={() => {
                abortCurrentTurn()
                onReset()
              }}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← New debate
            </button>
          </div>
        </div>

        <DebaterHeader
          debater={rightDebater}
          side="right"
          isSpeaking={speakingSide === 'right'}
          isMuted={rightMuted}
          onToggleMute={() => setRightMuted(!rightMuted)}
        />
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {/* Topic banner */}
          <div className="rounded-xl bg-zinc-800/50 py-3 px-5 text-center text-sm italic text-zinc-400">
            "{config.topic}"
          </div>

          {turns.map((turn) => (
            <DebaterBubble key={turn.id} turn={turn} config={config} />
          ))}
        </div>
      </div>

      {/* Turn indicator + director controls */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/90 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
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

interface DebaterHeaderProps {
  debater: Debater
  side: Side
  isSpeaking: boolean
  isMuted: boolean
  onToggleMute: () => void
}

function DebaterHeader({ debater, side, isSpeaking, isMuted, onToggleMute }: DebaterHeaderProps) {
  const isRight = side === 'right'
  return (
    <div className={`flex items-center gap-3 ${isRight ? 'flex-row-reverse text-right' : ''}`}>
      <div className="relative">
        {/* Speaking pulse ring */}
        {isSpeaking && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ backgroundColor: debater.model.color + '44' }}
          />
        )}
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
          style={{ backgroundColor: debater.model.color + '22', border: `2px solid ${debater.model.color}` }}
        >
          {debater.model.emoji}
        </div>
      </div>
      <div>
        <p className="font-bold text-sm flex items-center gap-1.5" style={{ color: debater.model.color }}>
          {debater.personaName}
          {/* Per-debater mute */}
          <button
            onClick={onToggleMute}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs leading-none"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔉'}
          </button>
        </p>
        <p className="text-xs text-zinc-500 max-w-[160px] leading-tight truncate" title={debater.stance}>
          {debater.stance}
        </p>
      </div>
    </div>
  )
}
