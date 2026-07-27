/**
 * TurnIndicator component — "now speaking" UX states.
 * Covers APPU-1424 UX polish acceptance criteria.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TurnIndicator } from '../TurnIndicator'
import { DebateConfig } from '../../../types'
import { MODELS } from '../../../data/models'

const mockConfig: DebateConfig = {
  topic: 'Test topic',
  debaters: [
    { side: 'left', model: MODELS[0], personaName: 'Agent L', stance: 'Pro' },
    { side: 'right', model: MODELS[1], personaName: 'Agent R', stance: 'Con' },
  ],
  intensity: 2,
  turnCap: 3,
}

const baseProps = {
  config: mockConfig,
  turnCount: 0,
  turnCap: 3,
}

describe('TurnIndicator', () => {
  it('shows "[name] is speaking…" when left is streaming', () => {
    render(
      <TurnIndicator {...baseProps} currentSide="left" phase="debating" isStreaming={true} />
    )
    expect(screen.getByText(/Agent L/)).toBeInTheDocument()
    expect(screen.getByText(/is speaking/)).toBeInTheDocument()
  })

  it('shows "[name] is speaking…" when right is streaming', () => {
    render(
      <TurnIndicator {...baseProps} currentSide="right" phase="debating" isStreaming={true} />
    )
    expect(screen.getByText(/Agent R/)).toBeInTheDocument()
    expect(screen.getByText(/is speaking/)).toBeInTheDocument()
  })

  it('shows "Waiting for [name]" when not streaming', () => {
    render(
      <TurnIndicator {...baseProps} currentSide="left" phase="debating" isStreaming={false} />
    )
    expect(screen.getByText(/Waiting for/)).toBeInTheDocument()
    expect(screen.getByText(/Agent L/)).toBeInTheDocument()
  })

  it('shows paused state', () => {
    render(
      <TurnIndicator {...baseProps} currentSide="left" phase="paused" isStreaming={false} />
    )
    expect(screen.getByText(/Paused/i)).toBeInTheDocument()
  })

  it('shows final statements banner in concluding phase', () => {
    render(
      <TurnIndicator {...baseProps} currentSide="left" phase="concluding" isStreaming={false} />
    )
    expect(screen.getByText(/Final statements/i)).toBeInTheDocument()
  })

  it('renders nothing when done', () => {
    const { container } = render(
      <TurnIndicator {...baseProps} currentSide="left" phase="done" isStreaming={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('progress advances with turn count (segment bar + round counter)', () => {
    const { container, unmount } = render(
      <TurnIndicator {...baseProps} currentSide="left" phase="debating" isStreaming={false} turnCount={0} />
    )
    // Segment bar renders turnCap*2 segments
    expect(container.querySelectorAll('.w-3').length).toBe(6)
    expect(screen.getByText(/Round 1\/3/)).toBeInTheDocument()
    unmount()

    render(
      <TurnIndicator {...baseProps} currentSide="left" phase="debating" isStreaming={false} turnCount={3} />
    )
    // After 3 turns we're in round 2
    expect(screen.getByText(/Round 2\/3/)).toBeInTheDocument()
  })

  it('left and right debaters show distinct names (distinct voices UX)', () => {
    const { unmount } = render(
      <TurnIndicator {...baseProps} currentSide="left" phase="debating" isStreaming={true} />
    )
    expect(screen.getByText(/Agent L/)).toBeInTheDocument()
    unmount()

    render(
      <TurnIndicator {...baseProps} currentSide="right" phase="debating" isStreaming={true} />
    )
    expect(screen.getByText(/Agent R/)).toBeInTheDocument()
  })
})
