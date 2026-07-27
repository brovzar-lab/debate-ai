import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAvailableModels } from '../useAvailableModels'
import { MODELS } from '../../data/models'
import { OPENROUTER_KEY_STORAGE, setServerProxyAvailable } from '../../lib/demo'

// All curated model slugs, so tests can refer to the full set.
const ALL_SLUGS = MODELS.map((m) => m.openrouterId)

beforeEach(() => {
  localStorage.clear()
  setServerProxyAvailable(false)
  vi.restoreAllMocks()
})

afterEach(() => {
  localStorage.clear()
  setServerProxyAvailable(false)
})

describe('demo mode (no key, no proxy)', () => {
  it('returns all MODELS immediately with no loading', () => {
    const { result } = renderHook(() => useAvailableModels())
    expect(result.current.loading).toBe(false)
    expect(result.current.models).toEqual(MODELS)
    expect(result.current.unavailableCount).toBe(0)
  })

  it('never calls fetch in demo mode', () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    renderHook(() => useAvailableModels())
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('live mode — server proxy available', () => {
  beforeEach(() => {
    // Make isDemoMode() return false: store a real key.
    localStorage.setItem(OPENROUTER_KEY_STORAGE, 'sk-or-v1-test-key')
  })

  it('returns only models confirmed by /api/models', async () => {
    // Simulate server returning all slugs except the first two.
    const available = ALL_SLUGS.slice(2)
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ available }), { status: 200 })
    )

    const { result } = renderHook(() => useAvailableModels())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.models.map((m) => m.openrouterId)).toEqual(available)
    expect(result.current.unavailableCount).toBe(2)
  })

  it('falls back to all MODELS when /api/models and direct call both fail', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useAvailableModels())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.models).toEqual(MODELS)
    expect(result.current.unavailableCount).toBe(0)
  })

  it('falls back to all MODELS when /api/models returns non-ok and direct call also fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 500 }))  // proxy fails
      .mockRejectedValueOnce(new Error('cors'))                      // direct call fails

    const { result } = renderHook(() => useAvailableModels())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.models).toEqual(MODELS)
  })

  it('falls back to direct OpenRouter when proxy returns non-ok', async () => {
    const available = ALL_SLUGS.slice(1)
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))   // proxy fails
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: available.map((id) => ({ id })) }),
          { status: 200 }
        )
      )

    const { result } = renderHook(() => useAvailableModels())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.models.map((m) => m.openrouterId)).toEqual(available)
    expect(result.current.unavailableCount).toBe(1)
  })

  it('falls back to all MODELS when validated list is empty (safety guard)', async () => {
    // Server returns an empty available list — should not leave user with no models.
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ available: [] }), { status: 200 })
    )

    const { result } = renderHook(() => useAvailableModels())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.models).toEqual(MODELS)
  })
})
