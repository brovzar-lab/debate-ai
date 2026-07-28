import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildClosingInstruction } from '../debateStore'
import { DebateConfig } from '../../types'
import { MODELS } from '../../data/models'
import { DEBATE_FORMATS } from '../../data/debateFormats'

const leftModel = MODELS[0]
const rightModel = MODELS[1]

const mockConfig: DebateConfig = {
  topic: 'AI will replace all human creativity',
  debaters: [
    {
      side: 'left',
      model: leftModel,
      personaName: 'ARIA-X',
      stance: 'AI will replace creativity entirely',
    },
    {
      side: 'right',
      model: rightModel,
      personaName: 'Professor Kai',
      stance: 'Human creativity is irreplaceable',
    },
  ],
  intensity: 2,
  turnCap: 5,
  format: 'classic',
}

describe('buildSystemPrompt', () => {
  it('includes topic and stance for left debater', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 2, null, null)
    expect(prompt).toContain('AI will replace all human creativity')
    expect(prompt).toContain('ARIA-X')
    expect(prompt).toContain('AI will replace creativity entirely')
  })

  it('includes topic and stance for right debater', () => {
    const prompt = buildSystemPrompt(mockConfig, 'right', 2, null, null)
    expect(prompt).toContain('Professor Kai')
    expect(prompt).toContain('Human creativity is irreplaceable')
  })

  it('includes opponent last turn when provided', () => {
    const prompt = buildSystemPrompt(mockConfig, 'right', 2, null, 'AI is going to win this one!')
    expect(prompt).toContain('AI is going to win this one!')
    expect(prompt).toContain('Your opponent just said')
  })

  it('does not include opponent text section when null', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 2, null, null)
    expect(prompt).not.toContain('Your opponent just said')
    expect(prompt).toContain('Make your opening argument')
  })

  it('injects director instruction when provided', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 2, 'Be more aggressive!', null)
    expect(prompt).toContain('DIRECTOR INSTRUCTION')
    expect(prompt).toContain('Be more aggressive!')
  })

  it('encodes intensity 1 as calm', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 1, null, null)
    expect(prompt).toContain('calm')
  })

  it('encodes intensity 5 as savage', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 5, null, null)
    expect(prompt).toContain('savage')
  })

  it('encodes intensity 3 as passionate', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 3, null, null)
    expect(prompt).toContain('passionate')
  })

  it('includes a length target instruction', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 2, null, null)
    expect(prompt).toContain('Respond in exactly')
  })

  it('varies length target by turnIndex', () => {
    const prompts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      buildSystemPrompt(mockConfig, 'left', 2, null, null, i)
    )
    const unique = new Set(prompts)
    // Mixed rhythm should produce more than one distinct prompt
    expect(unique.size).toBeGreaterThan(1)
  })

  it('discussion format uses collaborative framing', () => {
    const discussionConfig: DebateConfig = { ...mockConfig, format: 'discussion' }
    const prompt = buildSystemPrompt(discussionConfig, 'right', 2, null, 'Some thought.')
    expect(prompt).toContain('fellow thinker')
    expect(prompt).not.toContain('Your opponent just said')
  })

  it('discussion format opening uses collaborative opener', () => {
    const discussionConfig: DebateConfig = { ...mockConfig, format: 'discussion' }
    const prompt = buildSystemPrompt(discussionConfig, 'left', 2, null, null)
    expect(prompt).toContain('Share your opening perspective')
  })

  it('socratic format uses questioner framing', () => {
    const socraticConfig: DebateConfig = { ...mockConfig, format: 'socratic' }
    const prompt = buildSystemPrompt(socraticConfig, 'right', 2, null, 'Some claim.')
    expect(prompt).toContain('Probe their assumptions')
  })

  it('high intensity caps length at short targets', () => {
    const prompt = buildSystemPrompt(mockConfig, 'left', 4, null, null, 6)
    // turnIndex 6 on mixed rhythm would normally be index 3 (long), but intensity 4 caps at 1
    expect(prompt).toMatch(/ONE sharp sentence|tight 2.3 sentence jab/)
  })
})

describe('buildClosingInstruction', () => {
  it('verdict formats produce closing statement instruction', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.classic)
    expect(instruction).toContain('closing statement')
    expect(instruction).toContain('wins')
  })

  it('oxford also produces verdict closing', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.oxford)
    expect(instruction).toContain('closing statement')
  })

  it('dialectic produces synthesis instruction', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.dialectic)
    expect(instruction).toContain('synthesis')
    expect(instruction).not.toContain('wins')
  })

  it('discussion produces personal takeaway instruction', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.discussion)
    expect(instruction).toContain('landed')
    expect(instruction).toContain('no winner')
  })

  it('heated produces short parting shot instruction', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.heated)
    expect(instruction).toContain('Short')
    expect(instruction).not.toContain('wins')
  })

  it('socratic produces refined position instruction', () => {
    const instruction = buildClosingInstruction(DEBATE_FORMATS.socratic)
    expect(instruction).toContain('refined')
  })
})
