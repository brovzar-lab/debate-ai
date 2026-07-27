import { render, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArenaScreen } from '../ArenaScreen'
import { useDebateStore } from '../../../store/debateStore'
import { MODELS } from '../../../data/models'
import { DebateConfig } from '../../../types'

vi.mock('../../../lib/demo', () => ({ isDemoMode: () => false }))

const runNextTurnMock = vi.fn()
vi.mock('../../../hooks/useTurnEngine', () => ({
  useTurnEngine: () => ({
    runNextTurn: runNextTurnMock,
    abortCurrentTurn: vi.fn(),
  }),
}))

const mockConfig: DebateConfig = {
  topic: 'Test topic',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Left', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Right', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 3,
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
  runNextTurnMock.mockReset()
})

describe('ArenaScreen turn loop', () => {
  it('calls runNextTurn when debate starts', async () => {
    runNextTurnMock.mockResolvedValue(undefined)

    await act(async () => {
      useDebateStore.getState().startDebate(mockConfig)
    })

    render(<ArenaScreen onReset={() => {}} />)

    await waitFor(() => {
      expect(runNextTurnMock).toHaveBeenCalledTimes(1)
    })
  })

  it('drives turn 2 after turn 1 completes — no stall (regression for ref/microtask race)', async () => {
    // Turn 1: simulate a live streaming turn.
    // The async gap between addTurn and finishTurn+advanceSide is what caused the bug:
    // the useEffect re-fired with isRunningRef.current=true before .finally() reset it.
    runNextTurnMock.mockImplementationOnce(async () => {
      const store = useDebateStore.getState()
      const id = store.addTurn('left', 0)
      store.appendToTurn(id, 'Turn 1 argument text')
      // yield — mimics the async gap in real SSE streaming
      await Promise.resolve()
      store.finishTurn(id)
      store.advanceSide()
    })
    // Turn 2: just resolves (we only care that it starts)
    runNextTurnMock.mockResolvedValue(undefined)

    await act(async () => {
      useDebateStore.getState().startDebate(mockConfig)
    })

    render(<ArenaScreen onReset={() => {}} />)

    await waitFor(() => {
      expect(runNextTurnMock).toHaveBeenCalledTimes(2)
    }, { timeout: 2000 })
  })

  it('does not start a turn while streaming is in progress', async () => {
    let resolveFirstTurn!: () => void

    runNextTurnMock.mockImplementationOnce(async () => {
      const store = useDebateStore.getState()
      const id = store.addTurn('left', 0)
      store.appendToTurn(id, 'Streaming…')
      // hold here — turn is still streaming
      await new Promise<void>((resolve) => {
        resolveFirstTurn = resolve
      })
      store.finishTurn(id)
      store.advanceSide()
    })
    runNextTurnMock.mockResolvedValue(undefined)

    await act(async () => {
      useDebateStore.getState().startDebate(mockConfig)
    })

    render(<ArenaScreen onReset={() => {}} />)

    // Turn 1 starts
    await waitFor(() => expect(runNextTurnMock).toHaveBeenCalledTimes(1))

    // While streaming, no second call should happen
    expect(runNextTurnMock).toHaveBeenCalledTimes(1)

    // Finish turn 1
    await act(async () => {
      resolveFirstTurn()
      await Promise.resolve()
    })

    // Turn 2 starts after turn 1 finishes
    await waitFor(() => expect(runNextTurnMock).toHaveBeenCalledTimes(2))
  })

  it('stops the loop when debate is paused', async () => {
    runNextTurnMock.mockImplementationOnce(async () => {
      const store = useDebateStore.getState()
      const id = store.addTurn('left', 0)
      store.appendToTurn(id, 'Turn text')
      await Promise.resolve()
      store.finishTurn(id)
      store.advanceSide()
      // pause before turn 2 can start
      store.pauseDebate()
    })
    runNextTurnMock.mockResolvedValue(undefined)

    await act(async () => {
      useDebateStore.getState().startDebate(mockConfig)
    })

    render(<ArenaScreen onReset={() => {}} />)

    await waitFor(() => expect(runNextTurnMock).toHaveBeenCalledTimes(1))

    // give time for any spurious second call
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(runNextTurnMock).toHaveBeenCalledTimes(1)
  })
})
