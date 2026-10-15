import 'dotenv/config'
import { PrismaClient } from '../server/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
try {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.length < 12 || password === 'SET_A_STRONG_PASSWORD') throw new Error('ADMIN_PASSWORD en az 12 karakter olmalıdır.')
  if (await db.admin.findUnique({ where: { username } })) console.log('Admin zaten var; şifresi değiştirilmedi.')
  else if (await db.admin.count()) throw new Error('Bu sistemde yalnız bir ana admin olabilir.')
  else { await db.admin.create({ data: { username, passwordHash: await hash(password, 12) } }); console.log('Ana admin oluşturuldu.') }
} finally { await db.$disconnect() }
