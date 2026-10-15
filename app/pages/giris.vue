<script setup lang="ts">
const form = reactive({ username: '', password: '', role: 'ADMIN' })
const error = ref(''), busy = ref(false)
async function login() {
  busy.value = true; error.value = ''
  try { await api('/api/auth/login', { method: 'POST', body: form }); await navigateTo(form.role === 'ADMIN' ? '/' : '/hesabim') }
  catch (e: any) { error.value = e.data?.statusMessage || 'Giriş yapılamadı.' }
  finally { busy.value = false }
}
</script>
<template>
  <main class="auth-page"><section class="panel auth-card">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><ThemeControls /></header>
    <h1>Giriş</h1>
    <form @submit.prevent="login">
      <div class="field"><label for="role">Hesap türü</label><select id="role" v-model="form.role"><option value="ADMIN">Yönetici</option><option value="STUDENT">Öğrenci</option></select></div>
      <div class="field"><label for="username">{{ form.role === 'ADMIN' ? 'Kullanıcı adı' : 'Öğrenci ID' }}</label><input id="username" v-model="form.username" autocomplete="username" required></div>
      <div class="field"><label for="password">Şifre</label><input id="password" v-model="form.password" type="password" autocomplete="current-password" required></div>
      <p v-if="error" role="alert" class="error mb-4">{{ error }}</p><button class="btn primary w-full" :disabled="busy">{{ busy ? 'Giriş yapılıyor…' : 'Giriş yap' }}</button>
    </form>
  </section></main>
</template>