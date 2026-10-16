import {test} from 'node:test'
import assert from 'node:assert/strict'
import {parseExamDocument,gradeDocument} from '../shared/examDocument'
const input={mode:'imtahan',title:'Exam',blocks:[{type:'q',t:'2+3',o:['3','4','5','6'],answer:'C',topic:'Math'},{type:'q',t:'Explain',topic:'Math'}]}
test('engine requires explicit answer keys, unique sequential questions and safe figures',()=>{
  const {document,questions}=parseExamDocument(input)
  assert.equal(document.blocks.length,2);assert.equal(questions[1]?.kind,'manual')
  assert.throws(()=>parseExamDocument({...input,blocks:[{type:'q',t:'Missing answer',o:['a','b']}]}))
  assert.throws(()=>parseExamDocument({...input,blocks:[{type:'q',t:'Invalid key',o:['a','b'],answer:'E'}]}))
  assert.throws(()=>parseExamDocument({...input,blocks:[{...input.blocks[0],start:4}]}))
  assert.throws(()=>parseExamDocument({...input,blocks:[{type:'fig',items:[['line','"/><script>',0,10,10]]}]}))
  assert.throws(()=>parseExamDocument({...input,blocks:[{type:'fig',items:[['plot','x.constructor()',0,1]]}]}))
})
test('open questions require explicit 0–1 scores and contribute equally to percentage',()=>{
  const {questions}=parseExamDocument(input)
  const analysis=gradeDocument(questions,['C',null],{'2':.5})
  assert.equal(analysis.score,75);assert.equal(analysis.correct,1);assert.equal(analysis.blank,0)
  assert.equal(analysis.topicAnalysis.Math?.earned,1.5)
  assert.throws(()=>gradeDocument(questions,['C',null],{}))
  assert.throws(()=>gradeDocument(questions,['C',null],{'2':1.1}))
  assert.throws(()=>gradeDocument(questions,['C',null],{'2':.5,'1':1}))
  assert.throws(()=>gradeDocument(questions,['E',null],{'2':1}))
  assert.throws(()=>gradeDocument(questions,['C','A'],{'2':1}))
})
test('topic names are data and cannot change object prototypes',()=>{
  const {questions}=parseExamDocument({...input,blocks:input.blocks.map(q=>({...q,topic:'__proto__'}))})
  const result=gradeDocument(questions,['C',null],{'2':1})
  assert.equal(result.topicAnalysis['__proto__']?.earned,2)
  assert.equal(({} as any).earned,undefined)
})
