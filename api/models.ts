import type { IncomingMessage, ServerResponse } from 'http'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': 'https://debate-ai.vercel.app',
        'X-Title': 'DEBATE AI',
      },
    })

    if (!upstream.ok) {
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to fetch model list from OpenRouter' }))
      return
    }

    const data = (await upstream.json()) as { data?: Array<{ id: string }> }
    const available = (data.data ?? []).map((m) => m.id)

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    })
    res.end(JSON.stringify({ available }))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }))
  }
}
