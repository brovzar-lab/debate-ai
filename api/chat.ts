import type { IncomingMessage, ServerResponse } from 'http'

interface ChatBody {
  model?: unknown
  systemPrompt?: unknown
}

interface ChatRequest extends IncomingMessage {
  body?: ChatBody
}

export default async function handler(req: ChatRequest, res: ServerResponse): Promise<void> {
  if (req.method === 'GET') {
    const available = !!process.env.OPENROUTER_API_KEY
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ proxyAvailable: available }))
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Chat proxy not configured' }))
    return
  }

  const body: ChatBody = req.body ?? (await parseBody(req))
  const model = typeof body.model === 'string' ? body.model.trim() : ''
  const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''

  if (!model || !systemPrompt) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'model and systemPrompt are required' }))
    return
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://debate-ai.vercel.app',
        'X-Title': 'DEBATE AI',
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 400,
        temperature: 0.85,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: errText }))
      return
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    })

    if (!upstream.body) {
      res.end()
      return
    }

    const reader = upstream.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    } finally {
      reader.releaseLock()
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }))
    } else {
      res.end()
    }
  }
}

function parseBody(req: IncomingMessage): Promise<ChatBody> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data) as ChatBody)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}
