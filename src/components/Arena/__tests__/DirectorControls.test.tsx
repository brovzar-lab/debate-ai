/**
 * DirectorControls component — Pause/Resume, Wrap-up, Provoke, intensity.
 * Covers APPU-1425 acceptance criteria for director UX.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DirectorControls } from '../DirectorControls'
import { useDebateStore } from '../../../store/debateStore'
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

beforeEach(() => {
  useDebateStore.setState({
    config: mockConfig,
    turns: [],
    phase: 'debating',
    intensity: 2,
    pendingDirectorInstruction: null,
    currentSide: 'left',
    turnCount: 0,
  })
})

describe('DirectorControls — Pause/Resume', () => {
  it('shows Pause button when debating', () => {
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument()
  })

  it('clicking Pause transitions store to paused', () => {
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Pause/i }))
    expect(useDebateStore.getState().phase).toBe('paused')
  })

  it('shows Resume button when paused', () => {
    useDebateStore.setState({ phase: 'paused' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument()
  })

  it('clicking Resume transitions store back to debating', () => {
    useDebateStore.setState({ phase: 'paused' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Resume/i }))
    expect(useDebateStore.getState().phase).toBe('debating')
  })
})

describe('DirectorControls — Wrap-up', () => {
  it('shows Wrap It Up button when debating', () => {
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole('button', { name: /Wrap It Up/i })).toBeInTheDocument()
  })

  it('clicking Wrap It Up calls onWrapUp and transitions to concluding', () => {
    const onWrapUp = vi.fn()
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={onWrapUp} isStreaming={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Wrap It Up/i }))
    expect(onWrapUp).toHaveBeenCalledOnce()
    expect(useDebateStore.getState().phase).toBe('concluding')
  })

  it('Wrap It Up button disabled while streaming', () => {
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={true} />)
    expect(screen.getByRole('button', { name: /Wrap It Up/i })).toBeDisabled()
  })

  it('shows closing statements banner in concluding phase, not button', () => {
    useDebateStore.setState({ phase: 'concluding' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByText(/Closing statements/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Wrap It Up/i })).toBeNull()
  })

  it('shows concluded banner in done phase', () => {
    useDebateStore.setState({ phase: 'done' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByText(/Debate concluded/i)).toBeInTheDocument()
  })
})

describe('DirectorControls — Provoke', () => {
  it('Provoke button calls onProvoke', () => {
    const onProvoke = vi.fn()
    render(<DirectorControls onProvoke={onProvoke} onWrapUp={vi.fn()} isStreaming={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Provoke/i }))
    expect(onProvoke).toHaveBeenCalledOnce()
  })

  it('Provoke button disabled while streaming', () => {
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={true} />)
    expect(screen.getByRole('button', { name: /Provoke/i })).toBeDisabled()
  })

  it('Provoke button disabled when concluding', () => {
    useDebateStore.setState({ phase: 'concluding' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole('button', { name: /Provoke/i })).toBeDisabled()
  })

  it('Provoke button disabled when done', () => {
    useDebateStore.setState({ phase: 'done' })
    render(<DirectorControls onProvoke={vi.fn()} onWrapUp={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole('button', { name: /Provoke/i })).toBeDisabled()
  })
})
