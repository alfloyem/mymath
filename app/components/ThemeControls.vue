<script setup lang="ts">
const { hue, colorMode, setHue } = useTheme()
const { t, locale, locales, setLocale } = useI18n()
const open = ref(false), root = ref<HTMLElement>(), trigger = ref<HTMLButtonElement>()
const hueId = useId()
const savedLocale = useCookie<string>('mymath-language', { default: () => 'az', maxAge: 31536000, sameSite: 'lax' })
function changeLanguage(event: Event) {
  const code = (event.target as HTMLSelectElement).value as 'az' | 'en' | 'ru'
  savedLocale.value = code
  setLocale(code)
}
function close(restoreFocus = true) { open.value = false; if (restoreFocus) trigger.value?.focus() }
const modes = [{id:'light',icon:'sun'},{id:'dark',icon:'moon'},{id:'system',icon:'monitor'}]
const modeIndex = computed(() => Math.max(0, modes.findIndex(mode => mode.id === colorMode.preference)))
function outside(event: Event) { if (open.value && root.value && !event.composedPath().includes(root.value)) close(false) }
onMounted(() => {
  // Capture still receives events stopped by a parent menu, drawer or overlay.
  document.addEventListener('pointerdown', outside, true)
  document.addEventListener('focusin', outside, true)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', outside, true)
  document.removeEventListener('focusin', outside, true)
})
</script>
<template>
  <div ref="root" class="theme-menu" @keydown.esc.stop="close()">
    <button ref="trigger" class="icon-btn" :aria-label="t('appearance')" :title="t('appearance')" :aria-expanded="open" :aria-controls="hueId+'-panel'" @click="open=!open"><Icon name="lucide:palette" size="18" /></button>
    <Transition name="popover"><section v-if="open" :id="hueId+'-panel'" class="theme-popover" :aria-label="t('appearance')">
      <div class="theme-modes" :style="{'--mode-index':modeIndex}"><span class="mode-indicator" aria-hidden="true" /><button v-for="mode in modes" :key="mode.id" :class="{active:colorMode.preference===mode.id}" :aria-pressed="colorMode.preference===mode.id" @click="colorMode.preference=mode.id"><Icon :name="`lucide:${mode.icon}`" />{{ t(mode.id) }}</button></div>
      <label :for="hueId">{{ t('themeColor') }}</label>
      <div class="hue-control"><input :id="hueId" class="hue-slider" type="range" min="0" max="359" :value="hue ?? 152" @input="setHue(Number(($event.target as HTMLInputElement).value))"><button class="hue-reset" :aria-label="t('resetColor')" :title="t('resetColor')" @click="setHue(null)"><Icon name="lucide:rotate-ccw" size="15" /></button></div>
      <label :for="hueId+'-locale'" class="mt-5">{{ t('language') }}</label><select :id="hueId+'-locale'" :value="locale" @change="changeLanguage($event)"><option v-for="language in locales" :key="language.code" :value="language.code">{{ language.name }}</option></select>

    </section></Transition>
  </div>
</template>
