import { z } from 'zod'

const text = z.string().max(10000)
const dimension = z.number().finite().min(0).max(1200)
const figure = z.object({ type: z.literal('fig').optional(), w: dimension.optional(), h: dimension.optional(), o: z.tuple([z.number().finite(), z.number().finite(), z.number().positive().max(1000)]).optional(), items: z.array(z.array(z.unknown()).max(8)).max(300) })
const block: z.ZodType<any> = z.lazy(() => z.object({
  type: z.enum(['h', 'p', 'note', 'ps', 'eq', 'list', 'row', 'gap', 'pb', 'fig', 'q']), t: text.optional(),
  l: z.number().int().min(1).max(2).optional(), m: text.optional(), n: z.union([z.boolean(), z.number().int().min(0).max(200)]).optional(),
  items: z.array(z.unknown()).max(300).optional(), w: z.union([dimension, z.array(z.number().positive().max(10)).max(4)]).optional(), h: dimension.optional(),
  o: z.union([z.array(text).min(2).max(5), z.tuple([z.number().finite(), z.number().finite(), z.number().positive().max(1000)])]).optional(),
  fig: figure.optional(), space: dimension.optional(), oc: z.number().int().min(1).max(5).optional(), start: z.number().int().min(1).max(200).optional(),
  answer: z.enum(['A', 'B', 'C', 'D', 'E']).optional(), topic: z.string().trim().max(80).optional()
}))
export const documentSchema = z.object({
  mode: z.enum(['imtahan', 'qayda']), title: z.string().trim().min(1).max(120), info: text.optional(), watermark: z.string().max(120).optional(),
  startAt: z.literal(1).optional(), cols: z.number().int().min(1).max(3).optional(), letters: z.string().regex(/^(ABCDE|abcde)$/).optional(),
  space: dimension.optional(), perCol: z.number().int().min(1).max(30).optional(), fs: z.number().min(9).max(24).optional(), blocks: z.array(block).min(1).max(400)
})
export type Question = { number: number; kind: 'choice' | 'manual'; answer: string | null; options: string[]; topic: string }
export type ExamDocument = z.infer<typeof documentSchema>
export function parseExamDocument(input: unknown) {
  const document = documentSchema.parse(input)
  const questions: Question[] = []
  const numeric = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 10000
  function checkFigure(f: any) {
    figure.parse(f)
    for (const [kind, ...args] of f.items || []) {
      if (kind === 'plot') {
        if (typeof args[0] !== 'string' || args[0].length > 200 || !/^[\w+\-*/^().\s]+$/.test(args[0]) || (args[0].match(/[a-z_]+/gi) || []).some((x:string)=>!['x','sqrt','abs','sin','cos','tan','exp','ln','pi'].includes(x)) || !args.slice(1).every(numeric) || args.length !== 3) throw new Error('Invalid figure plot')
      } else if (kind === 'poly') {
        if (!Array.isArray(args[0]) || args[0].length > 100 || !args[0].every((p:any)=>Array.isArray(p)&&p.length===2&&p.every(numeric)) || (args[1] !== undefined && typeof args[1] !== 'boolean')) throw new Error('Invalid polygon')
      } else if (kind === 'text' || kind === 'pt') {
        if (args.length !== 3 || !args.slice(0,2).every(numeric) || typeof args[2] !== 'string' || args[2].length > 100) throw new Error('Invalid figure label')
      } else {
        const counts:Record<string,number[]> = {line:[4],arc:[5],circle:[3],right:[3,4],axes:[4]}
        if (!counts[String(kind)]?.includes(args.length) || !args.every(numeric)) throw new Error('Invalid figure command')
      }
    }
  }
  function walk(blocks: any[], depth = 0) {
    if (depth > 3) throw new Error('Document nesting limit exceeded')
    for (const b of blocks) {
      if (b.type === 'row') { if (!Array.isArray(b.items)) throw new Error('Invalid row'); b.items = b.items.map((x:any)=>block.parse(x)); walk(b.items,depth+1) }
      if (b.type === 'list' && (!Array.isArray(b.items) || !b.items.every((x:any)=>typeof x==='string'&&x.length<=10000))) throw new Error('Invalid list')
      if (b.type === 'fig') checkFigure(b)
      if (b.fig) checkFigure(b.fig)
      if (b.type === 'q') {
        if (depth || document.mode !== 'imtahan' || !b.t || b.start !== undefined) throw new Error('Questions must be top-level and consecutively numbered')
        const options = b.o || []
        if (options.length && (!options.every((x:any)=>typeof x==='string') || options.length<2 || options.length>5)) throw new Error('Invalid choices')
        if (options.length && (!b.answer || 'ABCDE'.indexOf(b.answer)>=options.length)) throw new Error('Each test question needs a valid answer')
        if (!options.length && b.answer) throw new Error('Open questions are manually scored')
        questions.push({number:questions.length+1,kind:options.length?'choice':'manual',answer:b.answer||null,options:Array.from('ABCDE').slice(0,options.length),topic:b.topic||'Ümumi'})
      }
    }
  }
  walk(document.blocks)
  if (document.mode==='imtahan' && (!questions.length || questions.length>200)) throw new Error('Exam requires 1–200 questions')
  return {document,questions}
}

export function gradeDocument(questions: Question[], answers: (string|null)[], manualScores: Record<string,number>) {
  if (answers.length!==questions.length) throw new Error('Answer count mismatch')
  let correct=0,wrong=0,blank=0,earned=0
  const topicAnalysis:Record<string,{correct:number;wrong:number;blank:number;earned:number;total:number}>=Object.create(null)
  const manualNumbers = new Set(questions.filter(q=>q.kind==='manual').map(q=>String(q.number)))
  if (Object.keys(manualScores).some(n=>!manualNumbers.has(n))) throw new Error('Invalid manual question')
  questions.forEach((q,i)=>{
    const stats=topicAnalysis[q.topic]??={correct:0,wrong:0,blank:0,earned:0,total:0};stats.total++
    if(q.kind==='manual') {
      if(answers[i]!==null)throw new Error('Open questions use manual scores, not choice answers')
      const value=manualScores[String(q.number)]
      if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1) throw new Error('Every open question requires a score between 0 and 1')
      earned+=value;stats.earned+=value
    } else {
      if(answers[i]!==null&&!q.options.includes(answers[i]!)) throw new Error('Invalid answer choice')
      if(answers[i]===null){blank++;stats.blank++}
      else if(answers[i]===q.answer){correct++;stats.correct++;earned++;stats.earned++}
      else{wrong++;stats.wrong++}
    }
  })
  return {correct,wrong,blank,score:Math.round(earned/questions.length*10000)/100,topicAnalysis}
}
