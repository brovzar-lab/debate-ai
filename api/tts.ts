import type { IncomingMessage, ServerResponse } from 'http'
import { getVoiceSettings } from '../src/lib/voiceSettings'

interface TtsBody {
  text?: unknown
  voiceId?: unknown
  intensity?: unknown
}

interface TtsRequest extends IncomingMessage {
  body?: TtsBody
}

// eleven_turbo_v2_5: ~300ms latency, 32 languages, best balance of speed + expressiveness
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5'

export default async function handler(req: TtsRequest, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'TTS not configured' }))
    return
  }

  const body: TtsBody = req.body ?? (await parseBody(req))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : ''
  const intensity = typeof body.intensity === 'number' ? body.intensity : 3

  if (!text || !voiceId) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'text and voiceId are required' }))
    return
  }

  try {
    const voiceSettings = getVoiceSettings(intensity)
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: voiceSettings,
        }),
      }
    )

    if (!elevenRes.ok) {
      const errText = await elevenRes.text()
      res.writeHead(elevenRes.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: errText }))
      return
    }

    const audioBuffer = await elevenRes.arrayBuffer()
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
      'Cache-Control': 'no-store',
    })
    res.end(Buffer.from(audioBuffer))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }))
  }
}

function parseBody(req: IncomingMessage): Promise<TtsBody> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data) as TtsBody)
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}
