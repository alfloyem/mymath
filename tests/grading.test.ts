import test from 'node:test'
import assert from 'node:assert/strict'
import { grade } from '../server/services/grading'
test('doğru, yanlış, boş ve konu kırılımı', () => {
  assert.deepEqual(grade(['A','B','C','D'], ['A','C',null,'D'], ['Kesir','Kesir','Geometri','Geometri']), {
    correct: 2, wrong: 1, blank: 1, score: 50,
    topicAnalysis: { Kesir: { correct: 1, wrong: 1, blank: 0 }, Geometri: { correct: 1, wrong: 0, blank: 1 } }
  })
})
test('boş sınav, eksik cevap ve geçersiz şık reddedilir', () => {
  assert.throws(() => grade([], []))
  assert.throws(() => grade(['A'], []))
  assert.throws(() => grade(['A'], ['F']))
})
test('yüzde iki haneye yuvarlanır; boşlar ceza oluşturmaz', () => {
  assert.equal(grade(['A','B','C'], ['A',null,null]).score, 33.33)
  assert.equal(grade(['A'], [null]).score, 0)
  assert.equal(grade(['A'], ['A']).score, 100)
})
test('konu adları nesne prototipinden bağımsızdır', () => {
  const result = grade(['A'], ['A'], ['__proto__'])
  assert.equal(result.topicAnalysis['__proto__']?.correct, 1)
})
