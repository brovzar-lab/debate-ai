import { useEffect, useRef, useCallback } from 'react'
import { useDebateStore } from '../store/debateStore'
import { useVoiceStore } from '../store/voiceStore'
import { synthesizeSentence, extractNewSentences, DEFAULT_VOICE_IDS } from '../lib/tts'
import type { Side } from '../types'

interface QueueItem {
  text: string
  side: Side
  voiceId: string
  intensity: number
}

/**
 * Watches the turn stream and plays each debater's speech sentence-by-sentence,
 * starting as soon as a sentence completes during streaming (not waiting for the
 * full turn to finish). Debaters never overlap — the queue is strictly sequential.
 *
 * Voice IDs come from debater.voiceId in the debate config (with sensible defaults).
 * Respects voiceStore enabled/muted state. Resets automatically when the debate resets.
 */
export function useVoiceQueue(): void {
  const turns = useDebateStore((s) => s.turns)
  const intensity = useDebateStore((s) => s.intensity)
  const phase = useDebateStore((s) => s.phase)
  const config = useDebateStore((s) => s.config)
  const { enabled, leftMuted, rightMuted, setSpeakingSide } = useVoiceStore()

  // Per-turn processed character cursor  { turnId → nextIndex }
  const processedRef = useRef<Map<string, number>>(new Map())
  // Audio queue
  const queueRef = useRef<QueueItem[]>([])
  // Guards against concurrent playback
  const playingRef = useRef(false)
  // Incremented on reset to invalidate in-flight synthesize calls
  const generationRef = useRef(0)
  // Current audio element so we can pause on abort
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Object URLs to revoke on cleanup
  const objectUrlsRef = useRef<string[]>([])

  const playNext = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return

    const item = queueRef.current.shift()!
    const gen = generationRef.current
    playingRef.current = true
    setSpeakingSide(item.side)

    try {
      const audioUrl = await synthesizeSentence(item.text, item.voiceId, item.intensity)

      // Generation changed while we were fetching — discard and stop
      if (generationRef.current !== gen) {
        URL.revokeObjectURL(audioUrl)
        playingRef.current = false
        setSpeakingSide(null)
        return
      }

      objectUrlsRef.current.push(audioUrl)

      await new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
    } catch {
      // TTS unavailable (no key, network error) — skip sentence silently
    }

    playingRef.current = false
    setSpeakingSide(null)

    // Chain next item
    if (queueRef.current.length > 0) {
      void playNext()
    }
  }, [setSpeakingSide])

  // Watch turns for newly complete sentences to enqueue
  useEffect(() => {
    if (!config) return

    const leftVoiceId = config.debaters[0].voiceId ?? DEFAULT_VOICE_IDS.left
    const rightVoiceId = config.debaters[1].voiceId ?? DEFAULT_VOICE_IDS.right

    for (const turn of turns) {
      const processed = processedRef.current.get(turn.id) ?? 0

      // Nothing new to process
      if (processed >= turn.text.length && turn.status === 'done') continue

      const { sentences, nextIndex } = extractNewSentences(turn.text, processed)

      let allSentences = sentences
      let newProcessed = nextIndex

      if (turn.status === 'done') {
        // Flush any trailing text that lacks terminal punctuation
        const remaining = turn.text.slice(nextIndex).trim()
        if (remaining) allSentences = [...sentences, remaining]
        newProcessed = turn.text.length
      }

      // Always advance the cursor — even when muted/disabled — so re-enabling
      // starts from the current position and doesn't replay past text
      processedRef.current.set(turn.id, newProcessed)

      if (!enabled) continue

      const isMuted = turn.side === 'left' ? leftMuted : rightMuted
      if (isMuted) continue

      const voiceId = turn.side === 'left' ? leftVoiceId : rightVoiceId

      for (const sentence of allSentences) {
        queueRef.current.push({ text: sentence, side: turn.side, voiceId, intensity })
      }
    }

    if (enabled) void playNext()
  }, [turns, enabled, leftMuted, rightMuted, intensity, config, playNext])

  // Stop audio and clear queue when voice is toggled off
  useEffect(() => {
    if (!enabled) {
      generationRef.current++
      audioRef.current?.pause()
      audioRef.current = null
      queueRef.current = []
      playingRef.current = false
      setSpeakingSide(null)
    }
  }, [enabled, setSpeakingSide])

  // Full reset when debate resets to setup
  useEffect(() => {
    if (phase === 'setup') {
      generationRef.current++
      audioRef.current?.pause()
      audioRef.current = null
      queueRef.current = []
      processedRef.current.clear()
      playingRef.current = false
      setSpeakingSide(null)
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [phase, setSpeakingSide])
}
