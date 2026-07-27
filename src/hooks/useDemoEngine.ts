import { useCallback, useRef } from 'react'
import { Side } from '../types'
import { useDebateStore } from '../store/debateStore'
import {
  DEMO_SCRIPT,
  DEMO_PROVOKE_RESPONSES,
  DEMO_CLOSING,
  DEMO_VERDICT,
} from '../data/demoScript'

const BASE_CHAR_DELAY = 18
const JITTER = 12

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function useDemoEngine() {
  const turnIndexRef = useRef(0)
  const { addTurn, appendToTurn, finishTurn, config, endDebate } = useDebateStore()

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
        if (side === 'right') {
          // after both closing statements, add verdict
        }
      } else if (directorInstruction?.toLowerCase().includes('provoke')) {
        text = DEMO_PROVOKE_RESPONSES[side]
        turnIndexRef.current = Math.max(0, turnIndexRef.current - 1)
      } else {
        const scriptTurn = DEMO_SCRIPT[turnIndexRef.current % DEMO_SCRIPT.length]
        text = scriptTurn.text
        turnIndexRef.current++
      }

      const turnId = addTurn(side, turnNumber)

      // Stream character by character with human-like timing
      for (const char of text) {
        appendToTurn(turnId, char)
        const delay = BASE_CHAR_DELAY + (Math.random() * JITTER - JITTER / 2)
        await sleep(Math.max(5, delay))
      }

      finishTurn(turnId)

      // Add verdict after both closing statements
      if (isClosing && side === 'right') {
        await sleep(600)
        const verdictId = addTurn('left', -1)
        const verdictPrefix = '⚖️ VERDICT: '
        for (const char of verdictPrefix + DEMO_VERDICT) {
          appendToTurn(verdictId, char)
          await sleep(10)
        }
        finishTurn(verdictId)
        endDebate()
      }
    },
    [addTurn, appendToTurn, finishTurn, config, endDebate]
  )

  return runDemoTurn
}
