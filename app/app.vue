<script setup lang="ts">
const { hue } = useTheme()
useHead(() => ({ htmlAttrs: { style: themeStyles(hue.value) } }))
</script>
<template><NuxtPage /></template>
