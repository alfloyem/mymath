<script setup lang="ts">
const { hue } = useTheme()
const { locale, setLocale } = useI18n()
const savedLocale = useCookie<string>('mymath-language', { default: () => 'az', maxAge: 31536000, sameSite: 'lax' })
if (['az', 'en', 'ru'].includes(savedLocale.value)) await setLocale(savedLocale.value as 'az' | 'en' | 'ru')
useHead(() => ({ htmlAttrs: { style: themeStyles(hue.value), lang: locale.value } }))
</script>
<template><NuxtPage /></template>
