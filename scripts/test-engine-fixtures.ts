import {readFile,writeFile,mkdir} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {renderExamBundle} from '../server/services/examPdf'
import {parseExamDocument} from '../shared/examDocument'
const sources={document:await readFile('resources/engines/document.html','utf8'),answers:await readFile('resources/engines/answers.html','utf8'),mathjax:await readFile('node_modules/mathjax/es5/tex-svg-full.js','utf8')}
const fixture=JSON.parse(await readFile('examples/exam-engine.json','utf8'))
for(let i=0;i<4;i++)fixture.blocks.push({type:'q',t:'Manual QA question '+i,space:80})
const {document,questions}=parseExamDocument(fixture)
const bundle=await renderExamBundle('engine-check',document,questions,sources)
await mkdir('.local/engine-check',{recursive:true})
for(const kind of ['paperPdf','answerPdf','keyPdf'] as const)await writeFile(`.local/engine-check/${kind}.pdf`,bundle[kind])
await writeFile('.local/engine-check/pattern.json',JSON.stringify(bundle.pattern))
assert.equal(bundle.pattern.pages.length,2)
assert.equal(bundle.pattern.pages.flatMap(p=>p.bubbles).length,9)
const sample=JSON.parse(await readFile('sinaq_20_sual.json','utf8'))
// Test-only keys exercise layout; these are NOT a solution of the supplied exam.
for(const block of sample.blocks)if(block.o)block.answer='A'
const parsed=parseExamDocument(sample)
const full=await renderExamBundle('layout-check',parsed.document,parsed.questions,sources)
await writeFile('.local/engine-check/full-paper.pdf',full.paperPdf)
await writeFile('.local/engine-check/full-answers.pdf',full.answerPdf)
console.log('PDFs generated; measured',bundle.pattern.pages.length,'answer pages; 20-question reference layout generated with synthetic test keys.')
