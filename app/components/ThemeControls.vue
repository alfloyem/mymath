<script setup lang="ts">
const { hue, colorMode, setHue, reset } = useTheme()
</script>
<template>
  <details class="theme-menu">
    <summary class="icon-btn" aria-label="Görünüm" title="Görünüm"><Icon name="lucide:palette" size="18" /></summary>
    <div class="theme-popover">
      <div class="theme-modes">
        <button v-for="mode in [{ id: 'light', icon: 'sun', label: 'Açık' }, { id: 'dark', icon: 'moon', label: 'Koyu' }, { id: 'system', icon: 'monitor', label: 'Sistem' }]" :key="mode.id" :class="{ active: colorMode.preference === mode.id }" :aria-pressed="colorMode.preference === mode.id" @click="colorMode.preference = mode.id"><Icon :name="`lucide:${mode.icon}`" />{{ mode.label }}</button>
      </div>
      <label for="theme-hue">Tema rengi</label>
      <input id="theme-hue" type="range" min="0" max="359" :value="hue ?? 255" @input="setHue(Number(($event.target as HTMLInputElement).value))">
      <div class="theme-swatches"><button v-for="color in [255, 220, 170, 130, 35, 0]" :key="color" :aria-label="`Tema rengi ${color}`" :aria-pressed="(hue ?? 255) === color" :style="{ backgroundColor: `hsl(${color}, 75%, 50%)` }" @click="setHue(color)" /></div>
      <button class="btn w-full mt-4" @click="reset">Sıfırla</button>
    </div>
  </details>
</template>
