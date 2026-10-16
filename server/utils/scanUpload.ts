import { createError, getHeader, type H3Event } from 'h3'
export async function readScanUpload(event:H3Event) {
  const contentType=getHeader(event,'content-type')||''
  if(!contentType.startsWith('multipart/form-data;'))throw createError({statusCode:415,statusMessage:'Multipart upload required'})
  const chunks:Buffer[]=[];let size=0
  for await(const chunk of event.node.req){
    const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=buffer.length
    if(size>21*1024*1024)throw createError({statusCode:413,statusMessage:'Scans must total at most 20 MB'})
    chunks.push(buffer)
  }
  const request=new Request('http://localhost',{method:'POST',headers:{'content-type':contentType},body:new Uint8Array(Buffer.concat(chunks))})
  let form:FormData
  try{form=await request.formData()}catch{throw createError({statusCode:400,statusMessage:'Invalid upload'})}
  const files=form.getAll('files').filter((f):f is File=>typeof f!=='string')
  if(!files.length||files.length>20||files.reduce((n,f)=>n+f.size,0)>20*1024*1024)throw createError({statusCode:413,statusMessage:'Upload 1–20 files, at most 20 MB total'})
  return {studentId:String(form.get('studentId')||''),files:await Promise.all(files.map(async f=>({filename:f.name.slice(0,200),data:Buffer.from(await f.arrayBuffer())})))}
}
