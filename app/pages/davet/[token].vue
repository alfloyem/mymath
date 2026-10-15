<script setup lang="ts">
const route = useRoute()
await navigateTo(`/invite/${encodeURIComponent(String(route.params.token))}`, { redirectCode: 301 })
</script>
<template><div /></template>
