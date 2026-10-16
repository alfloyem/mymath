export const SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000

export function sessionExpiry(now = Date.now()) {
  return new Date(now + SESSION_IDLE_MS)
}

export function sessionIsExpired(expiresAt: Date, now = Date.now()) {
  return expiresAt.getTime() <= now
}
