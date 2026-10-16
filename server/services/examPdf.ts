/// <reference lib="dom" />
import { chromium, type Page } from 'playwright-core'
import QRCode from 'qrcode'
import { PDFDocument } from 'pdf-lib'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import type { ExamDocument, Question } from '../../shared/examDocument'

export type Pattern = { version:1; examId:string; fingerprint:string; questions:Question[]; questionPositions:{number:number;page:number;x:number;y:number;width:number;height:number}[]; pages:{code:string;width:number;height:number;markers:{x:number;y:number}[];bubbles:{number:number;option:string;x:number;y:number;radius:number}[];boxes:{number:number;x:number;y:number;width:number;height:number}[]}[] }
export type EngineSources = { document:string; answers:string; mathjax:string }
export function chromiumPath() {
  const paths=[process.env.PDF_CHROMIUM_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome']
  const path=paths.find(p=>p&&existsSync(p))
  if(!path)throw new Error('PDF_CHROMIUM_PATH must point to an installed Chromium executable')
  return path
}
function source(html:string, documentEngine:boolean) {
  const match=html.match(/<script>([\s\S]*?)<\/script>/)
  if(!match)throw new Error('Invalid engine source')
  let script=match[1]!.split(documentEngine?'/* ===== Redaktor ===== */':'/* ===== Redaktor (blok başına bir sətir) ===== */')[0]!
  if(documentEngine)script=script.replace(/const mjReady=new Promise[^\n]+/, 'const mjReady=Promise.resolve();')
  return {html:html.replace(/<script>[\s\S]*?<\/script>/g,''),script}
}
async function prepare(page:Page,html:string,documentEngine:boolean,mathjax:string) {
  const engine=source(html,documentEngine)
  await page.route('**/*',route=>route.abort())
  await page.setContent(engine.html)
  // esbuild/tsx may preserve callback names with this helper in serialized evaluate functions.
  await page.evaluate('globalThis.__name = (fn) => fn')
  await page.addScriptTag({content:engine.script})
  if(documentEngine){await page.addScriptTag({content:mathjax});await page.evaluate(async()=>{await (window as any).MathJax.startup.promise})}
  await page.addStyleTag({content:'.editor{display:none!important}html,body{margin:0!important;background:white!important} .page{width:210mm!important;height:297mm!important;margin:0!important;zoom:1!important}.page:last-child{break-after:auto!important}'})
  await page.emulateMedia({media:'screen',colorScheme:'light'})
}
export function makeAnswerDocument(title:string,questions:Question[]) {
  const pages:any[]=[]
  let y=[118,118],column=0
  const newPage=()=>{pages.push({title,blocks:[]});y=[118,118];column=0}
  newPage()
  for(const q of [...questions.filter(q=>q.kind==='choice'),...questions.filter(q=>q.kind==='manual')]){
    const height=q.kind==='choice'?22:382
    if(y[column]!+height>1040){column++;if(column>1)newPage()}
    if(y[column]!+height>1040){newPage()}
    const block=q.kind==='choice'?{type:'choices',x:48+column*356,y:y[column],count:1,start:q.number,options:q.options.join('')}:{type:'boxes',x:48+column*356,y:y[column],numbers:[q.number],w:330,h:360}
    pages.at(-1).blocks.push(block);y[column]!+=height
  }
  return {startAt:1,pages}
}
async function exactA4(bytes:Uint8Array){
  const pdf=await PDFDocument.load(bytes)
  for(const page of pdf.getPages())page.setSize(210/25.4*72,297/25.4*72)
  return Buffer.from(await pdf.save())
}
export async function renderExamBundle(examId:string,doc:ExamDocument,questions:Question[],sources:EngineSources) {
  const fingerprint=createHash('sha256').update(JSON.stringify(doc)).update(sources.document).update(sources.answers).digest('hex').slice(0,20)
  const browser=await chromium.launch({headless:true,executablePath:chromiumPath(),timeout:20000})
  const deadline=setTimeout(()=>{void browser.close().catch(()=>{})},60000)
  deadline.unref()
  const context=await browser.newContext({viewport:{width:1000,height:1200},deviceScaleFactor:1,javaScriptEnabled:true,serviceWorkers:'block'})
  context.setDefaultTimeout(30000)
  try {
    const page=await context.newPage()
    await prepare(page,sources.document,true,sources.mathjax)
    // Answers never enter the printable document.
    const printable=JSON.parse(JSON.stringify(doc))
    for(const block of printable.blocks){delete block.answer;delete block.topic}
    await page.evaluate(async doc=>{await (window as any).render(doc)},printable)
    const state=await page.evaluate(()=>({count:document.querySelectorAll('.page').length,status:document.querySelector('#status')?.textContent||'',mathErrors:document.querySelectorAll('mjx-merror').length}))
    if(state.count>20||state.count<1||state.mathErrors||/hündürdür|MathJax|naməlum/.test(state.status))throw new Error(`Document layout failed: ${state.status}`)
    const questionPositions=await page.evaluate(()=>Array.from(document.querySelectorAll('.page')).flatMap((page,index)=>{
      const pageRect=page.getBoundingClientRect()
      return Array.from(page.querySelectorAll('.q')).map(q=>{const r=q.getBoundingClientRect();return {number:Number(q.querySelector('.qn')?.textContent?.replace('.','')),page:index,x:(r.x-pageRect.x)/pageRect.width,y:(r.y-pageRect.y)/pageRect.height,width:r.width/pageRect.width,height:r.height/pageRect.height}})
    }))
    if(questionPositions.length!==questions.length)throw new Error('Question positions do not match the answer key')
    await page.emulateMedia({media:'print'})
    const paperPdf=await exactA4(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,scale:1,margin:{top:0,right:0,bottom:0,left:0}}))
    await page.close()
    if(doc.mode==='qayda')return {paperPdf,answerPdf:Buffer.alloc(0),keyPdf:Buffer.alloc(0),pattern:{version:1,examId,fingerprint,questions,questionPositions,pages:[]} as Pattern}
    const answers=await context.newPage()
    await prepare(answers,sources.answers,false,'')
    await answers.evaluate(doc=>(window as any).render(doc),makeAnswerDocument(doc.title,questions))
    const pattern:Pattern={version:1,examId,fingerprint,questions,questionPositions,pages:[]}
    const count=await answers.locator('.page').count()
    if(count>20)throw new Error('Answer sheet exceeds 20 pages')
    await answers.addStyleTag({content:'.page h1{left:50px;right:150px;top:40px;font-size:16px}.fiducial{position:absolute;width:10px;height:10px;background:#000}.sheet-code{position:absolute;right:32px;top:20px;width:80px;height:80px}.sheet-footer{position:absolute;left:48px;bottom:22px;font:9px Arial;color:#222}.b{color:#e8453c}'})
    for(let i=0;i<count;i++){
      const code=`mymath:${examId}:${i}:${fingerprint}`
      const qr=await QRCode.toDataURL(code,{width:240,margin:2,errorCorrectionLevel:'M'})
      const positions=await answers.evaluate(({index,qr,code})=>{
        const root=document.querySelectorAll<HTMLElement>('.page')[index]!
        for(const [left,top] of [['12px','12px'],['calc(100% - 22px)','12px'],['12px','calc(100% - 22px)'],['calc(100% - 22px)','calc(100% - 22px)']]){
          const marker=document.createElement('div');marker.className='fiducial';marker.style.left=left!;marker.style.top=top!;root.append(marker)
        }
        const image=document.createElement('img');image.src=qr;image.className='sheet-code';root.append(image)
        const footer=document.createElement('div');footer.className='sheet-footer';footer.textContent=`${index+1} · ${code.split(':').at(-1)}`;root.append(footer)
        const rect=root.getBoundingClientRect()
        const center=(el:Element)=>{const r=el.getBoundingClientRect();return {x:(r.x+r.width/2-rect.x)/rect.width,y:(r.y+r.height/2-rect.y)/rect.height}}
        const bubbles=Array.from(root.querySelectorAll('.mc')).flatMap(mc=>{
          const numbers=Array.from(mc.querySelectorAll('.num')).map(n=>Number(n.textContent))
          return Array.from(mc.querySelectorAll('.rows .row')).flatMap((row,j)=>Array.from(row.querySelectorAll('.b')).map(b=>({...center(b),number:numbers[j]!,option:b.textContent!,radius:b.getBoundingClientRect().width/2/rect.width})))
        })
        const boxes=Array.from(root.querySelectorAll('.box')).map(b=>{const r=b.getBoundingClientRect();return {number:Number(b.textContent),x:(r.x-rect.x)/rect.width,y:(r.y-rect.y)/rect.height,width:r.width/rect.width,height:r.height/rect.height}})
        return {width:rect.width,height:rect.height,markers:Array.from(root.querySelectorAll('.fiducial')).map(center),bubbles,boxes}
      },{index:i,qr,code})
      pattern.pages.push({code,...positions})
    }
    await answers.evaluate(async()=>{await Promise.all(Array.from(document.images).map(img=>img.decode()))})
    const answerPdf=await exactA4(await answers.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,scale:1}))
    await answers.evaluate(questions=>{
      const key=new Map(questions.map(q=>[q.number,q.answer]))
      for(const mc of document.querySelectorAll('.mc')){
        const n=Number(mc.querySelector('.num')?.textContent)
        for(const b of mc.querySelectorAll<HTMLElement>('.b'))if(b.textContent===key.get(n)){b.style.background='#111';b.style.color='#fff'}
      }
    },questions)
    const keyPdf=await exactA4(await answers.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,scale:1}))
    return {paperPdf,answerPdf,keyPdf,pattern}
  } finally {clearTimeout(deadline);await context.close().catch(()=>{});await browser.close().catch(()=>{})}
}
