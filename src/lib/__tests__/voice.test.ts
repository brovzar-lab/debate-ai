/**
 * Voice feature acceptance tests — APPU-1423.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_VOICE_IDS, AVAILABLE_VOICES, extractNewSentences, synthesizeSentence } from '../tts'
import { VOICE_SETTINGS_BY_INTENSITY, getVoiceSettings } from '../voiceSettings'

// ── Voice config ──────────────────────────────────────────────────────────────

describe('voice config — left vs right', () => {
  it('exports distinct default voice IDs for left and right debaters', () => {
    expect(DEFAULT_VOICE_IDS.left).toBeTruthy()
    expect(DEFAULT_VOICE_IDS.right).toBeTruthy()
    expect(DEFAULT_VOICE_IDS.left).not.toBe(DEFAULT_VOICE_IDS.right)
  })

  it('default voice IDs are in the AVAILABLE_VOICES list', () => {
    const ids = AVAILABLE_VOICES.map((v) => v.id)
    expect(ids).toContain(DEFAULT_VOICE_IDS.left)
    expect(ids).toContain(DEFAULT_VOICE_IDS.right)
  })
})

// ── Intensity → voice settings ────────────────────────────────────────────────

describe('intensity → ElevenLabs voice settings', () => {
  it('intensity 1 maps to the calmest settings (highest stability, zero style)', () => {
    const s = VOICE_SETTINGS_BY_INTENSITY[1]
    expect(s.stability).toBeGreaterThan(0.7)
    expect(s.style).toBe(0)
  })

  it('intensity 5 maps to the most dramatic settings (lowest stability, high style)', () => {
    const s = VOICE_SETTINGS_BY_INTENSITY[5]
    expect(s.stability).toBeLessThan(0.4)
    expect(s.style).toBeGreaterThan(0.7)
  })

  it('all intensities 1-5 produce distinct stability values (no duplicates)', () => {
    const stabilities = [1, 2, 3, 4, 5].map((i) => VOICE_SETTINGS_BY_INTENSITY[i].stability)
    const unique = new Set(stabilities)
    expect(unique.size).toBe(5)
  })

  it('stability strictly decreases as intensity increases', () => {
    for (let i = 2; i <= 5; i++) {
      expect(VOICE_SETTINGS_BY_INTENSITY[i].stability).toBeLessThan(
        VOICE_SETTINGS_BY_INTENSITY[i - 1].stability
      )
    }
  })

  it('style strictly increases as intensity increases', () => {
    for (let i = 2; i <= 5; i++) {
      expect(VOICE_SETTINGS_BY_INTENSITY[i].style).toBeGreaterThan(
        VOICE_SETTINGS_BY_INTENSITY[i - 1].style
      )
    }
  })

  it('provoke (intensity 5) produces noticeably different settings from calm (intensity 1)', () => {
    const calm = getVoiceSettings(1)
    const savage = getVoiceSettings(5)
    // At minimum 30% difference in stability
    expect(calm.stability - savage.stability).toBeGreaterThan(0.3)
    // At minimum 50% difference in style
    expect(savage.style - calm.style).toBeGreaterThan(0.5)
  })
})

// ── Graceful fallback when TTS endpoint absent ─────────────────────────────────

describe('voice graceful fallback', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('synthesizeSentence throws (callers must catch) when endpoint returns non-OK', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'TTS not configured' }), { status: 503 })
    )
    await expect(synthesizeSentence('Hello.', 'voice-id', 3)).rejects.toThrow('503')
  })

  it('synthesizeSentence throws when network is unreachable', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(synthesizeSentence('Hello.', 'voice-id', 3)).rejects.toThrow()
  })
})

// ── Sentence chunking ─────────────────────────────────────────────────────────

describe('extractNewSentences for near-real-time chunking', () => {
  it('fires for demo mode turns — first sentence extracted as soon as it completes', () => {
    // Simulates a streaming turn that has received its first complete sentence
    const partialTurnText = 'Let me be direct: human creativity is already obsolete. Still typing'
    const { sentences, nextIndex } = extractNewSentences(partialTurnText, 0)
    expect(sentences).toHaveLength(1)
    expect(sentences[0]).toBe('Let me be direct: human creativity is already obsolete.')
    // The "Still typing" fragment is not consumed yet
    expect(partialTurnText.slice(nextIndex)).toBe('Still typing')
  })

  it('first sentence starts quickly — does not wait for full turn', () => {
    // A debate turn has ~300 chars; first sentence typically ends before 80 chars
    const turnSoFar = 'AI will replace you. And I mean that literally.'
    const { sentences } = extractNewSentences(turnSoFar, 0)
    expect(sentences.length).toBeGreaterThan(0)
    expect(sentences[0]).toBe('AI will replace you.')
  })
})
