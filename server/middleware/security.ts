import { defineEventHandler, setHeader, getHeader, getRequestURL, createError } from 'h3'
export default defineEventHandler(event => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Referrer-Policy', 'no-referrer')
  setHeader(event, 'X-Frame-Options', 'DENY')
  if (!event.path.startsWith('/api/')) return
  setHeader(event, 'Cache-Control', 'no-store')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) {
    const origin = getHeader(event, 'origin')
    const expected = process.env.APP_URL || getRequestURL(event).origin
    if (origin && origin !== expected) throw createError({ statusCode: 403, statusMessage: 'Geçersiz istek kaynağı.' })
    if (getHeader(event, 'sec-fetch-site') === 'cross-site') throw createError({ statusCode: 403 })
  }
})
