import test from 'node:test'
import assert from 'node:assert/strict'
import { createResourceCache } from '../app/utils/resourceCache'

test('eşzamanlı ve tekrar eden okumalar aynı isteği kullanır', async () => {
  const cache = createResourceCache(); let calls = 0
  const load = async () => { calls++; return [1,2] }
  await Promise.all([cache.read('students:a',load),cache.read('students:a',load)])
  await cache.read('students:a',load)
  assert.equal(calls,1)
})
test('süre dolumu ve hedefli geçersizleştirme yalnız ilgili kaynağı yeniler', async () => {
  let time=0, calls=0
  const cache = createResourceCache(32,()=>time)
  const load=async()=>++calls
  await cache.read('students:a',load,10); await cache.read('profile:b',load,10)
  cache.invalidate('students:')
  assert.equal(await cache.read('profile:b',load,10),2)
  assert.equal(await cache.read('students:a',load,10),3)
  time=11; assert.equal(await cache.read('students:a',load,10),4)
})
test('geç kalan eski istek yeni veriyi ezemez; çıkış tüm belleği temizler', async () => {
  const cache=createResourceCache()
  let release!: (value:string)=>void
  const old=cache.read('profile:a',()=>new Promise<string>(resolve=>{release=resolve}))
  await Promise.resolve()
  cache.invalidate('profile:a')
  await cache.read('profile:a',async()=> 'new')
  release('old'); await assert.rejects(old, (error:any)=>error.name==='AbortError')
  assert.equal(await cache.read('profile:a',async()=> 'unexpected'),'new')
  cache.clear()
  assert.equal(await cache.read('profile:a',async()=> 'after logout'),'after logout')
})
test('başarısız istekler saklanmaz ve LRU sınırı belleği sınırlar', async () => {
  const cache=createResourceCache(2)
  await assert.rejects(cache.read('a',async()=>{throw new Error('network')}))
  await cache.read('a',async()=>1); await cache.read('b',async()=>2)
  await cache.read('a',async()=>0); await cache.read('c',async()=>3)
  assert.equal(await cache.read('b',async()=>4),4)
})
