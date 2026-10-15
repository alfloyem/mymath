import { createHash, randomBytes } from 'node:crypto'
import { hash, compare } from 'bcryptjs'
import { createError, getCookie, setCookie, getRequestIP, type H3Event } from 'h3'
import { db } from './db'
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export const randomToken = () => randomBytes(32).toString('base64url')
export const hashPassword = (password: string) => hash(password, 12)
export const verifyPassword = (password: string, hashed: string) => compare(password, hashed)
export async function currentSession(event: H3Event) {
  const token = getCookie(event, 'mymath_session')
  if (!token) return null
  const session = await db.session.findUnique({ where: { tokenHash: digest(token) }, select: { id: true, adminId: true, studentId: true, expiresAt: true, admin: { select: { username: true } }, student: { select: { id: true, firstName: true } } } })
  if (!session || session.expiresAt < new Date()) return null
  return session
}
export async function requireAdmin(event: H3Event) {
  const session = await currentSession(event)
  if (!session?.adminId) throw createError({ statusCode: 401, statusMessage: 'Admin oturumu gerekli.' })
  return session.adminId
}
export async function createSession(event: H3Event, identity: { adminId: string } | { studentId: string }) {
  const token = randomToken()
  await db.session.create({ data: { ...identity, tokenHash: digest(token), expiresAt: new Date(Date.now() + 7 * 86400000) } })
  setCookie(event, 'mymath_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 })
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
