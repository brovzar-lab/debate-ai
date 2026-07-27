export const OPENROUTER_KEY_STORAGE = 'debate_ai_openrouter_key'

let _serverProxyAvailable: boolean | null = null

export function setServerProxyAvailable(available: boolean): void {
  _serverProxyAvailable = available
}

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
  const hasBYOKey = key !== null && key.trim() !== '' && key !== 'REPLACE_WITH_VALUE'
  if (hasBYOKey) return false
  // No BYO key: live only if server proxy is confirmed available
  return _serverProxyAvailable !== true
}
