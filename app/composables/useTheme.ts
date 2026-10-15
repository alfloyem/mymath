export function useTheme() {
  const savedHue = useCookie<number | null>('mymath-hue', { default: () => null, maxAge: 31536000, sameSite: 'lax' })
  const hue = useState<number | null>('theme-hue', () => typeof savedHue.value === 'number' && Number.isFinite(savedHue.value) ? savedHue.value : null)
  const colorMode = useColorMode()
  function setHue(value: number | null) { hue.value = value; savedHue.value = value }
  function reset() { setHue(null); colorMode.preference = 'system' }
  return { hue, colorMode, setHue, reset }
}
