import { describe, it, expect, beforeEach } from 'vitest'
import { buildSystemPrompt } from '../debateStore'
import { DebateConfig, Debater } from '../../types'
import { MODELS } from '../../data/models'

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
})
