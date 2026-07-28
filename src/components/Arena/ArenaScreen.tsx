import { useEffect, useRef, useState, useCallback } from 'react'
import { useDebateStore } from '../../store/debateStore'
import { useVoiceStore } from '../../store/voiceStore'
import { useTurnEngine } from '../../hooks/useTurnEngine'
import { useVoiceQueue } from '../../hooks/useVoiceQueue'
import { DebaterBubble } from './DebaterBubble'
import { SpeakerHeader } from './SpeakerHeader'
import { TurnIndicator } from './TurnIndicator'
import { DirectorControls } from './DirectorControls'
import { ExportControls } from './ExportControls'
import { ToastManager } from '../shared/Toast'
import { isDemoMode } from '../../lib/demo'
import { replayTurnAudio, clearTurnAudioCache, DEFAULT_VOICE_IDS } from '../../lib/tts'
import type { Turn } from '../../types'

interface ArenaScreenProps {
  onReset: () => void
}

interface ToastItem {
  id: string
  message: string
}

let toastCounter = 0

export function ArenaScreen({ onReset }: ArenaScreenProps) {
  const { config, turns, phase, currentSide, turnCount, intensity, setDirectorInstruction } = useDebateStore()
  const { enabled: voiceEnabled, leftMuted, rightMuted, toggleEnabled, setLeftMuted, setRightMuted } =
    useVoiceStore()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [scrollLocked, setScrollLocked] = useState(true)

  const pushToast = useCallback((message: string) => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { id, message }])
  }, [])

  const { runNextTurn, abortCurrentTurn } = useTurnEngine(pushToast)

  // Wire up sentence-by-sentence voice playback
  useVoiceQueue()

  const isStreaming = turns.some((t) => t.status === 'streaming')
  const newestTurnId = turns.at(-1)?.id

  // Auto-scroll transcript — only when scroll is locked (user hasn't scrolled up)
  useEffect(() => {
    if (!scrollLocked || !transcriptRef.current) return
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [turns, scrollLocked])

  // Detect when the user scrolls up (pauses auto-scroll) or back to bottom (re-engages)
  const handleScroll = useCallback(() => {
    const el = transcriptRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setScrollLocked(atBottom)
  }, [])

  // Re-engage scroll lock and jump to bottom
  const jumpToLatest = useCallback(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
    setScrollLocked(true)
  }, [])

  // Re-lock scroll on new debate start
  useEffect(() => {
    if (phase === 'setup') {
      setScrollLocked(true)
      clearTurnAudioCache()
    }
  }, [phase])

  // Replay a completed turn's audio using its speaker's voice
  const handleReplay = useCallback(async (turn: Turn) => {
    if (isDemoMode()) {
      pushToast('Demo mode — voice replay not available')
      return
    }
    const voiceId = turn.side === 'left'
      ? (config!.debaters[0].voiceId ?? DEFAULT_VOICE_IDS.left)
      : (config!.debaters[1].voiceId ?? DEFAULT_VOICE_IDS.right)
    try {
      await replayTurnAudio(turn.id, turn.text, voiceId, intensity)
    } catch {
      pushToast('Could not replay voice')
    }
  }, [config, intensity, pushToast])

  // Turn loop driver (isStreaming guard is sufficient — see APPU-1421)
  useEffect(() => {
    if (phase !== 'debating' && phase !== 'concluding') return
    if (isStreaming) return

    runNextTurn()
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
    <div className="relative flex h-screen flex-col bg-zinc-950 text-white">
      {/* Fighter header — arena staging */}
      <div className="flex shrink-0 items-center border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 shadow-lg">
        <SpeakerHeader
          debater={leftDebater}
          side="left"
          isActive={leftIsActive && !isDone}
          isStreaming={isStreaming && leftIsActive}
          phase={phase}
          isMuted={leftMuted}
          onToggleMute={() => setLeftMuted(!leftMuted)}
        />

        <div className="flex shrink-0 flex-col items-center gap-1 px-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">vs</span>
          <div className="flex items-center gap-2">
            {/* Global voice toggle */}
            <button
              onClick={toggleEnabled}
              className="rounded-md bg-zinc-800 px-2 py-0.5 text-sm transition-colors hover:bg-zinc-700"
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
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
        </div>

        <SpeakerHeader
          debater={rightDebater}
          side="right"
          isActive={!leftIsActive && !isDone}
          isStreaming={isStreaming && !leftIsActive}
          phase={phase}
          isMuted={rightMuted}
          onToggleMute={() => setRightMuted(!rightMuted)}
        />
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
        style={{ scrollBehavior: 'smooth' }}
        onScroll={handleScroll}
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
              onReplayClick={
                turn.role !== 'lead' && turn.turnNumber !== -1
                  ? () => handleReplay(turn)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Jump to latest button — shown when user has scrolled up */}
      {!scrollLocked && turns.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <button
            onClick={jumpToLatest}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-zinc-700/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-600"
          >
            ↓ Jump to latest
          </button>
        </div>
      )}

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
          <ExportControls onToast={pushToast} />
        </div>
      </div>

      <ToastManager toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  )
}
