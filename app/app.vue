<script setup lang="ts">
const { hue } = useTheme()
const { locale } = useI18n()
useHead(() => ({ htmlAttrs: { style: themeStyles(hue.value), lang: locale.value } }))
</script>
<template><NuxtPage /></template>
