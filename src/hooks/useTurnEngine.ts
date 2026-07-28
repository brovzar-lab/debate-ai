import { useCallback, useRef } from 'react'
import {
  useDebateStore,
  buildSystemPrompt,
  buildClosingInstruction,
  buildLeadSteerPrompt,
  buildLeadSynthesisPrompt,
} from '../store/debateStore'
import { streamCompletion, OpenRouterError } from '../lib/openRouter'
import { isDemoMode, setServerProxyAvailable } from '../lib/demo'
import { useDemoEngine } from './useDemoEngine'
import { DEBATE_FORMATS, DEFAULT_FORMAT_ID } from '../data/debateFormats'

interface UseTurnEngineReturn {
  runNextTurn: () => Promise<void>
  abortCurrentTurn: () => void
}

export function useTurnEngine(onError: (msg: string) => void): UseTurnEngineReturn {
  const abortRef = useRef<AbortController | null>(null)
  const { runDemoTurn, runDemoLeadTurn } = useDemoEngine()

  const {
    config,
    turns,
    phase,
    intensity,
    pendingDirectorInstruction,
    currentSide,
    turnCount,
    leadSteerFired,
    leadSynthesisFired,
    addTurn,
    appendToTurn,
    finishTurn,
    removeTurn,
    advanceSide,
    startConcluding,
    endDebate,
    pauseDebate,
    markLeadSteerFired,
    markLeadSynthesisFired,
  } = useDebateStore()

  const abortCurrentTurn = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const runNextTurn = useCallback(async () => {
    if (!config || (phase !== 'debating' && phase !== 'concluding')) return

    const format = DEBATE_FORMATS[config.format ?? DEFAULT_FORMAT_ID]

    // ── Brainstorm concluding: lead synthesis instead of debater closing statements ──
    if (format.id === 'brainstorm' && phase === 'concluding') {
      if (leadSynthesisFired) {
        endDebate()
        return
      }

      if (isDemoMode()) {
        await runDemoLeadTurn('best-idea')
        markLeadSynthesisFired()
        endDebate()
        return
      }

      const synthesisPrompt = buildLeadSynthesisPrompt(config, turns)
      const turnId = addTurn('left', -1, 'lead')
      abortRef.current = new AbortController()

      try {
        for await (const chunk of streamCompletion(
          config.debaters[0].model.openrouterId,
          synthesisPrompt,
          abortRef.current.signal
        )) {
          appendToTurn(turnId, chunk)
        }
        finishTurn(turnId)
        markLeadSynthesisFired()
        endDebate()
      } catch (err) {
        removeTurn(turnId)
        if (err instanceof Error && err.name === 'AbortError') return
        if (err instanceof OpenRouterError && err.status === 503) {
          setServerProxyAvailable(false)
          onError('Live models unavailable — playing the demo debate instead.')
          return
        }
        pauseDebate()
        const detail = err instanceof Error ? err.message : 'Unknown error'
        onError(`⚠️ Debate paused — ${detail}. Try Resume, or hit "← new" to pick a different model.`)
      }
      return
    }

    // Check turn cap
    if (phase === 'debating' && turnCount >= config.turnCap * 2) {
      startConcluding()
      return
    }

    // ── Brainstorm mid-point steer ──
    if (format.id === 'brainstorm' && !leadSteerFired && turnCount >= config.turnCap) {
      if (isDemoMode()) {
        await runDemoLeadTurn('steer')
        markLeadSteerFired()
        return
      }

      const steerPrompt = buildLeadSteerPrompt(config, turns)
      const steerTurnId = addTurn('left', turnCount, 'lead')
      abortRef.current = new AbortController()

      try {
        for await (const chunk of streamCompletion(
          config.debaters[0].model.openrouterId,
          steerPrompt,
          abortRef.current.signal
        )) {
          appendToTurn(steerTurnId, chunk)
        }
        finishTurn(steerTurnId)
        markLeadSteerFired()
      } catch (err) {
        removeTurn(steerTurnId)
        if (err instanceof Error && err.name === 'AbortError') return
        if (err instanceof OpenRouterError && err.status === 503) {
          setServerProxyAvailable(false)
          onError('Live models unavailable — playing the demo debate instead.')
          return
        }
        pauseDebate()
        const detail = err instanceof Error ? err.message : 'Unknown error'
        onError(`⚠️ Debate paused — ${detail}. Try Resume, or hit "← new" to pick a different model.`)
      }
      return
    }

    const lastOpponentTurn = turns
      .filter((t) => t.status === 'done' && t.side !== currentSide && t.role !== 'lead')
      .at(-1)

    const isClosingStatement = phase === 'concluding'

    const directorInstruction = isClosingStatement
      ? buildClosingInstruction(format)
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
      lastOpponentTurn?.text ?? null,
      turnCount
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
      removeTurn(turnId)

      if (err instanceof Error && err.name === 'AbortError') return

      if (err instanceof OpenRouterError && err.status === 503) {
        setServerProxyAvailable(false)
        onError('Live models unavailable — playing the demo debate instead.')
        return
      }

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
    leadSteerFired,
    leadSynthesisFired,
    addTurn,
    appendToTurn,
    finishTurn,
    removeTurn,
    advanceSide,
    startConcluding,
    endDebate,
    pauseDebate,
    markLeadSteerFired,
    markLeadSynthesisFired,
    runDemoTurn,
    runDemoLeadTurn,
    onError,
  ])

  return { runNextTurn, abortCurrentTurn }
}
