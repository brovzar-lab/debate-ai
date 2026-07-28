import { describe, it, expect, beforeEach } from 'vitest'
import { useDebateStore } from '../debateStore'
import { DebateConfig } from '../../types'
import { MODELS } from '../../data/models'

const mockConfig: DebateConfig = {
  topic: 'Test topic',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Left', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Right', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 3,
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
    leadSteerFired: false,
    leadSynthesisFired: false,
  })
})

describe('debate store', () => {
  it('starts in setup phase', () => {
    expect(useDebateStore.getState().phase).toBe('setup')
  })

  it('transitions to debating on startDebate', () => {
    useDebateStore.getState().startDebate(mockConfig)
    expect(useDebateStore.getState().phase).toBe('debating')
    expect(useDebateStore.getState().config).toEqual(mockConfig)
  })

  it('pauses and resumes', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().pauseDebate()
    expect(useDebateStore.getState().phase).toBe('paused')

    useDebateStore.getState().resumeDebate()
    expect(useDebateStore.getState().phase).toBe('debating')
  })

  it('does not resume if not paused', () => {
    useDebateStore.getState().startDebate(mockConfig)
    // phase is 'debating', calling resume should not change it
    useDebateStore.getState().resumeDebate()
    expect(useDebateStore.getState().phase).toBe('debating')
  })

  it('adds, appends to, and finishes a turn', () => {
    useDebateStore.getState().startDebate(mockConfig)
    const id = useDebateStore.getState().addTurn('left', 0)

    const turnAfterAdd = useDebateStore.getState().turns.find((t) => t.id === id)
    expect(turnAfterAdd).toBeDefined()
    expect(turnAfterAdd?.text).toBe('')
    expect(turnAfterAdd?.status).toBe('streaming')

    useDebateStore.getState().appendToTurn(id, 'Hello ')
    useDebateStore.getState().appendToTurn(id, 'world!')

    const turnAfterAppend = useDebateStore.getState().turns.find((t) => t.id === id)
    expect(turnAfterAppend?.text).toBe('Hello world!')

    useDebateStore.getState().finishTurn(id)
    const turnAfterFinish = useDebateStore.getState().turns.find((t) => t.id === id)
    expect(turnAfterFinish?.status).toBe('done')
  })

  it('advances side correctly', () => {
    useDebateStore.getState().startDebate(mockConfig)
    expect(useDebateStore.getState().currentSide).toBe('left')

    useDebateStore.getState().advanceSide()
    expect(useDebateStore.getState().currentSide).toBe('right')
    expect(useDebateStore.getState().turnCount).toBe(1)

    useDebateStore.getState().advanceSide()
    expect(useDebateStore.getState().currentSide).toBe('left')
  })

  it('clears director instruction on advanceSide', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().setDirectorInstruction('Provoke!')
    expect(useDebateStore.getState().pendingDirectorInstruction).toBe('Provoke!')

    useDebateStore.getState().advanceSide()
    expect(useDebateStore.getState().pendingDirectorInstruction).toBeNull()
  })

  it('clamps intensity between 1 and 5', () => {
    useDebateStore.getState().setIntensity(0)
    expect(useDebateStore.getState().intensity).toBe(1)

    useDebateStore.getState().setIntensity(10)
    expect(useDebateStore.getState().intensity).toBe(5)

    useDebateStore.getState().setIntensity(3)
    expect(useDebateStore.getState().intensity).toBe(3)
  })

  it('resets to initial state', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().addTurn('left', 0)
    useDebateStore.getState().markLeadSteerFired()
    useDebateStore.getState().resetDebate()

    const state = useDebateStore.getState()
    expect(state.phase).toBe('setup')
    expect(state.turns).toHaveLength(0)
    expect(state.config).toBeNull()
    expect(state.leadSteerFired).toBe(false)
    expect(state.leadSynthesisFired).toBe(false)
  })

  it('marks lead flags and clears them on restart', () => {
    useDebateStore.getState().startDebate(mockConfig)
    expect(useDebateStore.getState().leadSteerFired).toBe(false)

    useDebateStore.getState().markLeadSteerFired()
    expect(useDebateStore.getState().leadSteerFired).toBe(true)

    useDebateStore.getState().markLeadSynthesisFired()
    expect(useDebateStore.getState().leadSynthesisFired).toBe(true)

    // Restarting should reset both flags
    useDebateStore.getState().startDebate(mockConfig)
    expect(useDebateStore.getState().leadSteerFired).toBe(false)
    expect(useDebateStore.getState().leadSynthesisFired).toBe(false)
  })

  it('transitions to concluding phase', () => {
    useDebateStore.getState().startDebate(mockConfig)
    useDebateStore.getState().startConcluding()
    expect(useDebateStore.getState().phase).toBe('concluding')
  })
})
