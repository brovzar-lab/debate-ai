import { useCallback, useRef } from 'react'
import { Side } from '../types'
import { useDebateStore } from '../store/debateStore'
import {
  DEMO_SCRIPT,
  DEMO_BRAINSTORM_SCRIPT,
  DEMO_BRAINSTORM_MID_STEER,
  DEMO_BRAINSTORM_BEST_IDEA,
  DEMO_PROVOKE_RESPONSES,
  DEMO_CLOSING,
  DEMO_VERDICT,
  DEMO_SYNTHESIS,
} from '../data/demoScript'
import { DEBATE_FORMATS, DEFAULT_FORMAT_ID } from '../data/debateFormats'

const BASE_CHAR_DELAY = 18
const JITTER = 12

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function useDemoEngine() {
  const turnIndexRef = useRef(0)
  const { addTurn, appendToTurn, finishTurn, config, endDebate } = useDebateStore()

  const isBrainstorm = config?.format === 'brainstorm'

  const streamText = useCallback(
    async (turnId: string, text: string, charDelay = BASE_CHAR_DELAY) => {
      for (const char of text) {
        appendToTurn(turnId, char)
        const delay = charDelay + (Math.random() * JITTER - JITTER / 2)
        await sleep(Math.max(5, delay))
      }
    },
    [appendToTurn]
  )

  const runDemoTurn = useCallback(
    async (
      side: Side,
      turnNumber: number,
      isClosing: boolean,
      directorInstruction: string | null
    ) => {
      let text: string

      if (isClosing) {
        text = DEMO_CLOSING[side]
      } else if (directorInstruction?.toLowerCase().includes('provoke')) {
        text = DEMO_PROVOKE_RESPONSES[side]
        turnIndexRef.current = Math.max(0, turnIndexRef.current - 1)
      } else if (isBrainstorm) {
        const scriptTurn = DEMO_BRAINSTORM_SCRIPT[turnIndexRef.current % DEMO_BRAINSTORM_SCRIPT.length]
        text = scriptTurn.text
        turnIndexRef.current++
      } else {
        const scriptTurn = DEMO_SCRIPT[turnIndexRef.current % DEMO_SCRIPT.length]
        text = scriptTurn.text
        turnIndexRef.current++
      }

      const turnId = addTurn(side, turnNumber)
      await streamText(turnId, text)
      finishTurn(turnId)

      // Add format-appropriate ending after both closing statements (non-brainstorm only)
      if (isClosing && side === 'right') {
        const format = DEBATE_FORMATS[config?.format ?? DEFAULT_FORMAT_ID]
        await sleep(600)

        if (format.ending === 'verdict') {
          const verdictId = addTurn('left', -1)
          const prefix = '⚖️ VERDICT: '
          await streamText(verdictId, prefix + DEMO_VERDICT, 10)
          finishTurn(verdictId)
        } else if (format.ending === 'synthesis') {
          const synthId = addTurn('left', -1)
          const prefix = '☯️ SYNTHESIS: '
          await streamText(synthId, prefix + DEMO_SYNTHESIS, 10)
          finishTurn(synthId)
        }
        // 'open' endings: no system summary, just end

        endDebate()
      }
    },
    [addTurn, streamText, finishTurn, config, endDebate, isBrainstorm]
  )

  // Fires the Lead mid-point steer or final Best-Idea synthesis for brainstorm.
  const runDemoLeadTurn = useCallback(
    async (kind: 'steer' | 'best-idea') => {
      const text = kind === 'steer' ? DEMO_BRAINSTORM_MID_STEER : DEMO_BRAINSTORM_BEST_IDEA
      // turnNumber -1 for best-idea (rendered as the final synthesis card), else a high index
      const turnId = addTurn('left', kind === 'best-idea' ? -1 : 999, 'lead')
      await sleep(400)
      await streamText(turnId, text, 10)
      finishTurn(turnId)
    },
    [addTurn, streamText, finishTurn]
  )

  return { runDemoTurn, runDemoLeadTurn }
}
