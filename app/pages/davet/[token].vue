<script setup lang="ts">
const route = useRoute()
const { data: invite, error: loadError } = await useFetch<{firstName:string;hasPassword:boolean;studentId:string}>(`/api/invite/${route.params.token}`)
const password = ref(''), confirmPassword = ref(''), done = ref(false), busy = ref(false), error = ref('')
async function submit() {
  error.value = ''
  if (password.value !== confirmPassword.value) { error.value = 'Şifreler eşleşmiyor.'; return }
  busy.value = true
  try { await api(`/api/invite/${route.params.token}`, { method: 'POST', body: { password: password.value } }); done.value = true; password.value = ''; confirmPassword.value = '' }
  catch (e: any) { error.value = e.data?.statusMessage || 'Talep gönderilemedi.' } finally { busy.value = false }
}
</script>
<template>
  <main class="auth-page"><section class="panel auth-card">
    <header class="auth-head"><div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div><ThemeControls /></header>
    <h1>Şifre belirle</h1>
    <div v-if="loadError" class="error">{{ loadError.statusMessage || 'Bağlantı geçersiz.' }}</div>
    <template v-else-if="invite">
      <template v-if="done"><div class="notice mb-5">Şifreniz yönetici onayına gönderildi.</div><p class="text-xs muted mb-4">Öğrenci ID: <strong class="break-all">{{ invite.studentId }}</strong></p><NuxtLink to="/giris" class="btn">Giriş</NuxtLink></template>
      <form v-else @submit.prevent="submit">
        <p class="mb-5">{{ invite.firstName }}</p>
        <div class="field"><label for="new-password">Yeni şifre</label><input id="new-password" v-model="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
        <div class="field"><label for="confirm">Şifre tekrar</label><input id="confirm" v-model="confirmPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div>
        <p class="text-xs muted mb-5">Şifre yönetici onayından sonra etkinleşir.</p>
        <p v-if="error" class="error mb-4" role="alert">{{ error }}</p><button class="btn primary w-full" :disabled="busy">Onaya gönder</button>
      </form>
    </template>
  </section></main>
</template>