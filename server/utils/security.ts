import { createHash, randomBytes } from 'node:crypto'
import { hash, compare } from 'bcryptjs'
import { createError, getCookie, setCookie, getRequestIP, type H3Event } from 'h3'
import { db } from './db'
import { sessionExpiry, sessionIsExpired } from './sessionPolicy'
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export const randomToken = () => randomBytes(32).toString('base64url')
export const hashPassword = (password: string) => hash(password, 12)
export const verifyPassword = (password: string, hashed: string) => compare(password, hashed)
export async function currentSession(event: H3Event) {
  const token = getCookie(event, 'mymath_session')
  if (!token) return null
  const session = await db.session.findUnique({ where: { tokenHash: digest(token) }, select: { id: true, adminId: true, studentId: true, expiresAt: true, admin: { select: { username: true } }, student: { select: { id: true, firstName: true } } } })
  const now = Date.now()
  if (!session || sessionIsExpired(session.expiresAt, now)) return null
  const expiresAt = sessionExpiry(now)
  // Conditional updates cannot revive expired or concurrently revoked sessions.
  // Older concurrent requests must not shorten a newer expiry.
  const renewed = await db.session.updateMany({
    where: { id: session.id, expiresAt: { gt: new Date(now), lt: expiresAt } },
    data: { expiresAt }
  })
  if (renewed.count) setSessionCookie(event, token, expiresAt)
  return session
}
export async function requireAdmin(event: H3Event) {
  const session = await currentSession(event)
  if (!session?.adminId) throw createError({ statusCode: 401, statusMessage: 'Admin oturumu gerekli.' })
  return session.adminId
}
export async function createSession(event: H3Event, identity: { adminId: string } | { studentId: string }) {
  const token = randomToken()
  const expiresAt = sessionExpiry()
  await db.session.create({ data: { ...identity, tokenHash: digest(token), expiresAt } })
  setSessionCookie(event, token, expiresAt)
}
function setSessionCookie(event: H3Event, token: string, expiresAt: Date) {
  setCookie(event, 'mymath_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt })
}
// Bounded, process-local limiter. Use a shared store when deploying multiple instances.
const attempts = new Map<string, { count: number; until: number }>()
export function rateLimit(event: H3Event, scope: string, limit = 15) {
  const now = Date.now()
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key)
  const key = `${scope}:${getRequestIP(event) || 'local'}`
  const value = attempts.get(key) ?? { count: 0, until: now + 15 * 60000 }
  if (++value.count > limit) throw createError({ statusCode: 429, statusMessage: 'Çok fazla deneme. Daha sonra tekrar deneyin.' })
  attempts.set(key, value)
}
