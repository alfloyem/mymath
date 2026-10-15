import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedOrigin } from '../server/utils/origin'

test('geliştirmede gerçek localhost adresi ve Nuxt portu kabul edilir', () => {
  for (const url of ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://[::1]:3000']) {
    assert.equal(isAllowedOrigin(url, url, 'http://localhost:3100', true), true)
  }
})
test('farklı kaynaklar ve yanıltıcı localhost alanları engellenir', () => {
  assert.equal(isAllowedOrigin('https://untrusted.invalid', 'http://localhost:3000', 'http://localhost:3100', true), false)
  assert.equal(isAllowedOrigin('http://localhost:3001', 'http://localhost:3000', 'http://localhost:3100', true), false)
  assert.equal(isAllowedOrigin('http://localhost.evil:3000', 'http://localhost.evil:3000', 'http://localhost:3100', true), false)
})
test('üretimde yapılandırılan origin esas alınır ve URL yolu normalize edilir', () => {
  assert.equal(isAllowedOrigin('https://math.example', 'http://internal:3000', 'https://math.example/', false), true)
  assert.equal(isAllowedOrigin('http://localhost:3000', 'http://localhost:3000', 'https://math.example', false), false)
})
