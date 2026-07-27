import { describe, it, expect } from 'vitest'
import { extractNewSentences } from '../../lib/tts'
import { VOICE_SETTINGS_BY_INTENSITY, getVoiceSettings } from '../../lib/voiceSettings'

// ──────────────────────────────────────────────
// Sentence extraction
// ──────────────────────────────────────────────

describe('extractNewSentences', () => {
  it('returns empty when no complete sentence present', () => {
    const { sentences, nextIndex } = extractNewSentences('Hello world', 0)
    expect(sentences).toEqual([])
    expect(nextIndex).toBe(0)
  })

  it('extracts a single period-terminated sentence', () => {
    const { sentences, nextIndex } = extractNewSentences('Hello world.', 0)
    expect(sentences).toEqual(['Hello world.'])
    expect(nextIndex).toBe(12)
  })

  it('extracts a sentence ending with exclamation', () => {
    const { sentences } = extractNewSentences('Watch out!', 0)
    expect(sentences).toEqual(['Watch out!'])
  })

  it('extracts a sentence ending with question mark', () => {
    const { sentences } = extractNewSentences('Are you sure?', 0)
    expect(sentences).toEqual(['Are you sure?'])
  })

  it('extracts multiple sentences', () => {
    const text = 'First sentence. Second sentence! Third one?'
    const { sentences, nextIndex } = extractNewSentences(text, 0)
    expect(sentences).toHaveLength(3)
    expect(sentences[0]).toBe('First sentence.')
    expect(sentences[1]).toBe('Second sentence!')
    expect(sentences[2]).toBe('Third one?')
    expect(nextIndex).toBe(text.length)
  })

  it('leaves trailing incomplete sentence unconsumed', () => {
    const text = 'First sentence. Still typing'
    const { sentences, nextIndex } = extractNewSentences(text, 0)
    expect(sentences).toEqual(['First sentence.'])
    expect(nextIndex).toBe('First sentence. '.length)
    // remaining
    expect(text.slice(nextIndex)).toBe('Still typing')
  })

  it('starts processing from fromIndex', () => {
    const text = 'Ignored. New sentence here. And another.'
    const { sentences, nextIndex } = extractNewSentences(text, 9) // skip "Ignored."
    expect(sentences[0]).toBe('New sentence here.')
    expect(sentences[1]).toBe('And another.')
    expect(nextIndex).toBe(text.length)
  })

  it('handles an already-processed full text (returns nothing new)', () => {
    const text = 'Done sentence.'
    const { sentences, nextIndex } = extractNewSentences(text, text.length)
    expect(sentences).toEqual([])
    expect(nextIndex).toBe(text.length)
  })
})

// ──────────────────────────────────────────────
// Intensity → voice settings mapping
// ──────────────────────────────────────────────

describe('VOICE_SETTINGS_BY_INTENSITY', () => {
  it('has entries for all five intensity levels', () => {
    for (let i = 1; i <= 5; i++) {
      expect(VOICE_SETTINGS_BY_INTENSITY[i]).toBeDefined()
    }
  })

  it('level 1 is most stable (calm)', () => {
    const { stability, style } = VOICE_SETTINGS_BY_INTENSITY[1]
    expect(stability).toBeGreaterThan(0.7)
    expect(style).toBe(0)
  })

  it('level 5 is least stable (savage)', () => {
    const { stability, style } = VOICE_SETTINGS_BY_INTENSITY[5]
    expect(stability).toBeLessThan(0.4)
    expect(style).toBeGreaterThan(0.7)
  })

  it('stability decreases as intensity increases', () => {
    for (let i = 2; i <= 5; i++) {
      expect(VOICE_SETTINGS_BY_INTENSITY[i].stability).toBeLessThan(
        VOICE_SETTINGS_BY_INTENSITY[i - 1].stability
      )
    }
  })

  it('style increases as intensity increases', () => {
    for (let i = 2; i <= 5; i++) {
      expect(VOICE_SETTINGS_BY_INTENSITY[i].style).toBeGreaterThan(
        VOICE_SETTINGS_BY_INTENSITY[i - 1].style
      )
    }
  })
})

describe('getVoiceSettings', () => {
  it('clamps intensity below 1 to level 1', () => {
    expect(getVoiceSettings(0)).toEqual(VOICE_SETTINGS_BY_INTENSITY[1])
  })

  it('clamps intensity above 5 to level 5', () => {
    expect(getVoiceSettings(9)).toEqual(VOICE_SETTINGS_BY_INTENSITY[5])
  })

  it('rounds fractional intensity', () => {
    expect(getVoiceSettings(2.6)).toEqual(VOICE_SETTINGS_BY_INTENSITY[3])
    expect(getVoiceSettings(2.4)).toEqual(VOICE_SETTINGS_BY_INTENSITY[2])
  })

  it('returns level 3 settings for intensity 3', () => {
    expect(getVoiceSettings(3)).toEqual(VOICE_SETTINGS_BY_INTENSITY[3])
  })
})
