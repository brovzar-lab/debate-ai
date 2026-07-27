export const OPENROUTER_KEY_STORAGE = 'debate_ai_openrouter_key'

export function getOpenRouterKey(): string | null {
  return localStorage.getItem(OPENROUTER_KEY_STORAGE)
}

export function setOpenRouterKey(key: string): void {
  localStorage.setItem(OPENROUTER_KEY_STORAGE, key)
}

export function clearOpenRouterKey(): void {
  localStorage.removeItem(OPENROUTER_KEY_STORAGE)
}

export const isDemoMode = (): boolean => {
  const key = getOpenRouterKey()
  return !key || key.trim() === '' || key === 'REPLACE_WITH_VALUE'
}
