function rgb(hue: number, saturation: number, lightness: number) {
  const h = hue / 360, s = saturation / 100, l = lightness / 100
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  return [h + 1 / 3, h, h - 1 / 3].map(t => {
    if (t < 0) t++
    if (t > 1) t--
    return Math.round((t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p) * 255)
  })
}
export function textOnColor(h: number, s: number, l: number) {
  const linear = rgb(h, s, l).map(c => c / 255 <= .04045 ? c / 255 / 12.92 : ((c / 255 + .055) / 1.055) ** 2.4)
  const luminance = linear[0]! * .2126 + linear[1]! * .7152 + linear[2]! * .0722
  return 1.05 / (luminance + .05) >= 4.5 ? '#ffffff' : '#000000'
}
// Same hue-based surfaces and light-mode text adjustment as YesSirPOS.
export function themeStyles(value: number | null) {
  if (value === null || !Number.isFinite(value)) return {}
  const h = ((Math.round(value) % 360) + 360) % 360
  const [r, g, b] = rgb(h, 85, 50)
  const brightness = (r! * 299 + g! * 587 + b! * 114) / 1000
  const sat = brightness > 135 ? 97 : 85
  const lit = brightness > 135 ? Math.max(30, Math.round(50 - (brightness - 120) * .28)) : 50
  return {
    '--brand-hue': `${h}`, '--text-primary-sat': `${sat}%`, '--text-primary-lit': `${lit}%`,
    '--text-on-primary-light': textOnColor(h, sat, lit), '--text-on-primary-dark': textOnColor(h, 85, 58)
  }
}
