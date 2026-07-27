import { getOpenRouterKey } from './demo'

export class OpenRouterError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

// HTTP/2 responses (Vercel/OpenRouter) have an empty statusText, so we must
// dig the real message out of the body. Handles both OpenRouter's native
// shape ({ error: { message } }) and our /api/chat proxy shape ({ error }),
// where `error` may itself be a stringified OpenRouter error.
function extractErrorMessage(raw: string, status: number): string {
  let message = ''
  try {
    const parsed = JSON.parse(raw)
    const err = parsed?.error
    if (typeof err === 'string') {
      // Proxy may forward a stringified upstream error — try to unwrap it.
      try {
        message = JSON.parse(err)?.error?.message ?? err
      } catch {
        message = err
      }
    } else if (err && typeof err.message === 'string') {
      message = err.message
    }
  } catch {
    message = raw.trim()
  }

  message = (message || 'the model returned an error').slice(0, 200)
  return `OpenRouter error (${status}): ${message}`
}

export async function* streamCompletion(
  modelId: string,
  systemPrompt: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const byoKey = getOpenRouterKey()

  let response: Response
  if (byoKey !== null && byoKey.trim() !== '' && byoKey !== 'REPLACE_WITH_VALUE') {
    // BYO key: call OpenRouter directly, key stays client-side
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${byoKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'DEBATE AI',
      },
      body: JSON.stringify({
        model: modelId,
        stream: true,
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 400,
        temperature: 0.85,
      }),
      signal,
    })
  } else {
    // No BYO key: use server proxy (key stays server-side)
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId, systemPrompt }),
      signal,
    })
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '')
    throw new OpenRouterError(extractErrorMessage(raw, response.status), response.status)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new OpenRouterError('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json?.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta) {
            yield delta
          }
        } catch {
          // malformed chunk — skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
