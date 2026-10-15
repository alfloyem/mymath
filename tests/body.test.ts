import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { readBoundedJson } from '../server/utils/body'

test('JSON verisi parçalar halinde okunur ve UTF-8 korunur', async () => {
  const buffer = Buffer.from('{"name":"Əli"}')
  assert.deepEqual(await readBoundedJson(Readable.from([buffer.subarray(0,11), buffer.subarray(11)])), { name: 'Əli' })
})
test('Content-Length olmadan da akış sırasında sınır aşımı engellenir', async () => {
  await assert.rejects(readBoundedJson(Readable.from(['{"x":"','a'.repeat(80),'"}']),32), (e:any)=>e.statusCode===413)
})
test('geçersiz JSON 500 yerine 400 döndürür', async () => {
  await assert.rejects(readBoundedJson(Readable.from(['{broken'])), (e:any)=>e.statusCode===400)
})
