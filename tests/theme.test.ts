import test from 'node:test'
import assert from 'node:assert/strict'
import { themeStyles, textOnColor } from '../app/utils/theme'

test('tema sıfırlandığında tüm renkler CSS varsayılanlarına döner', () => {
  assert.deepEqual(themeStyles(null), {})
  assert.deepEqual(themeStyles(NaN), {})
})
test('tema rengi normalize edilir ve açık/koyu metin renkleri birlikte üretilir', () => {
  const styles = themeStyles(615)
  assert.equal(styles['--brand-hue'], '255')
  assert.ok(styles['--text-on-primary-light'])
  assert.ok(styles['--text-on-primary-dark'])
  assert.deepEqual(themeStyles(-105), styles)
})
test('beyaz metin kontrastı yeterliyse korunur, parlak zeminde siyaha geçer', () => {
  assert.equal(textOnColor(255, 85, 50), '#ffffff')
  assert.equal(textOnColor(60, 85, 58), '#000000')
  assert.equal(textOnColor(0, 0, 0), '#ffffff')
  assert.equal(textOnColor(0, 0, 100), '#000000')
})
