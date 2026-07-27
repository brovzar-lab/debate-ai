/**
 * Proxy routing tests — APPU-1427.
 * Verifies streamCompletion routes to /api/chat (server proxy) vs direct OpenRouter
 * depending on whether a BYO key is stored.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { streamCompletion, OpenRouterError } from '../openRouter'
import { OPENROUTER_KEY_STORAGE, setServerProxyAvailable } from '../demo'

const originalFetch = globalThis.fetch

function makeSseResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
  return new Response(stream, { status: 200 })
}

beforeEach(() => {
  localStorage.clear()
  setServerProxyAvailable(true)
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  localStorage.clear()
  globalThis.fetch = originalFetch
})

describe('streamCompletion — proxy routing', () => {
  it('routes to /api/chat when no BYO key is stored', async () => {
    const sseData =
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n'
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeSseResponse(sseData))

    const chunks: string[] = []
    for await (const chunk of streamCompletion('test-model', 'test prompt')) {
      chunks.push(chunk)
    }

    const calls = vi.mocked(globalThis.fetch).mock.calls
    expect(calls[0][0]).toBe('/api/chat')
    expect(chunks).toEqual(['Hello'])
  })

  it('sends model and systemPrompt to /api/chat', async () => {
    const sseData = 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n'
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeSseResponse(sseData))

    for await (const _chunk of streamCompletion('my-model', 'my system prompt')) {
      // drain
    }

    const calls = vi.mocked(globalThis.fetch).mock.calls
    const init = calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('my-model')
    expect(body.systemPrompt).toBe('my system prompt')
  })

  it('routes directly to OpenRouter when a valid BYO key is stored', async () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, 'sk-or-v1-byo-key')
    const sseData =
      'data: {"choices":[{"delta":{"content":"World"}}]}\n\ndata: [DONE]\n\n'
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeSseResponse(sseData))

    const chunks: string[] = []
    for await (const chunk of streamCompletion('test-model', 'test prompt')) {
      chunks.push(chunk)
    }

    const calls = vi.mocked(globalThis.fetch).mock.calls
    expect(calls[0][0]).toBe('https://openrouter.ai/api/v1/chat/completions')
    const init = calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-or-v1-byo-key')
    expect(chunks).toEqual(['World'])
  })

  it('does NOT call OpenRouter directly for placeholder key', async () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, 'REPLACE_WITH_VALUE')
    const sseData = 'data: {"choices":[{"delta":{"content":"demo"}}]}\n\ndata: [DONE]\n\n'
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeSseResponse(sseData))

    for await (const _chunk of streamCompletion('test-model', 'test prompt')) {
      // drain
    }

    const calls = vi.mocked(globalThis.fetch).mock.calls
    expect(calls[0][0]).toBe('/api/chat')
  })

  it('throws OpenRouterError with status 503 when proxy is not configured', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('{"error":"not configured"}', {
        status: 503,
        statusText: 'Service Unavailable',
      })
    )

    const gen = streamCompletion('test-model', 'test prompt')
    await expect(gen.next()).rejects.toThrow(OpenRouterError)
  })

  it('OpenRouterError carries the HTTP status code', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response('{"error":"not configured"}', {
        status: 503,
        statusText: 'Service Unavailable',
      })
    )

    try {
      const gen = streamCompletion('test-model', 'test prompt')
      await gen.next()
    } catch (err) {
      expect(err).toBeInstanceOf(OpenRouterError)
      expect((err as OpenRouterError).status).toBe(503)
    }
  })
})
