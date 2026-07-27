// Default ElevenLabs voice IDs (premade, available on all accounts)
export const DEFAULT_VOICE_IDS = {
  left: 'pNInz6obpgDQGcFmaJgB',   // Adam — deep, authoritative male
  right: '21m00Tcm4TlvDq8ikWAM',  // Rachel — clear, professional female
} as const

export const AVAILABLE_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (deep, authoritative)' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (clear, professional)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi (strong, assertive)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (warm, expressive)' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni (well-rounded)' },
  { id: 'VR6AewLTigWG4xSOukaG', label: 'Arnold (confident)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli (young, energetic)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (young, confident)' },
] as const

/**
 * Extracts complete sentences from text starting at fromIndex.
 * Leaves incomplete trailing text (no terminal punctuation) unconsumed.
 * Returns { sentences, nextIndex } where nextIndex is the new "processed up to" cursor.
 */
export function extractNewSentences(
  text: string,
  fromIndex: number
): { sentences: string[]; nextIndex: number } {
  const segment = text.slice(fromIndex)
  const sentences: string[] = []
  // Match text up to and including terminal punctuation, optionally followed by whitespace
  const re = /[^.!?]*[.!?]+\s*/g
  let lastEnd = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(segment)) !== null) {
    const s = match[0].trim()
    if (s) sentences.push(s)
    lastEnd = match.index + match[0].length
  }
  return { sentences, nextIndex: fromIndex + lastEnd }
}

/**
 * Calls the serverless TTS proxy and returns an object URL for the audio.
 * Throws on network failure or non-2xx response.
 */
export async function synthesizeSentence(
  text: string,
  voiceId: string,
  intensity: number
): Promise<string> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId, intensity }),
  })

  if (!res.ok) {
    throw new Error(`TTS proxy returned ${res.status}`)
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
