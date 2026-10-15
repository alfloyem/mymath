import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { db } from '../server/utils/db'
import { digest } from '../server/utils/security'
const base = process.env.TEST_BASE_URL || 'http://localhost:3000'
const marker = `TEST-${randomBytes(6).toString('hex')}`
let cookie = '', checks = 0
const groupIds: string[] = [], studentIds: string[] = [], examIds: string[] = []
async function request(path: string, method = 'GET', body?: unknown, expected = 200, authCookie = cookie, origin = new URL(base).origin) {
  const response = await fetch(`${base}/api/${path}`, { method, headers: { 'content-type': 'application/json', origin, ...(authCookie ? { cookie: authCookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await response.json()
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`)
  checks++
  return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] || '' }
}
try {
  await request('dashboard', 'GET', undefined, 401, '')
  const login = await request('auth/login', 'POST', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD })
  cookie = login.cookie
  assert.ok(cookie)
  await request('groups', 'POST', { name: 'Blocked' }, 403, cookie, 'https://untrusted.invalid')
  await request('groups', 'POST', { name: '  ' }, 400)
  for (let i = 0; i < 2; i++) { const { data } = await request('groups','POST',{name:`${marker}-${i}`}); groupIds.push(data.id) }
  const { data: dash } = await request('dashboard')
  const ids = dash.groups.map((g: any) => g.id)
  await request('groups/reorder','PUT',{ids:[...ids].reverse()})
  await request('groups/reorder','PUT',{ids:[ids[0],ids[0]]},400)
  await request(`groups/${groupIds[0]}`,'PUT',{name:`${marker}-renamed`})
  const { data: student } = await request('students','POST',{firstName:'Deniz',groupId:groupIds[0]})
  studentIds.push(student.id)
  assert.equal(student.lastName,null)
  assert.equal(student.passwordHash,undefined)
  await request(`groups/${groupIds[0]}`,'DELETE',undefined,409)
  await request('students','POST',{firstName:'Invalid',birthDate:'2026-02-31',groupId:groupIds[0]},400)
  const { data: invite1 } = await request(`students/${student.id}/invite`,'POST')
  const { data: invite2 } = await request(`students/${student.id}/invite`,'POST')
  const token1 = invite1.url.split('/').at(-1), token2 = invite2.url.split('/').at(-1)
  await request(`invite/${token1}`,'GET',undefined,410,'')
  await request(`invite/${token2}`,'GET',undefined,200,'')
  const storedInvite = await db.invitation.findUnique({where:{tokenHash:digest(token2)}})
  assert.ok(storedInvite); assert.notEqual(storedInvite!.tokenHash,token2)
  await db.invitation.update({where:{id:storedInvite!.id},data:{expiresAt:new Date(Date.now()-1000)}})
  await request(`invite/${token2}`,'GET',undefined,410,'')
  await db.invitation.update({where:{id:storedInvite!.id},data:{expiresAt:new Date(Date.now()+86400000)}})
  const newPassword = 'Integration-123!'
  await request(`invite/${token2}`,'POST',{password:newPassword},200,'')
  await request(`invite/${token2}`,'POST',{password:newPassword},200,'')
  assert.equal(await db.passwordRequest.count({where:{studentId:student.id,status:'PENDING'}}),1)
  assert.equal(await db.passwordRequest.count({where:{studentId:student.id,status:'SUPERSEDED'}}),1)
  await request('auth/login','POST',{username:student.username,password:newPassword},401,'')
  assert.equal((await db.student.findUnique({where:{id:student.id}}))!.passwordHash,null)
  const pending = await db.passwordRequest.findFirstOrThrow({where:{studentId:student.id,status:'PENDING'}})
  assert.notEqual(pending.passwordHash,newPassword)
  const {data: dash2} = await request('dashboard')
  assert.equal(dash2.requests.find((r:any)=>r.id===pending.id).passwordHash,undefined)
  await request(`password-requests/${pending.id}`,'POST',{approve:true})
  await request(`password-requests/${pending.id}`,'POST',{approve:true},409)
  const studentLogin = await request('auth/login','POST',{username:student.username,password:newPassword},200,'')
  await request('dashboard','GET',undefined,401,studentLogin.cookie)
  await request('my-results','GET',undefined,200,studentLogin.cookie)
  const {data: exam} = await request('exams','POST',{title:marker,groupId:groupIds[0],month:'2026-10',answerKey:['A','B','C','D'],topics:['Kesir','Kesir','Geometri','Geometri']})
  examIds.push(exam.id)
  await request('results','POST',{examId:exam.id,studentId:student.id,answers:['A']},400)
  const {data: result} = await request('results','POST',{examId:exam.id,studentId:student.id,answers:['A','C',null,'D']})
  assert.equal(result.score,50); assert.equal(result.correct,2); assert.equal(result.blank,1)
  await request(`exams/${exam.id}`,'PUT',{status:'CLOSED'})
  await request('results','POST',{examId:exam.id,studentId:student.id,answers:['A','B','C','D']},409)
  await request('students/transfer','POST',{ids:[student.id],groupId:groupIds[1]})
  const {data: profile} = await request(`students/${student.id}`)
  assert.equal(profile.groupId,groupIds[1]); assert.equal(profile.results.length,1)
  const {data: invite3} = await request(`students/${student.id}/invite`,'POST')
  await request(`invite/${invite3.url.split('/').at(-1)}`,'POST',{password:'Replacement-123!'},200,'')
  const pending2 = await db.passwordRequest.findFirstOrThrow({where:{studentId:student.id,status:'PENDING'}})
  await request('auth/login','POST',{username:student.username,password:newPassword},200,'')
  await request('auth/login','POST',{username:student.username,password:'Replacement-123!'},401,'')
  await request(`password-requests/${pending2.id}`,'POST',{approve:false})
  await request('auth/logout','POST')
  await request('dashboard','GET',undefined,401)
  console.log(`${checks} HTTP kontrolü ve veritabanı doğrulamaları başarılı.`)
} finally {
  await db.result.deleteMany({where:{studentId:{in:studentIds}}})
  await db.exam.deleteMany({where:{id:{in:examIds}}})
  await db.student.deleteMany({where:{id:{in:studentIds}}})
  await db.group.deleteMany({where:{id:{in:groupIds}}})
  await db.auditLog.deleteMany({where:{targetId:{in:[...groupIds,...studentIds,...examIds]}}})
  await db.$disconnect()
}
