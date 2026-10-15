import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { db } from '../server/utils/db'

const base = process.env.TEST_BASE_URL || 'http://localhost:3000'
const marker = `route-${randomBytes(6).toString('hex')}`
const password = 'Route-Test-Password-123!'
let adminCookie = '', studentCookie = '', groupId = '', studentId = ''
const cookies: string[] = []
const studentIds: string[] = []
async function request(path: string, method = 'GET', body?: unknown, cookie = '', expected = 200) {
  const response = await fetch(`${base}${path}`, { method, redirect: 'manual', headers: { origin: new URL(base).origin, 'content-type': 'application/json', cookie }, body: body === undefined ? undefined : JSON.stringify(body) })
  assert.equal(response.status, expected, `${method} ${path}: ${await response.clone().text()}`)
  const sessionCookie = response.headers.get('set-cookie')?.split(';')[0] || ''
  if (sessionCookie) cookies.push(sessionCookie)
  return { response, cookie: sessionCookie }
}
try {
  const login = await request('/api/auth/login', 'POST', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })
  adminCookie = login.cookie
  assert.equal((await login.response.json()).role, 'ADMIN')
  const loginPage = await request('/login')
  const html = await loginPage.response.text()
  assert.ok(html.includes('id="username"') && !html.includes('id="role"'))
  assert.match(loginPage.response.headers.get('cache-control') || '', /no-store/)
  for (const [oldPath, canonical] of [['/', '/groups'], ['/giris', '/login'], ['/hesabim', '/account'], ['/davet/example', '/invite/example']]) {
    const { response } = await request(oldPath!, 'GET', undefined, '', oldPath!.startsWith('/davet/') ? 301 : 302)
    assert.equal(response.headers.get('location'), canonical)
  }
  for (const path of ['/groups', '/students', '/exams']) {
    const { response } = await request(path, 'GET', undefined, adminCookie)
    const page = await response.text()
    for (const href of ['/groups', '/students', '/exams']) assert.ok(page.includes(`href="${href}"`))
  }
  const group = await request('/api/groups', 'POST', { name: marker }, adminCookie)
  groupId = (await group.response.json()).id
  const student = await request('/api/students', 'POST', { firstName: marker, username: marker, password, groupId }, adminCookie)
  const data = await student.response.json(); studentId = data.id
  studentIds.push(studentId)
  assert.equal(data.username, marker)
  const generated = await request('/api/students', 'POST', { firstName: marker, groupId }, adminCookie)
  const generatedStudent = await generated.response.json(); studentIds.push(generatedStudent.id)
  assert.match(generatedStudent.username, /^student-[a-z0-9_-]{10}$/)
  await request('/api/students', 'POST', { firstName: marker, username: process.env.ADMIN_USERNAME, groupId }, adminCookie, 409)
  await request('/api/students', 'POST', { firstName: marker, username: marker, groupId }, adminCookie, 409)
  const page = await request(`/students?group=${groupId}`, 'GET', undefined, adminCookie)
  assert.ok((await page.response.text()).includes(marker))
  await request('/api/auth/login', 'POST', { username: studentId, password }, '', 401)
  const studentLogin = await request('/api/auth/login', 'POST', { username: marker.toUpperCase(), password, role: 'ADMIN' })
  studentCookie = studentLogin.cookie
  assert.equal((await studentLogin.response.json()).role, 'STUDENT')
  await request('/api/dashboard', 'GET', undefined, studentCookie, 401)
  await request('/account', 'GET', undefined, studentCookie)
  const denied = await request('/groups', 'GET', undefined, studentCookie, 302)
  assert.equal(denied.response.headers.get('location'), '/account')
  const inviteResponse = await request(`/api/students/${studentId}/invite`, 'POST', {}, adminCookie)
  const url = new URL((await inviteResponse.response.json()).url)
  assert.match(url.pathname, /^\/invite\//)
  const invitation = await request(`/api/invite/${url.pathname.split('/').at(-1)}`)
  const invitationData = await invitation.response.json()
  assert.equal(invitationData.username, marker)
  assert.equal(invitationData.studentId, undefined)
  console.log('HTTP: canonical routes, direct group URL, admin/student username login, duplicate usernames, role isolation and invitation username passed.')
} finally {
  for (const cookie of cookies) await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { cookie, origin: new URL(base).origin } })
  if (studentIds.length) await db.student.deleteMany({ where: { id: { in: studentIds } } })
  if (groupId) await db.group.delete({ where: { id: groupId } })
  await db.auditLog.deleteMany({ where: { targetId: { in: [...studentIds, groupId].filter(Boolean) } } })
  await db.$disconnect()
}
