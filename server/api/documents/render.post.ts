import { defineEventHandler,createError,setHeader } from 'h3'
import { requireAdmin } from '../../utils/security'
import { readBoundedJson } from '../../utils/body'
import { engineSources } from '../../utils/engineSources'
import { parseExamDocument } from '../../../shared/examDocument'
import { renderExamBundle } from '../../services/examPdf'
import { withEngineSlot } from '../../services/engineLimit'
export default defineEventHandler(async event=>{
  await requireAdmin(event)
  let parsed:ReturnType<typeof parseExamDocument>
  try{parsed=parseExamDocument(await readBoundedJson(event.node.req))}catch(error:any){throw createError({statusCode:error.statusCode||400,statusMessage:'Invalid document',data:{message:error.message}})}
  if(parsed.document.mode!=='qayda')throw createError({statusCode:400,statusMessage:'Rule sheet mode required'})
  return await withEngineSlot(async()=>{
    const {paperPdf}=await renderExamBundle('rules',parsed.document,[],await engineSources())
    setHeader(event,'Content-Type','application/pdf');setHeader(event,'Content-Disposition','attachment; filename="rules.pdf"')
    return paperPdf
  })
})
