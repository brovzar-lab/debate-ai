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

export async function* streamCompletion(
  modelId: string,
  systemPrompt: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const key = getOpenRouterKey()
  if (!key) throw new OpenRouterError('No API key configured')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
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

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new OpenRouterError(`OpenRouter error: ${response.statusText}`, response.status)
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
