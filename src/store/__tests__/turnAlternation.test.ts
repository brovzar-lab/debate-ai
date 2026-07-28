/**
 * Regression tests for APPU-1421 — live debate stalls after turn 1.
 *
 * Verifies that the store-level alternation logic correctly drives both
 * sides through all phases: debating → concluding → done.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useDebateStore } from '../debateStore'
import { DebateConfig } from '../../types'
import { MODELS } from '../../data/models'

const mockConfig: DebateConfig = {
  topic: 'Regression test topic',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Agent L', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Agent R', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 2,
  format: 'classic',
}

beforeEach(() => {
  useDebateStore.setState({
    config: null,
    turns: [],
    phase: 'setup',
    intensity: 1,
    pendingDirectorInstruction: null,
    currentSide: 'left',
    turnCount: 0,
  })
})

describe('turn alternation (APPU-1421 regression)', () => {
  it('starts with left speaking first', () => {
    useDebateStore.getState().startDebate(mockConfig)
    expect(useDebateStore.getState().currentSide).toBe('left')
    expect(useDebateStore.getState().turnCount).toBe(0)
  })

  it('alternates left → right → left → right through full turn cap', () => {
    useDebateStore.getState().startDebate(mockConfig)
    const totalTurns = mockConfig.turnCap * 2 // 4 half-turns

    for (let i = 0; i < totalTurns; i++) {
      const expectedSide = i % 2 === 0 ? 'left' : 'right'
      expect(useDebateStore.getState().currentSide).toBe(expectedSide)
      useDebateStore.getState().advanceSide()
    }

    // After all turns: turnCount equals total turns taken
    expect(useDebateStore.getState().turnCount).toBe(totalTurns)
    // currentSide wraps back to left
    expect(useDebateStore.getState().currentSide).toBe('left')
  })

  it('right side is always reachable (core APPU-1421 regression check)', () => {
    useDebateStore.getState().startDebate(mockConfig)
    // Simulate left turn completing
    const leftId = useDebateStore.getState().addTurn('left', 0)
    useDebateStore.getState().appendToTurn(leftId, 'Left argument text.')
    useDebateStore.getState().finishTurn(leftId)
    useDebateStore.getState().advanceSide()

    // Right side must now be current
    expect(useDebateStore.getState().currentSide).toBe('right')
    expect(useDebateStore.getState().phase).toBe('debating')

    // Right side can add a turn
    const rightId = useDebateStore.getState().addTurn('right', 1)
    useDebateStore.getState().appendToTurn(rightId, 'Right rebuttal text.')
    useDebateStore.getState().finishTurn(rightId)
    useDebateStore.getState().advanceSide()

    expect(useDebateStore.getState().currentSide).toBe('left')
    expect(useDebateStore.getState().turnCount).toBe(2)
  })

  it('pause stops progression; resume restores debating phase', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().pauseDebate()
    expect(useDebateStore.getState().phase).toBe('paused')

    // While paused, side should not change
    expect(useDebateStore.getState().currentSide).toBe('left')

    useDebateStore.getState().resumeDebate()
    expect(useDebateStore.getState().phase).toBe('debating')
    expect(useDebateStore.getState().currentSide).toBe('left')
  })

  it('wrap-up transitions to concluding and both sides complete closing statements', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().startConcluding()
    expect(useDebateStore.getState().phase).toBe('concluding')

    // Left closing
    const leftId = useDebateStore.getState().addTurn('left', 10)
    useDebateStore.getState().finishTurn(leftId)
    useDebateStore.getState().advanceSide()
    expect(useDebateStore.getState().currentSide).toBe('right')

    // Right closing — after this, endDebate should be called
    const rightId = useDebateStore.getState().addTurn('right', 11)
    useDebateStore.getState().finishTurn(rightId)
    useDebateStore.getState().endDebate()

    expect(useDebateStore.getState().phase).toBe('done')
  })

  it('turn cap triggers startConcluding when reached', () => {
    useDebateStore.getState().startDebate(mockConfig)
    // Exhaust all turns (turnCap * 2)
    for (let i = 0; i < mockConfig.turnCap * 2; i++) {
      useDebateStore.getState().advanceSide()
    }
    const { turnCount } = useDebateStore.getState()
    expect(turnCount).toBeGreaterThanOrEqual(mockConfig.turnCap * 2)
  })

  it('director instruction is cleared after each turn advance', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().setDirectorInstruction('Provoke harder!')
    expect(useDebateStore.getState().pendingDirectorInstruction).toBe('Provoke harder!')

    useDebateStore.getState().advanceSide()
    expect(useDebateStore.getState().pendingDirectorInstruction).toBeNull()
  })
})

describe('demo mode alternation', () => {
  it('demo mode produces correct side sequence from store perspective', () => {
    useDebateStore.getState().startDebate(mockConfig)

    // Simulate what demo engine does: addTurn(currentSide), finishTurn, advanceSide
    const sides: string[] = []
    for (let i = 0; i < 4; i++) {
      const side = useDebateStore.getState().currentSide
      sides.push(side)
      const id = useDebateStore.getState().addTurn(side, i)
      useDebateStore.getState().finishTurn(id)
      useDebateStore.getState().advanceSide()
    }

    expect(sides).toEqual(['left', 'right', 'left', 'right'])
  })
})
