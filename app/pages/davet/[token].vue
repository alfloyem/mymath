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
<template><main class="auth-page"><section class="panel auth-card"><div class="brand mb-10"><span class="brand-mark">m</span>mymath</div>
  <div v-if="loadError" class="error">{{ loadError.statusMessage || 'Bağlantı geçersiz.' }}</div>
  <template v-else-if="invite"><p class="eyebrow mb-3">KİŞİSEL HESABINIZ</p><h1 class="mb-3">Merhaba, {{ invite.firstName }}.</h1>
  <template v-if="done"><div class="notice my-6">Şifre talebiniz gönderildi. Yönetici onayladıktan sonra giriş yapabilirsiniz.</div><p class="text-xs muted mb-4">Giriş için öğrenci ID: <strong class="break-all">{{ invite.studentId }}</strong></p><NuxtLink to="/giris" class="btn">Giriş sayfası <Icon name="lucide:arrow-right" /></NuxtLink></template>
  <form v-else @submit.prevent="submit"><p class="muted mb-6">{{ invite.hasPassword ? 'Yeni şifreniz' : 'Belirleyeceğiniz şifre' }} yönetici onayından sonra etkinleşir.</p><div class="field"><label for="new-password">Şifre</label><input id="new-password" v-model="password" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><div class="field"><label for="confirm">Şifre tekrar</label><input id="confirm" v-model="confirmPassword" type="password" minlength="8" maxlength="72" autocomplete="new-password" required></div><p v-if="error" class="error mb-4">{{ error }}</p><button class="btn primary w-full" :disabled="busy">Belirle ve onaya gönder<Icon name="lucide:arrow-right" /></button></form></template>
</section></main></template>
