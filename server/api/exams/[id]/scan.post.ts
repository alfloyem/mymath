import { useStorage } from 'nitropack/runtime'
import { defineEventHandler,getRouterParam,createError } from 'h3'
import { db } from '../../../utils/db'
import { requireAdmin } from '../../../utils/security'
import { readScanUpload } from '../../../utils/scanUpload'
import { scanExam } from '../../../services/scanExam'
import type { Pattern } from '../../../services/examPdf'
import { withEngineSlot } from '../../../services/engineLimit'
export default defineEventHandler(async event=>{
  await requireAdmin(event)
  const id=getRouterParam(event,'id')!
  const exam=await db.exam.findUnique({where:{id},select:{groupId:true,status:true,bundle:{select:{pattern:true,answerPdf:true}}}})
  if(!exam?.bundle)throw createError({statusCode:404})
  if(exam.status!=='OPEN')throw createError({statusCode:409,statusMessage:'Bu sınav kapalı.'})
  return await withEngineSlot(async()=>{
    const {studentId,files}=await readScanUpload(event)
    const student=await db.student.findUnique({where:{id:studentId},select:{groupId:true}})
    const previous=await db.result.findUnique({where:{examId_studentId:{examId:id,studentId}},select:{id:true}})
    if(!student||(student.groupId!==exam.groupId&&!previous))throw createError({statusCode:400,statusMessage:'Öğrenci bu sınavın grubunda değil.'})
    const worker=await useStorage('assets:engines').getItemRaw('scan.py')
    if(!worker)throw new Error('Missing OMR worker')
    return await scanExam(files,exam.bundle!.answerPdf,exam.bundle!.pattern as unknown as Pattern,typeof worker==='string'?worker:Buffer.from(worker).toString('utf8'))
  })
})
