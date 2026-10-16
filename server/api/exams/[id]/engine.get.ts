import { defineEventHandler,getRouterParam,createError } from 'h3'
import { db } from '../../../utils/db'
import { requireAdmin } from '../../../utils/security'
export default defineEventHandler(async event=>{
  await requireAdmin(event)
  const bundle=await db.examBundle.findUnique({where:{examId:getRouterParam(event,'id')!},select:{questions:true,pattern:true}})
  if(!bundle)throw createError({statusCode:404})
  return bundle
})
