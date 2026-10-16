import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile,writeFile,mkdtemp,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { db } from '../server/utils/db'
const base=process.env.TEST_BASE_URL||'http://localhost:3000',origin=new URL(base).origin
const dir=await mkdtemp(join(tmpdir(),'mymath-engine-test-'))
let cookie='',groupId='',studentId='',examId=''
async function json(path:string,body?:unknown,expected=200,authenticated=true){
  const response=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{origin,'content-type':'application/json',cookie:authenticated?cookie:''},body:body===undefined?undefined:JSON.stringify(body)})
  const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return {data,response}
}
try{
  await json('exams/engine',{},401,false)
  const login=await json('auth/login',{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});cookie=login.response.headers.get('set-cookie')!.split(';')[0]!
  groupId=(await json('groups',{name:'ENGINE-TEST-'+Date.now()})).data.id
  studentId=(await json('students',{firstName:'ENGINE-TEST',groupId})).data.id
  const document=JSON.parse(await readFile('examples/exam-engine.json','utf8'))
  await json('exams/engine',{groupId,month:'2026-10',document:{...document,blocks:[{type:'q',t:'Missing key',o:['A','B']}]}},400)
  const created=await json('exams/engine',{groupId,month:'2026-10',document});examId=created.data.id
  const metadata=(await json(`exams/${examId}/engine`)).data
  assert.equal(metadata.questions[0].answer,'C');assert.equal(metadata.pattern.questionPositions.length,3)
  const dashboard=(await json('dashboard')).data
  assert.equal(dashboard.exams.find((e:any)=>e.id===examId).hasEngine,true)
  const reference=join(dir,'answer.pdf'),marked=join(dir,'marked.pdf'),pattern=join(dir,'pattern.json')
  for(const kind of ['paper','answers','key','pattern','source']){
    const response=await fetch(`${base}/api/exams/${examId}/documents?kind=${kind}`,{headers:{cookie}})
    assert.equal(response.status,200);assert.match(response.headers.get('cache-control')||'',/no-store/)
    if(kind==='answers')await writeFile(reference,Buffer.from(await response.arrayBuffer()))
    else if(kind==='paper'||kind==='key')assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0,5).toString(),'%PDF-')
  }
  await writeFile(pattern,JSON.stringify(metadata.pattern))
  const program=`import fitz,json,sys
p=json.load(open(sys.argv[3],encoding='utf-8'))
d=fitz.open(sys.argv[1])
for i,page in enumerate(p['pages']):
 for b in page['bubbles']:
  if (b['number'],b['option']) in [(1,'C'),(2,'B')]:
   r=d[i].rect;d[i].draw_circle((b['x']*r.width,b['y']*r.height),b['radius']*r.width*.9,color=(0,0,0),fill=(0,0,0),overlay=True)
d.save(sys.argv[2])`
  await promisify(execFile)(process.env.OMR_PYTHON||'python',['-c',program,reference,marked,pattern],{windowsHide:true})
  const form=new FormData();form.append('studentId',studentId);form.append('files',new Blob([new Uint8Array(await readFile(marked))],{type:'application/pdf'}),'marked.pdf')
  const scanResponse=await fetch(`${base}/api/exams/${examId}/scan`,{method:'POST',headers:{cookie,origin},body:form})
  const scan=await scanResponse.json();assert.equal(scanResponse.status,200,JSON.stringify(scan));assert.deepEqual(scan.readings.map((r:any)=>r.answer),['C','B'])
  const readings=scan.readings.map((r:any)=>({number:r.number,status:r.status,confirmed:false}))
  await json('results',{examId,studentId,answers:['C','B',null]},400)
  await json('results',{examId,studentId,answers:['C','B',null],manualScores:{3:.5},scanAnalysis:{readings:[{number:1,status:'multiple',confirmed:false}]}},400)
  const result=(await json('results',{examId,studentId,answers:['C','B',null],manualScores:{3:.5},scanAnalysis:{readings}})).data
  assert.equal(result.correct,1);assert.equal(result.wrong,1);assert.equal(result.score,50)
  const profile=(await json(`students/${studentId}`)).data;assert.equal(profile.results[0].score,50);assert.equal(profile.results[0].manualScores['3'],.5)
  const rule=await fetch(`${base}/api/documents/render`,{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:JSON.stringify({mode:'qayda',title:'Rule test',blocks:[{type:'eq',t:'a^2+b^2=c^2'}]})})
  assert.equal(rule.status,200,await rule.clone().text());assert.equal(Buffer.from(await rule.arrayBuffer()).subarray(0,5).toString(),'%PDF-')
  console.log('HTTP engine round trip passed: JSON → A4 PDFs/pattern → marked scan → 50% result/profile; missing keys/manual scores/ambiguous marks rejected; rule PDF generated.')
} finally{
  if(examId)await db.exam.delete({where:{id:examId}})
  if(studentId)await db.student.delete({where:{id:studentId}})
  if(groupId)await db.group.delete({where:{id:groupId}})
  const targets=[examId,studentId,groupId].filter(Boolean)
  if(targets.length)await db.auditLog.deleteMany({where:{targetId:{in:targets}}})
  if(cookie)await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{cookie,origin}})
  await db.$disconnect();await rm(dir,{recursive:true,force:true})
}
