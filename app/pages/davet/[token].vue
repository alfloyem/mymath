<script setup lang="ts">
import { useErrorMessage } from '~/composables/useErrorMessage'
const { t, locale } = useI18n()
const errorMessage = useErrorMessage()
const route = useRoute()
const { data: invite, error: loadError } = await useFetch<{firstName:string;hasPassword:boolean;studentId:string}>(`/api/invite/${route.params.token}`)
const password = ref(''), confirmPassword = ref(''), done = ref(false), busy = ref(false), error = ref('')
async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) { error.value = t('passwordMismatch'); return }
  busy.value = true
  try { await api(`/api/invite/${route.params.token}`, { method: 'POST', body: { password: password.value } }); done.value = true; password.value = ''; confirmPassword.value = '' }
  catch (e: any) { error.value = errorMessage(e.data?.statusMessage, 'requestFailed') } finally { busy.value = false }
}
</script>
<template>
  <main class="auth-page"><section class="panel auth-card">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><ThemeControls /></header>
    <h1 class="mb-2">{{ t('setPassword') }}</h1><p v-if="invite" class="person-name invite-name">{{ invite.firstName }}</p>
    <div v-if="loadError" class="error">{{ errorMessage(loadError.statusMessage, 'invalidLink') }}</div>
    <template v-else-if="invite">
      <template v-if="done"><div class="notice mb-5">{{ t('passwordSent') }}</div><NuxtLink :to="{path:'/giris',query:{student:invite.studentId}}" class="btn">{{ t('login') }}</NuxtLink></template>
      <form v-else @submit.prevent="submit">
        
        <div class="field"><label for="new-password">{{ t('newPassword') }}</label><input id="new-password" v-model="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
        <div class="field"><label for="confirm">{{ t('repeatPassword') }}</label><input id="confirm" v-model="confirmPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
        
        <p v-if="error" class="error mb-4" role="alert">{{ error }}</p><button class="btn primary w-full" :disabled="busy">{{ t('submitApproval') }}</button>
      </form>
    </template>
  </section></main>
</template>