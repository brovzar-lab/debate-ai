/**
 * Demo mode — zero-setup policy (company non-negotiable).
 * Verifies isDemoMode logic and key management.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isDemoMode, getOpenRouterKey, setOpenRouterKey, clearOpenRouterKey, OPENROUTER_KEY_STORAGE } from '../demo'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('demo mode detection', () => {
  it('is demo mode when no key stored', () => {
    expect(isDemoMode()).toBe(true)
  })

  it('is demo mode when key is empty string', () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, '')
    expect(isDemoMode()).toBe(true)
  })

  it('is demo mode when key is whitespace', () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, '   ')
    expect(isDemoMode()).toBe(true)
  })

  it('is demo mode when key is REPLACE_WITH_VALUE placeholder', () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, 'REPLACE_WITH_VALUE')
    expect(isDemoMode()).toBe(true)
  })

  it('is NOT demo mode when a real key is stored', () => {
    setOpenRouterKey('sk-or-v1-real-key-here')
    expect(isDemoMode()).toBe(false)
  })
})

describe('key management', () => {
  it('getOpenRouterKey returns null when nothing stored', () => {
    expect(getOpenRouterKey()).toBeNull()
  })

  it('setOpenRouterKey persists to localStorage', () => {
    setOpenRouterKey('test-key')
    expect(localStorage.getItem(OPENROUTER_KEY_STORAGE)).toBe('test-key')
  })

  it('clearOpenRouterKey removes the stored key', () => {
    setOpenRouterKey('test-key')
    clearOpenRouterKey()
    expect(getOpenRouterKey()).toBeNull()
    expect(isDemoMode()).toBe(true)
  })
})
