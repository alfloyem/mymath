<script setup lang="ts">
import { useErrorMessage } from '~/composables/useErrorMessage'
const { t, locale } = useI18n()
const errorMessage = useErrorMessage()
const route = useRoute()
const studentId = typeof route.query.student === 'string' ? route.query.student : ''
const form = reactive({ username: studentId, password: '', role: studentId ? 'STUDENT' : 'ADMIN' })
const error = ref(''), busy = ref(false)
async function login() {
  busy.value = true; error.value = ''
  try { await api('/api/auth/login', { method: 'POST', body: form }); await navigateTo(form.role === 'ADMIN' ? '/' : '/hesabim') }
  catch (e: any) { error.value = errorMessage(e.data?.statusMessage, 'loginFailed') }
  finally { busy.value = false }
}
</script>
<template>
  <main class="auth-page"><section class="panel auth-card">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><ThemeControls /></header>
    <h1>{{ t('login') }}</h1>
    <form @submit.prevent="login">
      <div v-if="!studentId" class="field"><label for="role">{{ t('accountType') }}</label><select id="role" v-model="form.role"><option value="ADMIN">{{ t('admin') }}</option><option value="STUDENT">{{ t('student') }}</option></select></div>
      <div v-if="!studentId" class="field"><label for="username">{{ form.role === 'ADMIN' ? t('username') : t('studentId') }}</label><input id="username" v-model="form.username" autocomplete="username" required></div>
      <div class="field"><label for="password">{{ t('password') }}</label><input id="password" v-model="form.password" type="password" autocomplete="current-password" required></div>
      <p v-if="error" role="alert" class="error mb-4">{{ error }}</p><button class="btn primary w-full" :disabled="busy">{{ busy ? t('signingIn') : t('signIn') }}</button>
    </form>
  </section></main>
</template>