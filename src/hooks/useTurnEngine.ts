import { useCallback, useRef } from 'react'
import { Side } from '../types'
import { useDebateStore, buildSystemPrompt } from '../store/debateStore'
import { streamCompletion, OpenRouterError } from '../lib/openRouter'
import { isDemoMode } from '../lib/demo'
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
    advanceSide,
    startConcluding,
    endDebate,
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
      finishTurn(turnId)
      if (err instanceof OpenRouterError) {
        onError(`API error: ${err.message}. Switching to demo mode — remove your key to reload demo.`)
      } else if (err instanceof Error && err.name !== 'AbortError') {
        onError(`Turn failed: ${err.message}`)
      }
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
    advanceSide,
    startConcluding,
    endDebate,
    runDemoTurn,
    onError,
  ])

  return { runNextTurn, abortCurrentTurn }
}
