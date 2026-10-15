<script setup lang="ts">
import { useErrorMessage } from '~/composables/useErrorMessage'
const { t, locale } = useI18n()
const errorMessage = useErrorMessage()
const { data: me } = await useFetch<{ role: string; name: string; id?: string } | null>('/api/auth/me')
if (!me.value) await navigateTo('/giris')
else if (me.value.role === 'ADMIN') await navigateTo('/')
const { data: results } = await useFetch<{id:string; correct:number; wrong:number; blank:number; score:number; exam:{title:string;month:string}}[]>('/api/my-results')
async function logout() { await api('/api/auth/logout', { method: 'POST' }); await navigateTo('/giris') }
</script>
<template>
  <main class="max-w-4xl mx-auto p-6 md:p-8">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><div class="flex items-center gap-3"><ThemeControls /><button class="icon-btn" :aria-label="t('logout')" @click="logout"><Icon name="lucide:log-out" size="18" /></button></div></header>
    <h1 class="mb-6">{{ t('myResults') }}</h1>
    <section class="panel overflow-hidden"><div v-if="!results?.length" class="empty">{{ t('noResults') }}</div>
      <div v-for="r in results" :key="r.id" class="px-5 py-4 border-b divider last:border-0 flex justify-between items-center gap-4"><div><h3>{{ r.exam.title }}</h3><p class="muted text-xs mt-1">{{ r.exam.month }} · {{ r.correct }} {{ t('correctLower') }} · {{ r.wrong }} {{ t('wrong') }} · {{ r.blank }} {{ t('blank') }}</p></div><span class="text-xl font-medium text-brand">%{{ r.score }}</span></div>
    </section>
  </main>
</template>