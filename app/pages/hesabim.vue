<script setup lang="ts">
const { data: me } = await useFetch<{ role: string; name: string; id?: string } | null>('/api/auth/me')
if (!me.value) await navigateTo('/giris')
else if (me.value.role === 'ADMIN') await navigateTo('/')
const { data: results } = await useFetch<{id:string; correct:number; wrong:number; blank:number; score:number; exam:{title:string;month:string}}[]>('/api/my-results')
async function logout() { await api('/api/auth/logout', { method: 'POST' }); await navigateTo('/giris') }
</script>
<template><main class="max-w-4xl mx-auto p-6 md:p-12"><header class="flex justify-between items-center mb-12"><div class="brand"><span class="brand-mark">m</span>mymath</div><button class="btn" @click="logout">Çıkış yap</button></header><p class="eyebrow mb-3">BENİM YOLCULUĞUM</p><h1>Merhaba, {{ me?.name }}.</h1><p class="muted mt-3 mb-8">Her sınav, bir sonraki adımın için yeni bir başlangıç.</p><section class="panel overflow-hidden"><div class="p-6 border-b border-[#e3e7df]"><h2>Sınav sonuçlarım</h2></div><div v-if="!results?.length" class="empty">Henüz sınav sonucun bulunmuyor.</div><div v-for="r in results" :key="r.id" class="p-6 border-b border-[#edf0e9] flex justify-between gap-4"><div><h3>{{ r.exam.title }}</h3><p class="muted text-xs mt-2">{{ r.exam.month }} · {{ r.correct }} doğru · {{ r.wrong }} yanlış · {{ r.blank }} boş</p></div><strong class="text-2xl text-[#24583f]">%{{ r.score }}</strong></div></section></main></template>

