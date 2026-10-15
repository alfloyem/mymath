import { z, ZodError } from 'zod'
import { createError, defineEventHandler, getRouterParam, getHeader, readBody, getCookie, deleteCookie, getQuery, getRequestURL } from 'h3'
import { db } from '../utils/db'
import { createSession, currentSession, digest, hashPassword, randomToken, rateLimit, requireAdmin, verifyPassword } from '../utils/security'
import { grade } from '../services/grading'

const password = z.string().min(8, 'Şifre en az 8 karakter olmalıdır.').max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Şifre UTF-8 olarak en fazla 72 bayt olabilir.')
const studentFields = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(v); return !isNaN(+d) && d.toISOString().slice(0, 10) === v && d <= new Date() }, 'Geçerli bir doğum tarihi girin.').nullable().optional(),
  groupId: z.string().min(1), password: password.optional()
})
const answerKeySchema = z.array(z.enum(['A', 'B', 'C', 'D', 'E'])).min(1).max(200)
const answersSchema = z.array(z.enum(['A', 'B', 'C', 'D', 'E']).nullable()).max(200)
const publicStudent = { id: true, firstName: true, lastName: true, phone: true, birthDate: true, groupId: true, createdAt: true }
const notFound = () => createError({ statusCode: 404, statusMessage: 'Kayıt bulunamadı.' })

export default defineEventHandler(async event => {
  const path = (getRouterParam(event, 'path') || '').split('/').filter(Boolean)
  const method = event.method
  const body = async () => {
    const length = Number(getHeader(event, 'content-length') || 0)
    if (length > 256000) throw createError({ statusCode: 413, statusMessage: 'Dosya en fazla 256 KB olabilir.' })
    const value = await readBody(event)
    if (JSON.stringify(value ?? '').length > 256000) throw createError({ statusCode: 413 })
    return value
  }
  try {
    if (path.join('/') === 'auth/me' && method === 'GET') {
      const session = await currentSession(event)
      return session?.admin ? { role: 'ADMIN', name: session.admin.username } : session?.student ? { role: 'STUDENT', id: session.student.id, name: session.student.firstName } : null
    }
    if (path.join('/') === 'auth/login' && method === 'POST') {
      rateLimit(event, 'login')
      const input = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(72), role: z.enum(['ADMIN', 'STUDENT']).default('ADMIN') }).parse(await body())
      const user = input.role === 'ADMIN' ? await db.admin.findUnique({ where: { username: input.username } }) : await db.student.findUnique({ where: { id: input.username } })
      // Dummy bcrypt hash keeps unknown-user verification comparable in cost.
      const valid = await verifyPassword(input.password, user?.passwordHash || '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxTqR0LUDfmHaYsEIz6wKNGO9qG')
      if (!user?.passwordHash || !valid) throw createError({ statusCode: 401, statusMessage: 'Giriş bilgileri geçersiz veya şifre henüz onaylanmadı.' })
      await createSession(event, input.role === 'ADMIN' ? { adminId: user.id } : { studentId: user.id })
      return { ok: true }
    }
    if (path.join('/') === 'auth/logout' && method === 'POST') {
      const token = getCookie(event, 'mymath_session')
      if (token) await db.session.deleteMany({ where: { tokenHash: digest(token) } })
      deleteCookie(event, 'mymath_session', { path: '/' })
      return { ok: true }
    }
    if (path[0] === 'invite' && path[1]) {
      rateLimit(event, 'invite', 40)
      const invitation = await db.invitation.findUnique({ where: { tokenHash: digest(path[1]) }, include: { student: true } })
      if (!invitation || invitation.revokedAt || invitation.expiresAt < new Date()) throw createError({ statusCode: 410, statusMessage: 'Bağlantı iptal edilmiş veya süresi dolmuş. Yöneticinizden yeni bağlantı isteyin.' })
      if (method === 'GET') return { firstName: invitation.student.firstName, hasPassword: !!invitation.student.passwordHash, studentId: invitation.studentId }
      if (method === 'POST') {
        const input = z.object({ password }).parse(await body())
        const passwordHash = await hashPassword(input.password)
        await db.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${invitation.studentId} FOR UPDATE`
          const valid = await tx.invitation.findFirst({ where: { id: invitation.id, revokedAt: null, expiresAt: { gt: new Date() } } })
          if (!valid) throw createError({ statusCode: 409, statusMessage: 'Bu bağlantı artık geçerli değil.' })
          await tx.passwordRequest.updateMany({ where: { studentId: invitation.studentId, status: 'PENDING' }, data: { status: 'SUPERSEDED', reviewedAt: new Date() } })
          await tx.passwordRequest.create({ data: { studentId: invitation.studentId, passwordHash } })
        })
        return { ok: true, message: 'Şifre talebiniz yönetici onayına gönderildi.' }
      }
    }
    if (path[0] === 'my-results' && method === 'GET') {
      const session = await currentSession(event)
      if (!session?.studentId) throw createError({ statusCode: 401 })
      return await db.result.findMany({ where: { studentId: session.studentId }, include: { exam: { select: { title: true, month: true } } }, orderBy: { createdAt: 'desc' } })
    }
    const adminId = await requireAdmin(event)
    const audit = (action: string, targetId: string) => ({ actorId: adminId, action, targetId })
    if (path[0] === 'dashboard' && method === 'GET') {
      const [groups, requests, exams] = await Promise.all([
        db.group.findMany({ orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], include: { _count: { select: { students: true, exams: true } } } }),
        db.passwordRequest.findMany({ where: { status: 'PENDING' }, select: { id: true, createdAt: true, student: { select: publicStudent } }, orderBy: { createdAt: 'desc' } }),
        db.exam.findMany({ include: { group: { select: { name: true } }, _count: { select: { results: true } } }, orderBy: [{ month: 'desc' }, { createdAt: 'desc' }] })
      ])
      return { groups, requests, exams }
    }
    if (path[0] === 'groups') {
      if (method === 'POST' && !path[1]) {
        const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(await body())
        const last = await db.group.aggregate({ _max: { position: true } })
        return await db.group.create({ data: { name, position: (last._max.position ?? -1) + 1 } })
      }
      if (path[1] === 'reorder' && method === 'PUT') {
        const { ids } = z.object({ ids: z.array(z.string()).max(1000) }).parse(await body())
        const groups = await db.group.findMany({ select: { id: true } })
        if (new Set(ids).size !== ids.length || groups.length !== ids.length || groups.some(g => !ids.includes(g.id))) throw createError({ statusCode: 400, statusMessage: 'Tüm gruplar tam olarak bir kez belirtilmelidir.' })
        await db.$transaction(ids.map((id, position) => db.group.update({ where: { id }, data: { position } })))
        return { ok: true }
      }
      if (path[1] && method === 'PUT') {
        const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(await body())
        return await db.group.update({ where: { id: path[1] }, data: { name } })
      }
      if (path[1] && method === 'DELETE') {
        await db.$transaction([db.group.delete({ where: { id: path[1] } }), db.auditLog.create({ data: audit('GROUP_DELETE', path[1]) })])
        return { ok: true }
      }
    }
    if (path[0] === 'students') {
      if (method === 'GET' && !path[1]) {
        const { groupId } = getQuery(event)
        return await db.student.findMany({ where: typeof groupId === 'string' ? { groupId } : {}, select: { ...publicStudent, group: { select: { name: true } }, _count: { select: { results: true } } }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] })
      }
      if (method === 'GET' && path[1]) {
        const student = await db.student.findUnique({ where: { id: path[1] }, select: { ...publicStudent, group: true, results: { include: { exam: true }, orderBy: { exam: { month: 'desc' } } } } })
        if (!student) throw notFound()
        return student
      }
      if ((method === 'POST' && !path[1]) || (method === 'PUT' && path[1] && !path[2])) {
        const input = studentFields.parse(await body())
        const { password: newPassword, birthDate, ...rest } = input
        const data = { ...rest, birthDate: birthDate ? new Date(birthDate) : null, ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}) }
        return await db.$transaction(async tx => {
          const student = method === 'POST' ? await tx.student.create({ data, select: publicStudent }) : await tx.student.update({ where: { id: path[1] }, data, select: publicStudent })
          if (newPassword) {
            await tx.session.deleteMany({ where: { studentId: student.id } })
            await tx.passwordRequest.updateMany({ where: { studentId: student.id, status: 'PENDING' }, data: { status: 'SUPERSEDED', reviewedAt: new Date() } })
            await tx.invitation.updateMany({ where: { studentId: student.id, revokedAt: null }, data: { revokedAt: new Date() } })
          }
          await tx.auditLog.create({ data: audit(method === 'POST' ? 'STUDENT_CREATE' : 'STUDENT_UPDATE', student.id) })
          return student
        })
      }
      if (path[1] === 'transfer' && method === 'POST') {
        const { ids, groupId } = z.object({ ids: z.array(z.string()).min(1).max(500), groupId: z.string() }).parse(await body())
        if (!(await db.group.findUnique({ where: { id: groupId } }))) throw notFound()
        return await db.$transaction(async tx => {
          if (await tx.student.count({ where: { id: { in: ids } } }) !== new Set(ids).size) throw notFound()
          const result = await tx.student.updateMany({ where: { id: { in: ids } }, data: { groupId } })
          await tx.auditLog.create({ data: audit('STUDENTS_TRANSFER', groupId) })
          return result
        })
      }
      if (path[1] && path[2] === 'invite' && method === 'POST') {
        const studentId = path[1]
        if (!(await db.student.findUnique({ where: { id: studentId } }))) throw notFound()
        const token = randomToken()
        await db.$transaction(async tx => {
          await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${studentId} FOR UPDATE`
          await tx.invitation.updateMany({ where: { studentId, revokedAt: null }, data: { revokedAt: new Date() } })
          await tx.invitation.create({ data: { studentId, tokenHash: digest(token), expiresAt: new Date(Date.now() + 30 * 86400000) } })
        })
        const appOrigin = process.env.NODE_ENV === 'development' ? getRequestURL(event).origin : new URL(process.env.APP_URL || getRequestURL(event).origin).origin
        return { url: `${appOrigin}/davet/${token}` }
      }
      if (path[1] && method === 'DELETE') {
        await db.$transaction([db.student.delete({ where: { id: path[1] } }), db.auditLog.create({ data: audit('STUDENT_DELETE', path[1]) })])
        return { ok: true }
      }
    }
    if (path[0] === 'password-requests' && path[1] && method === 'POST') {
      const { approve } = z.object({ approve: z.boolean() }).parse(await body())
      return await db.$transaction(async tx => {
        const request = await tx.passwordRequest.findUnique({ where: { id: path[1] } })
        if (!request || request.status !== 'PENDING') throw createError({ statusCode: 409, statusMessage: 'Talep zaten işlenmiş.' })
        await tx.$queryRaw`SELECT id FROM "Student" WHERE id = ${request.studentId} FOR UPDATE`
        const claimed = await tx.passwordRequest.updateMany({ where: { id: request.id, status: 'PENDING' }, data: { status: approve ? 'APPROVED' : 'REJECTED', reviewedAt: new Date() } })
        if (claimed.count !== 1) throw createError({ statusCode: 409 })
        if (approve) {
          await tx.student.update({ where: { id: request.studentId }, data: { passwordHash: request.passwordHash } })
          await tx.session.deleteMany({ where: { studentId: request.studentId } })
        }
        await tx.auditLog.create({ data: audit(approve ? 'PASSWORD_APPROVE' : 'PASSWORD_REJECT', request.studentId) })
        return { ok: true }
      })
    }
    if (path[0] === 'exams') {
      if (method === 'POST' && !path[1]) {
        const input = z.object({ title: z.string().trim().min(1).max(120), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), groupId: z.string(), answerKey: answerKeySchema, topics: z.array(z.string().trim().max(80)).max(200).default([]) }).parse(await body())
        if (input.topics.length && input.topics.length !== input.answerKey.length) throw createError({ statusCode: 400, statusMessage: 'Her soru için bir konu belirtin veya konuları boş bırakın.' })
        return await db.exam.create({ data: input })
      }
      if (path[1] && method === 'PUT') {
        const { status } = z.object({ status: z.enum(['OPEN', 'CLOSED']) }).parse(await body())
        return await db.exam.update({ where: { id: path[1] }, data: { status } })
      }
      if (path[1] && method === 'DELETE') {
        await db.$transaction([db.exam.delete({ where: { id: path[1] } }), db.auditLog.create({ data: audit('EXAM_DELETE', path[1]) })])
        return { ok: true }
      }
    }
    if (path[0] === 'results' && method === 'POST') {
      const input = z.object({ examId: z.string(), studentId: z.string(), answers: answersSchema, originalName: z.string().max(200).optional() }).parse(await body())
      return await db.$transaction(async tx => {
        const [exam, student] = await Promise.all([tx.exam.findUnique({ where: { id: input.examId } }), tx.student.findUnique({ where: { id: input.studentId } })])
        if (!exam || !student) throw notFound()
        if (exam.status !== 'OPEN') throw createError({ statusCode: 409, statusMessage: 'Bu sınav kapalı.' })
        const previous = await tx.result.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: student.id } } })
        if (exam.groupId !== student.groupId && !previous) throw createError({ statusCode: 400, statusMessage: 'Öğrenci bu sınavın grubunda değil.' })
        const analysis = grade(exam.answerKey as string[], input.answers, exam.topics as string[])
        const data = { ...input, ...analysis }
        const result = await tx.result.upsert({ where: { examId_studentId: { examId: exam.id, studentId: student.id } }, create: data, update: data })
        await tx.auditLog.create({ data: audit('RESULT_SAVE', result.id) })
        return result
      })
    }
    throw notFound()
  } catch (error: any) {
    if (error instanceof ZodError) throw createError({ statusCode: 400, statusMessage: 'Alanları kontrol edin.', data: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) })
    if (error.code === 'P2025') throw notFound()
    if (error.code === 'P2003') throw createError({ statusCode: 409, statusMessage: 'İlişkili kayıtlar var. Önce öğrencileri taşıyın ve sınavları kaldırın.' })
    if (error.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Bu kayıt zaten var.' })
    if (error.message?.startsWith('Cevap') || error.message?.startsWith('Yalnız')) throw createError({ statusCode: 400, statusMessage: error.message })
    throw error
  }
})
