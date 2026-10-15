import test from 'node:test'
import assert from 'node:assert/strict'
import { sortTableRows } from '../app/utils/table'
test('sayısal sıralama ve doğal metin sıralaması kaynak diziyi değiştirmez', () => {
  const rows = [{ name: 'Grup 10', score: 10 }, { name: 'Grup 2', score: 90 }]
  assert.deepEqual(sortTableRows(rows, r=>r.name, 1, 'tr').map(r=>r.name), ['Grup 2','Grup 10'])
  assert.equal(sortTableRows(rows, r=>r.score, -1, 'tr')[0]?.score, 90)
  assert.equal(rows[0]?.name, 'Grup 10')
  assert.deepEqual(sortTableRows(rows, r=>r.name, 0, 'tr'), rows)
})
test('eksik değerler her iki yönde sona gelir', () => {
  const rows = [{ v: null },{ v: 5 },{ v: 2 }]
  for (const direction of [-1,1]) assert.equal(sortTableRows(rows, r=>r.v, direction, 'az').at(-1)?.v,null)
})
