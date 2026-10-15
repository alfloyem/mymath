<script setup lang="ts">
type Group = { id: string; name: string; position: number; _count: { students: number; exams: number } }
type Student = { id: string; firstName: string; lastName: string | null; birthDate: string | null; phone: string | null; groupId: string; group?: { name: string }; _count?: { results: number } }
type Exam = { id: string; title: string; month: string; groupId: string; answerKey: string[]; topics: string[]; status: string; group: { name: string }; _count: { results: number } }
type Result = { id: string; score: number; correct: number; wrong: number; blank: number; answers: (string | null)[]; exam: Exam; topicAnalysis: Record<string, { correct: number; wrong: number; blank: number }> }
const { data: me } = await useFetch<{ role: string; name: string; id?: string } | null>('/api/auth/me')
if (!me.value) await navigateTo('/giris')
else if (me.value.role !== 'ADMIN') await navigateTo('/hesabim')
const { data: dashboard, refresh: refreshDashboard, error: initialError } = await useFetch<{ groups: Group[]; exams: Exam[]; requests: { id: string; createdAt: string; student: Student }[] }>('/api/dashboard')
const section = ref('groups'), activeGroup = ref(''), search = ref(''), selected = ref<string[]>([])
const students = ref<Student[]>([]), profile = ref<(Student & { results: Result[] }) | null>(null)
const modal = ref(''), error = ref(''), notice = ref(''), busy = ref(false), loadingStudents = ref(false)
const groupForm = reactive({ id: '', name: '' })
const studentForm = reactive({ id: '', firstName: '', lastName: '', birthDate: '', phone: '', password: '', groupId: '' })
const examForm = reactive({ title: '', month: new Date().toISOString().slice(0, 7), groupId: '', key: '', topics: '' })
const resultForm = reactive({ examId: '', answers: '', originalName: '' })
const transferGroup = ref(''), inviteUrl = ref(''), inviteStudentId = ref(''), monthFilter = ref('')
const confirmAction = ref<null | (() => Promise<void>)>(null), confirmText = ref('')
const groups = computed(() => (dashboard.value?.groups || []) as Group[])
const exams = computed(() => (dashboard.value?.exams || []) as unknown as Exam[])
const filteredGroups = computed(() => groups.value.filter(g => g.name.toLocaleLowerCase('tr').includes(search.value.toLocaleLowerCase('tr'))))
const currentGroup = computed(() => groups.value.find(g => g.id === activeGroup.value))
const filteredStudents = computed(() => students.value.filter(s => `${s.firstName} ${s.lastName || ''} ${s.phone || ''}`.toLocaleLowerCase('tr').includes(search.value.toLocaleLowerCase('tr'))))
const filteredExams = computed(() => exams.value.filter(e => (!activeGroup.value || e.groupId === activeGroup.value) && (!monthFilter.value || e.month === monthFilter.value)))
const profileResults = computed(() => (profile.value?.results || []).filter(r => !monthFilter.value || r.exam.month === monthFilter.value))
const profileAverage = computed(() => profileResults.value.length ? Math.round(profileResults.value.reduce((a, r) => a + r.score, 0) / profileResults.value.length) : 0)
const monthlyResults = computed(() => {
  const months = new Map<string, number[]>()
  for (const r of profileResults.value) { const list = months.get(r.exam.month) || []; list.push(r.score); months.set(r.exam.month, list) }
  return [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, values]) => ({ month, score: Math.round(values.reduce((a,b) => a+b,0)/values.length) }))
})
const eligibleExams = computed(() => exams.value.filter(e => e.status === 'OPEN' && (e.groupId === profile.value?.groupId || profile.value?.results.some(r => r.exam.id === e.id))))
const availableExam = computed(() => exams.value.find(e => e.id === resultForm.examId))
const title = computed(() => section.value === 'students' ? (currentGroup.value?.name || 'Tüm öğrenciler') : section.value === 'exams' ? 'Sınavlar' : section.value === 'approvals' ? 'Şifre onayları' : 'Gruplar')
function resetError() { error.value = ''; notice.value = '' }
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try { await action() } catch (e: any) { error.value = e.data?.statusMessage || e.message || 'İşlem tamamlanamadı.' } finally { busy.value = false }
}
async function loadStudents() {
  loadingStudents.value = true
  try { students.value = await api('/api/students', { query: activeGroup.value ? { groupId: activeGroup.value } : {} }) as Student[] }
  finally { loadingStudents.value = false }
}
async function navigate(to: string, groupId = '') { resetError(); modal.value = ''; section.value = to; activeGroup.value = groupId; search.value = ''; selected.value = []; monthFilter.value = ''; if (to === 'students') await run(loadStudents) }
function openGroup(g?: Group) { resetError(); Object.assign(groupForm, { id: g?.id || '', name: g?.name || '' }); modal.value = 'group' }
async function saveGroup() { await run(async () => { await api(`/api/groups${groupForm.id ? '/' + groupForm.id : ''}`, { method: groupForm.id ? 'PUT' : 'POST', body: { name: groupForm.name } }); await refreshDashboard(); modal.value = '' }) }
async function moveGroup(g: Group, direction: number) { await run(async () => { const ids = groups.value.map(g => g.id); const i = ids.indexOf(g.id); const j = i + direction; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j]!, ids[i]!]; await api('/api/groups/reorder', { method: 'PUT', body: { ids } }); await refreshDashboard() }) }
function askDelete(kind: string, id: string, name: string) {
  resetError(); confirmText.value = `${name} silinsin mi? ${kind === 'groups' ? 'Öğrenci veya sınav içeren grup silinemez.' : kind === 'students' ? 'Öğrencinin tüm sonuçları ve erişimi de kalıcı olarak silinir.' : 'Bu sınavın tüm sonuçları da silinir.'}`
  confirmAction.value = async () => { await api(`/api/${kind}/${id}`, { method: 'DELETE' }); await refreshDashboard(); if (section.value === 'students') await loadStudents(); if (kind === 'students') profile.value = null; modal.value = '' }
  modal.value = 'confirm'
}
function openStudent(student?: Student) { resetError(); Object.assign(studentForm, { id: student?.id || '', firstName: student?.firstName || '', lastName: student?.lastName || '', birthDate: student?.birthDate?.slice(0, 10) || '', phone: student?.phone || '', password: '', groupId: student?.groupId || activeGroup.value || groups.value[0]?.id || '' }); modal.value = 'student' }
async function saveStudent() { await run(async () => { const { id, password, ...rest } = studentForm; await api(`/api/students${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: { ...rest, birthDate: rest.birthDate || null, ...(password ? { password } : {}) } }); studentForm.password = ''; await Promise.all([loadStudents(), refreshDashboard()]); modal.value = ''; if (profile.value?.id === id) await loadProfile(id) }) }
async function loadProfile(id: string) { profile.value = await api(`/api/students/${id}`) as unknown as Student & { results: Result[] } }
async function openProfile(s: Student) { await run(async () => { await loadProfile(s.id); monthFilter.value = ''; modal.value = 'profile' }) }
function openTransfer() { resetError(); transferGroup.value = groups.value.find(g => g.id !== activeGroup.value)?.id || ''; modal.value = 'transfer' }
async function transfer() { await run(async () => { await api('/api/students/transfer', { method: 'POST', body: { ids: selected.value, groupId: transferGroup.value } }); selected.value = []; await Promise.all([loadStudents(), refreshDashboard()]); modal.value = '' }) }
async function createInvite(s: Student) { await run(async () => { const r = await api(`/api/students/${s.id}/invite`, { method: 'POST' }); inviteUrl.value = r.url; inviteStudentId.value = s.id; modal.value = 'invite' }) }
async function copyInvite() { try { await navigator.clipboard.writeText(inviteUrl.value); notice.value = 'Bağlantı kopyalandı.' } catch { notice.value = 'Bağlantıyı seçip kopyalayabilirsiniz.' } }
async function review(id: string, approve: boolean) { await run(async () => { await api(`/api/password-requests/${id}`, { method: 'POST', body: { approve } }); await refreshDashboard(); notice.value = approve ? 'Şifre onaylandı. Öğrenci giriş yapabilir.' : 'Şifre talebi reddedildi.' }) }
function openExam() { resetError(); Object.assign(examForm, { title: '', month: new Date().toISOString().slice(0, 7), groupId: activeGroup.value || groups.value[0]?.id || '', key: '', topics: '' }); modal.value = 'exam' }
function parseAnswers(value: string): (string | null)[] { return value.toUpperCase().trim().split(/[\s,;]+/).filter(Boolean).map(a => a === '-' || a === '_' ? null : a) }
async function saveExam() { await run(async () => { await api('/api/exams', { method: 'POST', body: { title: examForm.title, month: examForm.month, groupId: examForm.groupId, answerKey: parseAnswers(examForm.key), topics: examForm.topics.trim() ? examForm.topics.split(',').map(t => t.trim()) : [] } }); await refreshDashboard(); modal.value = ''; section.value = 'exams' }) }
async function toggleExam(e: Exam) { await run(async () => { await api(`/api/exams/${e.id}`, { method: 'PUT', body: { status: e.status === 'OPEN' ? 'CLOSED' : 'OPEN' } }); await refreshDashboard() }) }
function openResult(r?: Result) { resetError(); resultForm.examId = r?.exam.id || eligibleExams.value[0]?.id || ''; resultForm.answers = r?.answers.map(a => a || '-').join(' ') || ''; resultForm.originalName = ''; modal.value = 'result' }
function changedExam() { const previous = profile.value?.results.find(r => r.exam.id === resultForm.examId); resultForm.answers = previous?.answers.map(a => a || '-').join(' ') || ''; resultForm.originalName = '' }
async function uploadAnswers(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  if (!file) return
  error.value = ''
  try {
    if (file.size > 256000) throw new Error('Dosya en fazla 256 KB olabilir.')
    const text = await file.text()
    if (file.name.toLowerCase().endsWith('.json')) { const data = JSON.parse(text); if (!Array.isArray(data.answers)) throw new Error('JSON içinde answers dizisi gerekli.'); resultForm.answers = data.answers.map((a: any) => a === null ? '-' : String(a)).join(' ') }
    else resultForm.answers = text.trim()
    resultForm.originalName = file.name
  } catch (e: any) { error.value = e.message } finally { input.value = '' }
}
async function saveResult() { await run(async () => { if (!profile.value) return; await api('/api/results', { method: 'POST', body: { examId: resultForm.examId, studentId: profile.value.id, answers: parseAnswers(resultForm.answers), originalName: resultForm.originalName || undefined } }); await loadProfile(profile.value.id); await refreshDashboard(); modal.value = 'profile'; notice.value = 'Sonuç analiz edildi ve kaydedildi.' }) }
async function logout() { await api('/api/auth/logout', { method: 'POST' }); await navigateTo('/giris') }
function selectAll(event: Event) { selected.value = (event.target as HTMLInputElement).checked ? filteredStudents.value.map(s => s.id) : [] }
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><Icon name="lucide:calculator" size="23" class="brand-mark" />MyMath</div>
      <nav class="nav" aria-label="Ana menü">
        <button :class="{ active: section === 'groups' }" @click="navigate('groups')"><Icon name="lucide:layout-grid" size="18" />Gruplar</button>
        <button :class="{ active: section === 'students' }" @click="navigate('students')"><Icon name="lucide:users" size="18" />Öğrenciler</button>
        <button :class="{ active: section === 'exams' }" @click="navigate('exams')"><Icon name="lucide:notebook-pen" size="18" />Sınavlar</button>
        <button :class="{ active: section === 'approvals' }" @click="navigate('approvals')"><Icon name="lucide:shield-check" size="18" />Onaylar<span v-if="dashboard?.requests.length" class="ml-auto pill">{{ dashboard.requests.length }}</span></button>
      </nav>
      <div class="sidebar-footer"><span class="admin-label text-xs muted mr-auto">Yönetici</span><ThemeControls /><button class="icon-btn" aria-label="Çıkış yap" @click="logout"><Icon name="lucide:log-out" size="18" /></button></div>
    </aside>
    <main class="content min-w-0">
      <header class="page-head">
        <h1>{{ title }}</h1>
        <button v-if="section === 'groups'" class="btn primary" @click="openGroup()"><Icon name="lucide:plus" />Grup ekle</button>
        <button v-if="section === 'students'" class="btn primary" :disabled="!groups.length" @click="openStudent()"><Icon name="lucide:plus" />Öğrenci ekle</button>
        <button v-if="section === 'exams'" class="btn primary" :disabled="!groups.length" @click="openExam"><Icon name="lucide:plus" />Sınav başlat</button>
      </header>
      <p v-if="(error || initialError) && !modal" class="error mb-4" role="alert">{{ error || initialError?.statusMessage || 'Verilere erişilemiyor.' }}</p>
      <p v-if="notice && !modal" class="notice mb-4" role="status">{{ notice }}</p>
      <template v-if="section === 'groups'">
        <div v-if="groups.length" class="toolbar"><input v-model="search" aria-label="Grup ara" placeholder="Grup ara"><span class="text-xs muted">{{ groups.length }} grup</span></div>
        <section class="panel overflow-hidden">
          <div v-if="!filteredGroups.length" class="empty">{{ search ? 'Grup bulunamadı.' : 'Henüz grup yok.' }}</div>
          <div v-else class="table-wrap"><table><thead><tr><th>Grup</th><th>Öğrenci</th><th>Sınav</th><th class="w-40"></th></tr></thead>
            <tbody><tr v-for="g in filteredGroups" :key="g.id">
              <td><button class="row-link" @click="navigate('students',g.id)">{{ g.name }}</button></td>
              <td class="muted">{{ g._count.students }}</td><td class="muted">{{ g._count.exams }}</td>
              <td><div class="flex justify-end gap-1">
                <button class="icon-btn" :disabled="busy || groups[0]?.id===g.id" aria-label="Grubu yukarı taşı" @click="moveGroup(g,-1)"><Icon name="lucide:arrow-up" size="15" /></button>
                <button class="icon-btn" :disabled="busy || groups.at(-1)?.id===g.id" aria-label="Grubu aşağı taşı" @click="moveGroup(g,1)"><Icon name="lucide:arrow-down" size="15" /></button>
                <button class="icon-btn" aria-label="Grubu düzenle" @click="openGroup(g)"><Icon name="lucide:pencil" size="15" /></button>
                <button class="icon-btn danger" aria-label="Grubu sil" @click="askDelete('groups',g.id,g.name)"><Icon name="lucide:trash-2" size="15" /></button>
              </div></td>
            </tr></tbody></table></div>
        </section>
      </template>
      <template v-if="section === 'students'">
        <div class="toolbar"><select v-model="activeGroup" aria-label="Grup filtresi" @change="selected=[];run(loadStudents)"><option value="">Tüm gruplar</option><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select><input v-model="search" aria-label="Öğrenci ara" placeholder="Öğrenci ara"><button v-if="selected.length" class="btn ml-auto" @click="openTransfer"><Icon name="lucide:arrow-right-left" />Taşı ({{ selected.length }})</button></div>
        <section class="panel overflow-hidden"><div v-if="loadingStudents" class="empty">Yükleniyor…</div><div v-else-if="!filteredStudents.length" class="empty">{{ search ? 'Öğrenci bulunamadı.' : 'Henüz öğrenci yok.' }}</div><div v-else class="table-wrap"><table>
          <thead><tr><th class="w-10"><input type="checkbox" aria-label="Tümünü seç" :checked="filteredStudents.length>0 && filteredStudents.every(s=>selected.includes(s.id))" @change="selectAll"></th><th>Öğrenci</th><th>Grup</th><th>Telefon</th><th>Sınav</th><th></th></tr></thead>
          <tbody><tr v-for="s in filteredStudents" :key="s.id"><td><input v-model="selected" type="checkbox" :value="s.id" :aria-label="s.firstName+' seç'"></td><td><button class="row-link" @click="openProfile(s)">{{ s.firstName }} {{ s.lastName }}</button></td><td class="muted">{{ s.group?.name }}</td><td class="muted">{{ s.phone || '—' }}</td><td class="muted">{{ s._count?.results || 0 }}</td><td><div class="flex justify-end gap-1"><button class="icon-btn" aria-label="Öğrenciyi düzenle" @click="openStudent(s)"><Icon name="lucide:pencil" /></button><button class="icon-btn" aria-label="Şifre bağlantısı oluştur" @click="createInvite(s)"><Icon name="lucide:link" /></button><button class="icon-btn danger" aria-label="Öğrenciyi sil" @click="askDelete('students',s.id,s.firstName)"><Icon name="lucide:trash-2" /></button></div></td></tr></tbody>
        </table></div></section>
      </template>
      <template v-if="section === 'exams'">
        <div class="toolbar"><select v-model="activeGroup" aria-label="Grup filtresi"><option value="">Tüm gruplar</option><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select><input v-model="monthFilter" type="month" aria-label="Sınav ayı"><button v-if="monthFilter" class="icon-btn" aria-label="Ay filtresini temizle" @click="monthFilter=''"><Icon name="lucide:x" /></button></div>
        <section class="panel overflow-hidden"><div v-if="!filteredExams.length" class="empty">Sınav bulunamadı.</div><div v-else class="table-wrap"><table><thead><tr><th>Sınav</th><th>Grup</th><th>Ay</th><th>Sonuç</th><th>Durum</th><th></th></tr></thead><tbody><tr v-for="e in filteredExams" :key="e.id"><td><span class="font-medium">{{ e.title }}</span><small class="block mt-1">{{ e.answerKey.length }} soru</small></td><td class="muted">{{ e.group.name }}</td><td class="muted">{{ e.month }}</td><td class="muted">{{ e._count.results }}</td><td><span class="pill" :class="{'pill-neutral':e.status==='CLOSED'}">{{ e.status==='OPEN'?'Açık':'Kapalı' }}</span></td><td><div class="flex justify-end gap-2"><button class="btn text-xs" :disabled="busy" @click="toggleExam(e)">{{ e.status==='OPEN'?'Kapat':'Yeniden aç' }}</button><button class="icon-btn danger" aria-label="Sınavı sil" @click="askDelete('exams',e.id,e.title)"><Icon name="lucide:trash-2" /></button></div></td></tr></tbody></table></div></section>
      </template>
      <section v-if="section === 'approvals'" class="panel overflow-hidden"><div v-if="!dashboard?.requests.length" class="empty">Bekleyen talep yok.</div><div v-for="r in dashboard?.requests" :key="r.id" class="px-5 py-4 border-b divider last:border-0 flex flex-wrap items-center gap-3"><div class="mr-auto"><h3>{{ r.student.firstName }} {{ r.student.lastName }}</h3><p class="text-xs muted mt-1">{{ new Date(r.createdAt).toLocaleDateString('tr') }}</p></div><button class="btn danger" :disabled="busy" @click="review(r.id,false)">Reddet</button><button class="btn primary" :disabled="busy" @click="review(r.id,true)">Onayla</button></div></section>
    </main>
  <div v-if="modal" class="overlay" @click.self="!busy && (modal='')" @keydown.esc="!busy && (modal='')"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" class="modal" :class="modal==='profile'?'wide':''"><div class="modal-head"><h2 id="modal-title">{{ ({group:groupForm.id?'Grubu düzenle':'Yeni grup',student:studentForm.id?'Öğrenciyi düzenle':'Yeni öğrenci',transfer:'Grup transferi',invite:'Kişisel erişim bağlantısı',exam:'Yeni grup sınavı',result:'Sınav sonucu yükle',profile:'Öğrenci profili',confirm:'Silme onayı'} as Record<string,string>)[modal] }}</h2><button class="icon-btn" :disabled="busy" aria-label="Pencereyi kapat" @click="modal='' ; studentForm.password='' "><Icon name="lucide:x" size="20" /></button></div>
  <p v-if="error" class="error mb-5" role="alert">{{ error }}</p><p v-if="notice" class="notice mb-5" role="status">{{ notice }}</p>
  <form v-if="modal==='group'" @submit.prevent="saveGroup"><div class="field"><label for="group-name">Grup adı</label><input id="group-name" v-model="groupForm.name" autofocus required maxlength="100" placeholder="Örn. 8. Sınıf · Matematik"></div><div class="actions"><button type="button" class="btn" @click="modal=''">Vazgeç</button><button class="btn primary" :disabled="busy">Kaydet</button></div></form>
  <form v-if="modal==='student'" @submit.prevent="saveStudent"><div class="grid grid-cols-2 gap-x-4"><div class="field"><label for="first-name">İsim <span class="text-brand">*</span></label><input id="first-name" v-model="studentForm.firstName" required maxlength="80"></div><div class="field"><label for="last-name">Soy isim</label><input id="last-name" v-model="studentForm.lastName" maxlength="80"></div><div class="field"><label for="birth">Doğum tarihi</label><input id="birth" v-model="studentForm.birthDate" type="date" :max="new Date().toISOString().slice(0,10)"></div><div class="field"><label for="phone">Telefon</label><input id="phone" v-model="studentForm.phone" type="tel" maxlength="30"></div></div><div class="field"><label for="student-group">Grup</label><select id="student-group" v-model="studentForm.groupId" required><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="field"><label for="student-password">{{ studentForm.id?'Yeni şifre (boşsa değişmez)':'Şifre (isteğe bağlı)' }}</label><input id="student-password" v-model="studentForm.password" type="password" minlength="8" maxlength="72" autocomplete="new-password"></div><p class="text-xs muted">Buradan belirlenen şifre hemen etkinleşir.</p><div class="actions"><button type="button" class="btn" @click="modal=''">Vazgeç</button><button class="btn primary" :disabled="busy">Kaydet</button></div></form>
  <form v-if="modal==='transfer'" @submit.prevent="transfer"><p class="muted mb-5">{{ selected.length }} öğrenci taşınacak. Sınav geçmişi korunur.</p><div class="field"><label for="target">Hedef grup</label><select id="target" v-model="transferGroup" required><option value="" disabled>Grup seçin</option><option v-for="g in groups.filter(g=>g.id!==activeGroup)" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="actions"><button class="btn primary" :disabled="busy || !transferGroup">Öğrencileri taşı</button></div></form>
  <div v-if="modal==='invite'"><p class="muted mb-5">30 gün geçerli. Yeni bağlantı önceki bağlantıyı iptal eder.</p><label for="invite-link">Kişisel bağlantı</label><input id="invite-link" :value="inviteUrl" readonly @focus="($event.target as HTMLInputElement).select()"><p class="text-xs muted my-4">Öğrenci ID: <strong class="break-all">{{ inviteStudentId }}</strong></p><div class="notice text-xs">Şifre, onayınızdan sonra etkinleşir.</div><div class="actions"><button class="btn primary" @click="copyInvite"><Icon name="lucide:copy" />Bağlantıyı kopyala</button></div></div>
  <form v-if="modal==='exam'" @submit.prevent="saveExam"><div class="field"><label for="exam-title">Sınav adı</label><input id="exam-title" v-model="examForm.title" required maxlength="120" placeholder="Ekim ayı değerlendirmesi"></div><div class="grid grid-cols-2 gap-4"><div class="field"><label for="exam-group">Grup</label><select id="exam-group" v-model="examForm.groupId" required><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="field"><label for="exam-month">Sınav ayı</label><input id="exam-month" v-model="examForm.month" type="month" required></div></div><div class="field"><label for="answer-key">Cevap anahtarı</label><textarea id="answer-key" v-model="examForm.key" rows="3" required placeholder="A B C D E A B C"></textarea><small>A–E, boşlukla ayırın. En fazla 200 soru.</small></div><div class="field"><label for="topics">Soru konuları (isteğe bağlı)</label><input id="topics" v-model="examForm.topics" placeholder="Kesirler, Kesirler, Geometri, Denklemler"><small>Soru sırasıyla, virgülle ayırın.</small></div><div class="actions"><button class="btn primary" :disabled="busy">Sınavı başlat</button></div></form>
  <form v-if="modal==='result'" @submit.prevent="saveResult"><p class="muted mb-5">{{ profile?.firstName }} {{ profile?.lastName }} için cevapları girin veya cevap dosyasını yükleyin.</p><div class="field"><label for="result-exam">Sınav</label><select id="result-exam" v-model="resultForm.examId" required @change="changedExam"><option value="" disabled>Sınav seçin</option><option v-for="e in eligibleExams" :key="e.id" :value="e.id">{{ e.month }} · {{ e.title }}</option></select></div><div class="field"><label for="result-file">Cevap dosyası (.txt, .csv, .json)</label><input id="result-file" type="file" accept=".txt,.csv,.json" @change="uploadAnswers"><small>JSON: { "answers": ["A", "B", null, "D"] }</small></div><div class="field"><label for="answers">Öğrenci cevapları{{ availableExam ? ` · ${availableExam.answerKey.length} soru` : '' }}</label><textarea id="answers" v-model="resultForm.answers" required rows="4" placeholder="A B - D E"></textarea><small>Boş cevap: - . Yeniden kayıt mevcut sonucu günceller.</small></div><div class="actions"><button type="button" class="btn" @click="modal='profile'">Profile dön</button><button class="btn primary" :disabled="busy || !resultForm.examId">Analiz et ve kaydet</button></div></form>
  <template v-if="modal==='profile' && profile"><div class="profile-grid"><aside><span class="avatar !w-16 !h-16 !text-xl mb-4">{{ profile.firstName[0] }}{{ profile.lastName?.[0] }}</span><h2>{{ profile.firstName }} {{ profile.lastName }}</h2><span class="pill mt-3">{{ profile.group?.name }}</span><div class="mt-6 space-y-3 text-xs muted"><p class="flex items-center gap-2"><Icon name="lucide:phone" />{{ profile.phone || 'Telefon belirtilmemiş' }}</p><p class="flex items-center gap-2"><Icon name="lucide:cake" />{{ profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('tr') : 'Doğum tarihi belirtilmemiş' }}</p><p class="break-all text-[10px]">ID: {{ profile.id }}</p></div><div class="mt-6 grid gap-2"><button class="btn primary" :disabled="!eligibleExams.length" @click="openResult()"><Icon name="lucide:upload" />Sonuç yükle</button><button class="btn" @click="openStudent(profile)">Profili düzenle</button><button class="btn" @click="createInvite(profile)"><Icon name="lucide:link" />Şifre bağlantısı</button></div></aside><div class="min-w-0"><div class="flex justify-between gap-4 items-center mb-5"><h3>Performans özeti</h3><input v-model="monthFilter" type="month" class="!w-auto" aria-label="Performans ay filtresi"><button v-if="monthFilter" class="icon-btn" aria-label="Ay filtresini temizle" @click="monthFilter=''"><Icon name="lucide:x" /></button></div><div class="profile-metrics"><div><small>Sınav</small><p>{{ profileResults.length }}</p></div><div><small>Ortalama</small><p class="text-brand">%{{ profileAverage }}</p></div><div><small>Doğru</small><p>{{ profileResults.reduce((a,r)=>a+r.correct,0) }}</p></div></div><div v-if="monthlyResults.length" class="result-row"><p class="text-xs muted">Aylık başarı</p><div class="bars"><div v-for="r in monthlyResults" :key="r.month" class="bar-col"><span>%{{ r.score }}</span><div class="bar" :style="{height:Math.max(3,r.score*.8)+'px'}" /><span>{{ r.month }}</span></div></div></div><div v-if="!profileResults.length" class="empty">Bu dönemde henüz sınav sonucu yok.</div><article v-for="r in profileResults" :key="r.id" class="result-row"><div class="flex items-start justify-between gap-3"><div><h3>{{ r.exam.title }}</h3><p class="muted text-xs mt-1">{{ r.exam.month }} · {{ r.exam.group?.name || 'Geçmiş sınav' }}</p></div><strong class="text-xl text-brand">%{{ r.score }}</strong></div><div class="flex gap-4 text-xs my-4"><span class="text-success">{{ r.correct }} doğru</span><span class="danger">{{ r.wrong }} yanlış</span><span class="muted">{{ r.blank }} boş</span></div><div v-for="(t,name) in r.topicAnalysis" :key="name" class="flex justify-between text-xs border-t divider py-2"><span class="muted">{{ name }}</span><span>{{ t.correct }} D / {{ t.wrong }} Y / {{ t.blank }} B</span></div><button v-if="r.exam.status==='OPEN'" class="text-xs text-brand mt-3" @click="openResult(r)">Cevapları güncelle →</button></article></div></div></template>
  <div v-if="modal==='confirm'"><p class="muted leading-6">{{ confirmText }}</p><div class="actions"><button class="btn" @click="modal=''">Vazgeç</button><button class="btn btn-danger" :disabled="busy" @click="confirmAction && run(confirmAction)">Kalıcı olarak sil</button></div></div>
  </section></div>
</div></template>
