<script setup lang="ts">
import { useErrorMessage } from '~/composables/useErrorMessage'
const { t, locale } = useI18n()
const errorMessage = useErrorMessage()
const route = useRoute()
const form = reactive({ username: typeof route.query.username === 'string' ? route.query.username : '', password: '' })
const error = ref(''), busy = ref(false)
async function login() {
  busy.value = true; error.value = ''
  try { const result = await api('/api/auth/login', { method: 'POST', body: form }) as { role: string }; clearNuxtData(); await navigateTo(result.role === 'ADMIN' ? '/groups' : '/account') }
  catch (e: any) { error.value = errorMessage(e.data?.statusMessage, 'loginFailed') }
  finally { busy.value = false }
}
</script>
<template>
  <main class="auth-page"><section class="panel auth-card">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><ThemeControls /></header>
    <h1>{{ t('login') }}</h1>
    <form @submit.prevent="login">
      <div class="field"><label for="username">{{ t('username') }}</label><input id="username" v-model="form.username" autocomplete="username" required></div>
      <div class="field"><label for="password">{{ t('password') }}</label><input id="password" v-model="form.password" type="password" autocomplete="current-password" required></div>
      <p v-if="error" role="alert" class="error mb-4">{{ error }}</p><button class="btn primary w-full" :disabled="busy">{{ busy ? t('signingIn') : t('signIn') }}</button>
    </form>
  </section></main>
</template>