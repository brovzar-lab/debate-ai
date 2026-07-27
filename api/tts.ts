import type { IncomingMessage, ServerResponse } from 'http'

// Inlined from src/lib/voiceSettings — Vercel serverless functions cannot import
// across into the app's src/ tree (breaks the function bundle → FUNCTION_INVOCATION_FAILED).
interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

const VOICE_SETTINGS_BY_INTENSITY: Record<number, VoiceSettings> = {
  1: { stability: 0.85, similarity_boost: 0.8, style: 0.0, use_speaker_boost: true },
  2: { stability: 0.7, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
  3: { stability: 0.55, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
  4: { stability: 0.35, similarity_boost: 0.7, style: 0.65, use_speaker_boost: true },
  5: { stability: 0.2, similarity_boost: 0.65, style: 0.9, use_speaker_boost: true },
}

function getVoiceSettings(intensity: number): VoiceSettings {
  const clamped = Math.min(5, Math.max(1, Math.round(intensity)))
  return VOICE_SETTINGS_BY_INTENSITY[clamped] ?? VOICE_SETTINGS_BY_INTENSITY[3]
}

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
