import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTurnEngine } from '../useTurnEngine'
import { useDebateStore } from '../../store/debateStore'
import { OpenRouterError } from '../../lib/openRouter'
import { MODELS } from '../../data/models'
import { DebateConfig } from '../../types'

// Controllable error thrown by the (mocked) live stream.
const { streamMock } = vi.hoisted(() => ({ streamMock: { error: null as unknown } }))

vi.mock('../../lib/demo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/demo')>()
  return { ...actual, isDemoMode: () => false, setServerProxyAvailable: vi.fn() }
})

vi.mock('../../lib/openRouter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/openRouter')>()
  return {
    ...actual,
    // Throws before yielding — mimics OpenRouter rejecting the request.
    streamCompletion: async function* () {
      throw streamMock.error
      // eslint-disable-next-line no-unreachable
      yield ''
    },
  }
})

const config: DebateConfig = {
  topic: 'Test topic',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Left', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Right', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 5,
}

beforeEach(() => {
  streamMock.error = null
  useDebateStore.setState({
    config,
    turns: [],
    phase: 'debating',
    intensity: 2,
    pendingDirectorInstruction: null,
    currentSide: 'left',
    turnCount: 0,
  })
})

describe('useTurnEngine live-mode error handling', () => {
  it('pauses the loop and drops the empty bubble on a model error (regression for runaway empty turns)', async () => {
    streamMock.error = new OpenRouterError('OpenRouter error (404): No endpoints found.', 404)
    const onError = vi.fn()

    const { result } = renderHook(() => useTurnEngine(onError))
    await act(async () => {
      await result.current.runNextTurn()
    })

    const state = useDebateStore.getState()
    // Loop is halted so it cannot re-fire and hammer the API with empty turns.
    expect(state.phase).toBe('paused')
    // No lingering empty bubble.
    expect(state.turns).toHaveLength(0)
    // Side did NOT advance — we stayed put rather than silently marching on.
    expect(state.currentSide).toBe('left')
    // Director gets one clear, actionable message.
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toContain('paused')
    expect(onError.mock.calls[0][0]).toContain('No endpoints found')
  })

  it('does not pile up turns even if the driver naively re-invokes after an error', async () => {
    streamMock.error = new OpenRouterError('OpenRouter error (402): Insufficient credits.', 402)
    const onError = vi.fn()

    const { result } = renderHook(() => useTurnEngine(onError))
    // Simulate the driver effect firing several times in a row.
    await act(async () => {
      await result.current.runNextTurn()
      await result.current.runNextTurn()
      await result.current.runNextTurn()
    })

    // Every attempt cleans up after itself — zero empty bubbles accumulate.
    expect(useDebateStore.getState().turns).toHaveLength(0)
    expect(useDebateStore.getState().phase).toBe('paused')
  })

  it('falls back to demo (not pause) when the server proxy is unconfigured (503)', async () => {
    const { setServerProxyAvailable } = await import('../../lib/demo')
    streamMock.error = new OpenRouterError('Chat proxy not configured', 503)
    const onError = vi.fn()

    const { result } = renderHook(() => useTurnEngine(onError))
    await act(async () => {
      await result.current.runNextTurn()
    })

    const state = useDebateStore.getState()
    // 503 means "no key" — keep playing, just in demo. Do not pause.
    expect(state.phase).toBe('debating')
    expect(state.turns).toHaveLength(0)
    expect(setServerProxyAvailable).toHaveBeenCalledWith(false)
    expect(onError.mock.calls[0][0]).toContain('demo')
  })
})
