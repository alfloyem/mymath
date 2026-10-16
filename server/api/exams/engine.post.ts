import { randomUUID } from 'node:crypto'
import { defineEventHandler,createError } from 'h3'
import { z } from 'zod'
import { requireAdmin } from '../../utils/security'
import { readBoundedJson } from '../../utils/body'
import { engineSources } from '../../utils/engineSources'
import { db } from '../../utils/db'
import { parseExamDocument } from '../../../shared/examDocument'
import { renderExamBundle } from '../../services/examPdf'
import { withEngineSlot } from '../../services/engineLimit'
export default defineEventHandler(async event=>{
  const adminId=await requireAdmin(event)
  let input: {groupId:string;month:string;document:unknown}
  let parsed:ReturnType<typeof parseExamDocument>
  try{input=z.object({groupId:z.string().min(1),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),document:z.unknown()}).parse(await readBoundedJson(event.node.req));parsed=parseExamDocument(input.document)}
  catch(error:any){if(error.statusCode)throw error;throw createError({statusCode:400,statusMessage:'Invalid exam document',data:{message:error.message}})}
  if(parsed.document.mode!=='imtahan')throw createError({statusCode:400,statusMessage:'Exam mode required'})
  if(!await db.group.findUnique({where:{id:input.groupId},select:{id:true}}))throw createError({statusCode:404})
  const id=randomUUID()
  return await withEngineSlot(async()=>{
    const bundle=await renderExamBundle(id,parsed.document,parsed.questions,await engineSources())
    await db.$transaction(async tx=>{
      await tx.exam.create({data:{id,title:parsed.document.title,month:input.month,groupId:input.groupId,answerKey:parsed.questions.map(q=>q.answer),topics:parsed.questions.map(q=>q.topic)}})
      await tx.examBundle.create({data:{examId:id,document:parsed.document,questions:parsed.questions,pattern:bundle.pattern,paperPdf:new Uint8Array(bundle.paperPdf),answerPdf:new Uint8Array(bundle.answerPdf),keyPdf:new Uint8Array(bundle.keyPdf)}})
      await tx.auditLog.create({data:{actorId:adminId,action:'EXAM_GENERATE',targetId:id}})
    })
    return {id,title:parsed.document.title,questionCount:parsed.questions.length}
  })
})
