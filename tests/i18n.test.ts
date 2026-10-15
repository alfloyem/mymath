import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const load = (locale: string) => JSON.parse(readFileSync(new URL(`../i18n/locales/${locale}.json`, import.meta.url), 'utf8')) as Record<string,string>
const tr = load('tr')
test('tüm diller aynı arayüz anahtarlarını ve yer tutucularını içerir', () => {
  for (const locale of ['az','en','ru']) {
    const messages = load(locale)
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(tr).sort(),locale)
    for (const key of Object.keys(tr)) {
      assert.ok(messages[key]?.trim(),`${locale}:${key}`)
      const variables = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort()
      assert.deepEqual(variables(messages[key]!),variables(tr[key]!),`${locale}:${key}`)
    }
  }
})
