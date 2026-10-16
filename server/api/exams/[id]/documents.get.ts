import { defineEventHandler,getRouterParam,getQuery,setHeader,createError } from 'h3'
import { requireAdmin } from '../../../utils/security'
import { db } from '../../../utils/db'
export default defineEventHandler(async event=>{
  await requireAdmin(event)
  const id=getRouterParam(event,'id')!,kind=String(getQuery(event).kind||'paper')
  if(!['paper','answers','key','pattern','source'].includes(kind))throw createError({statusCode:400})
  const select={...(kind==='paper'?{paperPdf:true}:kind==='answers'?{answerPdf:true}:kind==='key'?{keyPdf:true}:kind==='pattern'?{pattern:true}:{document:true})}
  const bundle=await db.examBundle.findUnique({where:{examId:id},select}) as {pattern?:unknown;document?:unknown;paperPdf?:Uint8Array;answerPdf?:Uint8Array;keyPdf?:Uint8Array}|null
  if(!bundle)throw createError({statusCode:404})
  const json=kind==='pattern'||kind==='source'
  setHeader(event,'Content-Type',json?'application/json; charset=utf-8':'application/pdf')
  setHeader(event,'Content-Disposition',`attachment; filename="exam-${id.replace(/[^a-zA-Z0-9-]/g,'')}-${kind}.${json?'json':'pdf'}"`)
  return json?JSON.stringify(kind==='pattern'?bundle.pattern:bundle.document):Buffer.from((kind==='paper'?bundle.paperPdf:kind==='answers'?bundle.answerPdf:bundle.keyPdf)!)
})
