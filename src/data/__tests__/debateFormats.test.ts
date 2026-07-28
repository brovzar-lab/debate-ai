import { describe, it, expect } from 'vitest'
import {
  DEBATE_FORMATS,
  DEFAULT_FORMAT_ID,
  selectTurnLengthTarget,
  DebateFormatId,
} from '../debateFormats'

const ALL_IDS: DebateFormatId[] = ['classic', 'discussion', 'dialectic', 'heated', 'socratic', 'oxford', 'brainstorm']

describe('DEBATE_FORMATS catalog', () => {
  it('contains all 7 required formats', () => {
    expect(Object.keys(DEBATE_FORMATS)).toEqual(expect.arrayContaining(ALL_IDS))
    expect(Object.keys(DEBATE_FORMATS)).toHaveLength(7)
  })

  it('default format is classic', () => {
    expect(DEFAULT_FORMAT_ID).toBe('classic')
  })

  it.each(ALL_IDS)('%s has required fields', (id) => {
    const f = DEBATE_FORMATS[id]
    expect(f.id).toBe(id)
    expect(f.label).toBeTruthy()
    expect(f.emoji).toBeTruthy()
    expect(f.blurb).toBeTruthy()
    expect(['adversarial', 'collaborative', 'questioner']).toContain(f.framing)
    expect(['short', 'mixed', 'long', 'brainstorm']).toContain(f.turnRhythm)
    expect(['verdict', 'synthesis', 'open', 'best-idea']).toContain(f.ending)
  })

  it('verdict formats are classic and oxford', () => {
    const verdictFormats = ALL_IDS.filter((id) => DEBATE_FORMATS[id].ending === 'verdict')
    expect(verdictFormats).toEqual(expect.arrayContaining(['classic', 'oxford']))
    expect(verdictFormats).toHaveLength(2)
  })

  it('synthesis ending is dialectic only', () => {
    const synthFormats = ALL_IDS.filter((id) => DEBATE_FORMATS[id].ending === 'synthesis')
    expect(synthFormats).toEqual(['dialectic'])
  })

  it('best-idea ending is brainstorm only', () => {
    const bestIdeaFormats = ALL_IDS.filter((id) => DEBATE_FORMATS[id].ending === 'best-idea')
    expect(bestIdeaFormats).toEqual(['brainstorm'])
  })

  it('collaborative framing covers discussion, dialectic, and brainstorm', () => {
    const collab = ALL_IDS.filter((id) => DEBATE_FORMATS[id].framing === 'collaborative')
    expect(collab).toEqual(expect.arrayContaining(['discussion', 'dialectic', 'brainstorm']))
  })

  it('questioner framing is socratic only', () => {
    const questioner = ALL_IDS.filter((id) => DEBATE_FORMATS[id].framing === 'questioner')
    expect(questioner).toEqual(['socratic'])
  })

  it('brainstorm format has brainstorm rhythm', () => {
    expect(DEBATE_FORMATS.brainstorm.turnRhythm).toBe('brainstorm')
  })
})

describe('selectTurnLengthTarget', () => {
  it('returns a non-empty string for all format + intensity combos', () => {
    for (const id of ALL_IDS) {
      for (let intensity = 1; intensity <= 5; intensity++) {
        const result = selectTurnLengthTarget(DEBATE_FORMATS[id], intensity, 0)
        expect(result).toBeTruthy()
      }
    }
  })

  it('produces varied results across 8 turn indices', () => {
    const format = DEBATE_FORMATS.classic
    const results = Array.from({ length: 8 }, (_, i) =>
      selectTurnLengthTarget(format, 2, i)
    )
    const unique = new Set(results)
    // mixed rhythm should yield at least 3 distinct targets over 8 turns
    expect(unique.size).toBeGreaterThanOrEqual(3)
  })

  it('brainstorm rhythm produces varied results across 8 turn indices', () => {
    const format = DEBATE_FORMATS.brainstorm
    const results = Array.from({ length: 8 }, (_, i) =>
      selectTurnLengthTarget(format, 2, i)
    )
    const unique = new Set(results)
    // brainstorm rhythm should yield at least 2 distinct targets
    expect(unique.size).toBeGreaterThanOrEqual(2)
  })

  it('brainstorm rhythm skews shorter than long rhythm', () => {
    const brainstormFmt = DEBATE_FORMATS.brainstorm
    const longFmt = DEBATE_FORMATS.oxford

    const lengthRank = (s: string) => {
      if (s.includes('ONE')) return 0
      if (s.includes('jab')) return 1
      if (s.includes('paragraph') && !s.includes('2–3')) return 2
      return 3
    }

    const brainstormAvg =
      Array.from({ length: 8 }, (_, i) => lengthRank(selectTurnLengthTarget(brainstormFmt, 2, i)))
        .reduce((a: number, b) => a + b, 0) / 8

    const longAvg =
      Array.from({ length: 8 }, (_, i) => lengthRank(selectTurnLengthTarget(longFmt, 2, i)))
        .reduce((a: number, b) => a + b, 0) / 8

    expect(brainstormAvg).toBeLessThan(longAvg)
  })

  it('short rhythm format produces shorter targets than long rhythm on average', () => {
    const shortFmt = DEBATE_FORMATS.heated  // short rhythm
    const longFmt = DEBATE_FORMATS.oxford   // long rhythm

    const lengthRank = (s: string) => {
      if (s.includes('ONE')) return 0
      if (s.includes('jab')) return 1
      if (s.includes('paragraph') && !s.includes('2–3')) return 2
      return 3
    }

    const shortAvg =
      Array.from({ length: 8 }, (_, i) => lengthRank(selectTurnLengthTarget(shortFmt, 2, i)))
        .reduce((a: number, b) => a + b, 0) / 8

    const longAvg =
      Array.from({ length: 8 }, (_, i) => lengthRank(selectTurnLengthTarget(longFmt, 2, i)))
        .reduce((a: number, b) => a + b, 0) / 8

    expect(shortAvg).toBeLessThan(longAvg)
  })

  it('high intensity (4+) caps at short targets', () => {
    for (const id of ALL_IDS) {
      for (let i = 0; i < 8; i++) {
        const result = selectTurnLengthTarget(DEBATE_FORMATS[id], 4, i)
        expect(result).toMatch(/ONE sharp sentence|tight 2.3 sentence jab/)
      }
    }
  })

  it('intensity 5 also caps at short targets', () => {
    const result = selectTurnLengthTarget(DEBATE_FORMATS.oxford, 5, 0)
    expect(result).toMatch(/ONE sharp sentence|tight 2.3 sentence jab/)
  })

  it('low intensity (1-2) does not cap output for long rhythm formats', () => {
    const longFmt = DEBATE_FORMATS.dialectic  // long rhythm
    const results = Array.from({ length: 8 }, (_, i) =>
      selectTurnLengthTarget(longFmt, 1, i)
    )
    // Long rhythm at low intensity should include developed paragraphs
    expect(results.some((r) => r.includes('2–3 paragraph'))).toBe(true)
  })

  it('cycles the pattern when turnIndex exceeds pattern length', () => {
    const format = DEBATE_FORMATS.classic
    // Pattern has 8 elements, so index 0 and index 8 should match
    expect(selectTurnLengthTarget(format, 2, 0)).toBe(selectTurnLengthTarget(format, 2, 8))
    expect(selectTurnLengthTarget(format, 2, 3)).toBe(selectTurnLengthTarget(format, 2, 11))
  })
})
