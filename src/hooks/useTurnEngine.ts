import { useCallback, useRef } from 'react'
import { useDebateStore, buildSystemPrompt } from '../store/debateStore'
import { streamCompletion, OpenRouterError } from '../lib/openRouter'
import { isDemoMode, setServerProxyAvailable } from '../lib/demo'
import { useDemoEngine } from './useDemoEngine'

interface UseTurnEngineReturn {
  runNextTurn: () => Promise<void>
  abortCurrentTurn: () => void
}

export function useTurnEngine(onError: (msg: string) => void): UseTurnEngineReturn {
  const abortRef = useRef<AbortController | null>(null)
  const runDemoTurn = useDemoEngine()

  const {
    config,
    turns,
    phase,
    intensity,
    pendingDirectorInstruction,
    currentSide,
    turnCount,
    addTurn,
    appendToTurn,
    finishTurn,
    removeTurn,
    advanceSide,
    startConcluding,
    endDebate,
    pauseDebate,
  } = useDebateStore()

  const abortCurrentTurn = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const runNextTurn = useCallback(async () => {
    if (!config || (phase !== 'debating' && phase !== 'concluding')) return

    // Check turn cap
    if (phase === 'debating' && turnCount >= config.turnCap * 2) {
      startConcluding()
      return
    }

    const lastOpponentTurn = turns
      .filter((t) => t.status === 'done' && t.side !== currentSide)
      .at(-1)

    const isClosingStatement = phase === 'concluding'

    const directorInstruction = isClosingStatement
      ? 'Give your closing statement. Be memorable. This is your final word.'
      : pendingDirectorInstruction

    if (isDemoMode()) {
      await runDemoTurn(currentSide, turnCount, isClosingStatement, pendingDirectorInstruction)
      advanceSide()

      if (isClosingStatement && currentSide === 'right') {
        endDebate()
      }
      return
    }

    // Real OpenRouter turn
    const debaterIndex = currentSide === 'left' ? 0 : 1
    const debater = config.debaters[debaterIndex]
    const systemPrompt = buildSystemPrompt(
      config,
      currentSide,
      intensity,
      directorInstruction,
      lastOpponentTurn?.text ?? null
    )

    const turnId = addTurn(currentSide, turnCount)
    abortRef.current = new AbortController()

    try {
      for await (const chunk of streamCompletion(
        debater.model.openrouterId,
        systemPrompt,
        abortRef.current.signal
      )) {
        appendToTurn(turnId, chunk)
      }
      finishTurn(turnId)
      advanceSide()

      if (isClosingStatement && currentSide === 'right') {
        endDebate()
      }
    } catch (err) {
      // Drop the empty bubble this failed turn created so it doesn't linger.
      removeTurn(turnId)

      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped / reset the debate — not an error, say nothing.
        return
      }

      if (err instanceof OpenRouterError && err.status === 503) {
        // Server proxy not configured (no key). Silently fall back to demo for
        // the rest of the session; the loop re-fires straight into a demo turn.
        setServerProxyAvailable(false)
        onError('Live models unavailable — playing the demo debate instead.')
        return
      }

      // Any other live-mode failure (bad model, no credits, network, etc.):
      // HALT the loop so we don't hammer the API with empty retries, and tell
      // the director exactly what went wrong and how to recover.
      pauseDebate()
      const detail = err instanceof Error ? err.message : 'Unknown error'
      onError(`⚠️ Debate paused — ${detail}. Try Resume, or hit "← new" to pick a different model.`)
    }
  }, [
    config,
    turns,
    phase,
    intensity,
    pendingDirectorInstruction,
    currentSide,
    turnCount,
    addTurn,
    appendToTurn,
    finishTurn,
    removeTurn,
    advanceSide,
    startConcluding,
    endDebate,
    pauseDebate,
    runDemoTurn,
    onError,
  ])

  return { runNextTurn, abortCurrentTurn }
}
