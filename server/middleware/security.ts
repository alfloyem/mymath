import { defineEventHandler, setHeader, getHeader, getRequestURL, createError } from 'h3'
import { isAllowedOrigin } from '../utils/origin'
export default defineEventHandler(event => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Referrer-Policy', 'no-referrer')
  setHeader(event, 'X-Frame-Options', 'DENY')
  const pathname = getRequestURL(event).pathname
  if (['/', '/groups', '/students', '/exams', '/login', '/account', '/giris', '/hesabim'].includes(pathname) || pathname.startsWith('/invite/') || pathname.startsWith('/davet/')) setHeader(event, 'Cache-Control', 'private, no-store')
  if (!event.path.startsWith('/api/')) return
  setHeader(event, 'Cache-Control', 'no-store')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) {
    const origin = getHeader(event, 'origin')
    if (origin && !isAllowedOrigin(origin, getRequestURL(event).origin, process.env.APP_URL, process.env.NODE_ENV === 'development')) throw createError({ statusCode: 403, statusMessage: 'Geçersiz istek kaynağı.' })
    if (getHeader(event, 'sec-fetch-site') === 'cross-site') throw createError({ statusCode: 403 })
  }
})
