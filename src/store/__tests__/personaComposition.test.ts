import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../debateStore'
import { DebateConfig } from '../../types'
import { MODELS } from '../../data/models'

const baseConfig: DebateConfig = {
  topic: 'Is TypeScript worth it?',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Left', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Right', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 5,
  format: 'classic',
}

describe('buildSystemPrompt — persona composition', () => {
  it('omits persona content when no persona is set', () => {
    const prompt = buildSystemPrompt(baseConfig, 'left', 2, null, null, 0)
    expect(prompt).not.toContain('The Firebrand')
    expect(prompt).not.toContain('[PERSONA]')
  })

  it('includes persona systemPromptFragment when persona is set', () => {
    const config: DebateConfig = {
      ...baseConfig,
      debaters: [
        {
          ...baseConfig.debaters[0],
          persona: {
            name: 'The Firebrand',
            systemPromptFragment: 'Speak with absolute certainty and righteous urgency.',
          },
        },
        baseConfig.debaters[1],
      ],
    }
    const prompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
    expect(prompt).toContain('Speak with absolute certainty and righteous urgency.')
  })

  it('layers persona on top of format framing — both are present', () => {
    const config: DebateConfig = {
      ...baseConfig,
      debaters: [
        {
          ...baseConfig.debaters[0],
          persona: {
            name: 'The Professor',
            systemPromptFragment: 'Reason carefully and cite logic or evidence before every claim.',
          },
        },
        baseConfig.debaters[1],
      ],
    }
    const prompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
    expect(prompt).toContain('You hold a fixed opposing stance')
    expect(prompt).toContain('Reason carefully and cite logic or evidence before every claim.')
  })

  it('persona does not override format behavior — length target still present', () => {
    const config: DebateConfig = {
      ...baseConfig,
      debaters: [
        {
          ...baseConfig.debaters[0],
          persona: {
            name: 'The Firebrand',
            systemPromptFragment: 'Speak with absolute certainty.',
          },
        },
        baseConfig.debaters[1],
      ],
    }
    const prompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
    expect(prompt).toContain('Respond in exactly')
  })

  it('each debater uses its own persona independently', () => {
    const config: DebateConfig = {
      ...baseConfig,
      debaters: [
        {
          ...baseConfig.debaters[0],
          persona: { name: 'Left Persona', systemPromptFragment: 'Left persona fragment.' },
        },
        {
          ...baseConfig.debaters[1],
          persona: { name: 'Right Persona', systemPromptFragment: 'Right persona fragment.' },
        },
      ],
    }
    const leftPrompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
    const rightPrompt = buildSystemPrompt(config, 'right', 2, null, null, 0)

    expect(leftPrompt).toContain('Left persona fragment.')
    expect(leftPrompt).not.toContain('Right persona fragment.')
    expect(rightPrompt).toContain('Right persona fragment.')
    expect(rightPrompt).not.toContain('Left persona fragment.')
  })

  it('persona composes correctly across all 7 formats', () => {
    const fragment = 'My unique persona fragment.'
    const formats: Array<DebateConfig['format']> = [
      'classic',
      'discussion',
      'heated',
      'socratic',
      'oxford',
      'dialectic',
      'brainstorm',
    ]

    for (const format of formats) {
      const config: DebateConfig = {
        ...baseConfig,
        format,
        subject: format === 'brainstorm' ? 'general' : undefined,
        debaters: [
          {
            ...baseConfig.debaters[0],
            persona: { name: 'Test Persona', systemPromptFragment: fragment },
          },
          baseConfig.debaters[1],
        ],
      }
      const prompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
      expect(prompt, `format: ${format}`).toContain(fragment)
    }
  })

  it('persona fragment appears after format framing in the prompt', () => {
    const config: DebateConfig = {
      ...baseConfig,
      debaters: [
        {
          ...baseConfig.debaters[0],
          persona: {
            name: 'The Sniper',
            systemPromptFragment: 'Cool under pressure. One shot, center mass.',
          },
        },
        baseConfig.debaters[1],
      ],
    }
    const prompt = buildSystemPrompt(config, 'left', 2, null, null, 0)
    const formatFramingIdx = prompt.indexOf('You hold a fixed opposing stance')
    const personaFragmentIdx = prompt.indexOf('Cool under pressure. One shot, center mass.')
    const lengthTargetIdx = prompt.indexOf('Respond in exactly')

    expect(formatFramingIdx).toBeGreaterThan(-1)
    expect(personaFragmentIdx).toBeGreaterThan(formatFramingIdx)
    expect(lengthTargetIdx).toBeGreaterThan(personaFragmentIdx)
  })
})
