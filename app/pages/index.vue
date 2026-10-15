<script setup lang="ts">
import { useErrorMessage } from '~/composables/useErrorMessage'
import { createResourceCache } from '~/utils/resourceCache'
const { t, locale } = useI18n()
const errorMessage = useErrorMessage()
type Group = { id: string; name: string; position: number; _count: { students: number; exams: number } }
type Student = { id: string; firstName: string; lastName: string | null; birthDate: string | null; phone: string | null; groupId: string; group?: { name: string }; _count?: { results: number } }
type Exam = { id: string; title: string; month: string; groupId: string; questionCount: number; status: string; group: { name: string }; _count: { results: number } }
type Result = { id: string; score: number; correct: number; wrong: number; blank: number; answers: (string | null)[]; exam: Exam; topicAnalysis: Record<string, { correct: number; wrong: number; blank: number }> }
const { data: me } = await useFetch<{ role: string; name: string; id?: string } | null>('/api/auth/me')
if (!me.value) await navigateTo('/giris')
else if (me.value.role !== 'ADMIN') await navigateTo('/hesabim')
const { data: dashboard, refresh: fetchDashboard, error: initialError } = await useFetch<{ groups: Group[]; exams: Exam[]; requests: { id: string; createdAt: string; student: Student }[] }>('/api/dashboard', {key:'mymath-dashboard'})
const cache = createResourceCache()
if (dashboard.value) cache.prime('requests', dashboard.value.requests, 15000)
onUnmounted(() => cache.clear())
async function refreshDashboard() { await fetchDashboard(); if (dashboard.value) cache.prime('requests',dashboard.value.requests,15000) }
async function refreshRequests(force = false) {
  if (force) cache.invalidate('requests')
  let requests
  try { requests = await cache.read('requests', signal => api('/api/password-requests', { signal }), 15000) }
  catch (error:any) { if (error.response?.status===401) { cache.clear(); clearNuxtData(); await navigateTo('/giris') }; throw error }
  if (dashboard.value) dashboard.value.requests = requests
}
function invalidateStudents(...ids: string[]) {
  cache.invalidate('students:all')
  for (const id of ids) if (id) cache.invalidate(`students:${id}`)
}
const sidebarCollapsed = useCookie<boolean>('mymath-sidebar-collapsed', { default: () => false, maxAge: 31536000 })
onMounted(() => {
  const refresh = () => { if (document.visibilityState === 'visible') void refreshRequests().catch(() => {}) }
  const timer = window.setInterval(refresh, 30000)
  window.addEventListener('focus', refresh)
  onUnmounted(() => { window.clearInterval(timer); window.removeEventListener('focus', refresh) })
})
const visited = reactive(new Set(['groups']))
const section = ref('groups')
type View = { groupId:string; search:string; selected:string[]; month:string }
const views = reactive<Record<string,View>>({ groups:{groupId:'',search:'',selected:[],month:''}, students:{groupId:'',search:'',selected:[],month:''}, exams:{groupId:'',search:'',selected:[],month:''} })
const activeGroup = computed({get:()=>views[section.value]!.groupId,set:(value:string)=>{views[section.value]!.groupId=value}})
const search = computed({get:()=>views[section.value]!.search,set:(value:string)=>{views[section.value]!.search=value}})
const selected = computed({get:()=>views[section.value]!.selected,set:(value:string[])=>{views[section.value]!.selected=value}})
const monthFilter = computed({get:()=>views[section.value]!.month,set:(value:string)=>{views[section.value]!.month=value}})
const originalStudentGroup = ref('')
const students = ref<Student[]>([]), profile = ref<(Student & { results: Result[] }) | null>(null)
const modal = ref(''), error = ref(''), notice = ref(''), busy = ref(false), loadingStudents = ref(false)
const groupForm = reactive({ id: '', name: '' })
const studentForm = reactive({ id: '', firstName: '', lastName: '', birthDate: '', phone: '', password: '', groupId: '' })
const examForm = reactive({ title: '', month: new Date().toISOString().slice(0, 7), groupId: '', key: '', topics: '' })
const resultForm = reactive({ examId: '', answers: '', originalName: '' })
const securityStudent = ref<Student | null>(null)
const securityRequests = computed(() => (dashboard.value?.requests || []).filter(r => r.student.id === securityStudent.value?.id))
const pendingStudentIds = computed(() => new Set(dashboard.value?.requests.map(r => r.student.id)))
const hasPending = (id: string) => pendingStudentIds.value.has(id)
async function openSecurity(student: Student) { resetError(); securityStudent.value = student; copied.value = false; clearTimeout(copyTimer); inviteUrl.value = ''; modal.value = 'security'; await run(refreshRequests) }
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(copyTimer))
const transferGroup = ref(''), inviteUrl = ref('')
const confirmAction = ref<null | (() => Promise<void>)>(null), confirmText = ref('')
const groups = computed(() => (dashboard.value?.groups || []) as Group[])
const exams = computed(() => (dashboard.value?.exams || []) as unknown as Exam[])
const filteredGroups = computed(() => groups.value.filter(g => g.name.toLocaleLowerCase(locale.value).includes(views.groups!.search.toLocaleLowerCase(locale.value))))
const currentGroup = computed(() => groups.value.find(g => g.id === activeGroup.value))
const filteredStudents = computed(() => students.value.filter(s => `${s.firstName} ${s.lastName || ''} ${s.phone || ''}`.toLocaleLowerCase(locale.value).includes(views.students!.search.toLocaleLowerCase(locale.value))))
const filteredExams = computed(() => exams.value.filter(e => (!views.exams!.groupId || e.groupId === views.exams!.groupId) && (!views.exams!.month || e.month === views.exams!.month)))
const profileResults = computed(() => (profile.value?.results || []).filter(r => !monthFilter.value || r.exam.month === monthFilter.value))
const profileAverage = computed(() => profileResults.value.length ? Math.round(profileResults.value.reduce((a, r) => a + r.score, 0) / profileResults.value.length) : 0)
const monthlyResults = computed(() => {
  const months = new Map<string, number[]>()
  for (const r of profileResults.value) { const list = months.get(r.exam.month) || []; list.push(r.score); months.set(r.exam.month, list) }
  return [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, values]) => ({ month, score: Math.round(values.reduce((a,b) => a+b,0)/values.length) }))
})
const eligibleExams = computed(() => exams.value.filter(e => e.status === 'OPEN' && (e.groupId === profile.value?.groupId || profile.value?.results.some(r => r.exam.id === e.id))))
const availableExam = computed(() => exams.value.find(e => e.id === resultForm.examId))
const title = computed(() => section.value === 'students' ? (currentGroup.value?.name || t('allStudents')) : section.value === 'exams' ? t('exams') : t('groups'))
function resetError() { error.value = ''; notice.value = '' }
async function run(action: () => Promise<void>) {
  if (busy.value) return
  busy.value = true; error.value = ''
  try { await action() } catch (e: any) { error.value = errorMessage(e.data?.statusMessage) } finally { busy.value = false }
}
let studentLoad: AbortController | undefined
let studentResourceKey = ''
onUnmounted(() => studentLoad?.abort())
async function loadStudents() {
  const groupId=views.students!.groupId
  const key=`students:${groupId || 'all'}`
  if (loadingStudents.value && studentResourceKey !== key) cache.invalidate(studentResourceKey)
  studentResourceKey=key
  studentLoad?.abort()
  const controller = new AbortController()
  studentLoad = controller
  loadingStudents.value = true
  try { const rows = await cache.read(key, signal => api('/api/students', { query: groupId ? { groupId } : {}, signal }) as Promise<Student[]>); if (!controller.signal.aborted) students.value = rows }
  catch (error) { if (!controller.signal.aborted) throw error }
  finally { if (studentLoad === controller) loadingStudents.value = false }
}
async function navigate(to: string, groupId?: string) {
  if (!views[to]) return
  resetError(); modal.value = ''; visited.add(to); section.value = to
  if (groupId !== undefined && views[to]!.groupId !== groupId) { views[to]!.groupId=groupId; views[to]!.search=''; views[to]!.selected=[] }
  if (to === 'students') { try { await loadStudents() } catch (e:any) { error.value = errorMessage(e.data?.statusMessage) } }
}
async function refreshCurrent() { await run(async () => {
  if (section.value==='students') { invalidateStudents(views.students!.groupId); await loadStudents(); await refreshRequests(true) }
  else await refreshDashboard()
}) }

function openGroup(g?: Group) { resetError(); Object.assign(groupForm, { id: g?.id || '', name: g?.name || '' }); modal.value = 'group' }
async function saveGroup() { await run(async () => { await api(`/api/groups${groupForm.id ? '/' + groupForm.id : ''}`, { method: groupForm.id ? 'PUT' : 'POST', body: { name: groupForm.name } }); cache.invalidate('students:'); cache.invalidate('profile:'); await refreshDashboard(); modal.value = '' }) }
async function moveGroup(g: Group, direction: number) { await run(async () => { const ids = groups.value.map(g => g.id); const i = ids.indexOf(g.id); const j = i + direction; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j]!, ids[i]!]; await api('/api/groups/reorder', { method: 'PUT', body: { ids } }); await refreshDashboard() }) }
function askDelete(kind: string, id: string, name: string) {
  resetError(); confirmText.value = `${t('deletePrompt',{name})} ${kind === 'groups' ? t('deleteGroupHelp') : kind === 'students' ? t('deleteStudentHelp') : t('deleteExamHelp')}`
  confirmAction.value = async () => { await api(`/api/${kind}/${id}`, { method: 'DELETE' }); cache.invalidate('students:'); cache.invalidate('profile:'); await refreshDashboard(); if (section.value === 'students') await loadStudents(); if (kind === 'students') profile.value = null; modal.value = '' }
  modal.value = 'confirm'
}
function openStudent(student?: Student) { resetError(); originalStudentGroup.value=student?.groupId || '';  Object.assign(studentForm, { id: student?.id || '', firstName: student?.firstName || '', lastName: student?.lastName || '', birthDate: student?.birthDate?.slice(0, 10) || '', phone: student?.phone || '', password: '', groupId: student?.groupId || activeGroup.value || groups.value[0]?.id || '' }); modal.value = 'student' }
async function saveStudent() { await run(async () => { const { id, password, ...rest } = studentForm; await api(`/api/students${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: { ...rest, birthDate: rest.birthDate || null, ...(password ? { password } : {}) } }); studentForm.password = ''; invalidateStudents(originalStudentGroup.value,rest.groupId); if(id) cache.invalidate(`profile:${id}`); await Promise.all([loadStudents(), refreshDashboard()]); modal.value = ''; if (profile.value?.id === id) await loadProfile(id) }) }
async function loadProfile(id: string) { profile.value = await cache.read(`profile:${id}`,signal=>api(`/api/students/${id}`,{signal}) as Promise<Student & {results:Result[]}>) }
async function openProfile(s: Student) { await run(async () => { await loadProfile(s.id); monthFilter.value = ''; modal.value = 'profile' }) }
function openTransfer() { resetError(); transferGroup.value = groups.value.find(g => g.id !== activeGroup.value)?.id || ''; modal.value = 'transfer' }
async function transfer() { await run(async () => { await api('/api/students/transfer', { method: 'POST', body: { ids: selected.value, groupId: transferGroup.value } }); cache.invalidate('students:'); for (const id of selected.value) cache.invalidate(`profile:${id}`); selected.value = []; await Promise.all([loadStudents(), refreshDashboard()]); modal.value = '' }) }
async function createInvite(s: Student) { await run(async () => { const r = await api(`/api/students/${s.id}/invite`, { method: 'POST' }); inviteUrl.value = r.url; modal.value = 'security' }) }
async function copyInvite() {
  try { await navigator.clipboard.writeText(inviteUrl.value); copied.value = true; clearTimeout(copyTimer); copyTimer = setTimeout(() => { copied.value = false }, 1800) }
  catch { error.value = t('copyManually') }
}
async function review(id: string, approve: boolean) { await run(async () => { await api(`/api/password-requests/${id}`, { method: 'POST', body: { approve } }); await refreshRequests(true); notice.value = approve ? t('approvedNotice') : t('rejectedNotice') }) }
function openExam() { resetError(); Object.assign(examForm, { title: '', month: new Date().toISOString().slice(0, 7), groupId: activeGroup.value || groups.value[0]?.id || '', key: '', topics: '' }); modal.value = 'exam' }
function parseAnswers(value: string): (string | null)[] { return value.toUpperCase().trim().split(/[\s,;]+/).filter(Boolean).map(a => a === '-' || a === '_' ? null : a) }
async function saveExam() { await run(async () => { await api('/api/exams', { method: 'POST', body: { title: examForm.title, month: examForm.month, groupId: examForm.groupId, answerKey: parseAnswers(examForm.key), topics: examForm.topics.trim() ? examForm.topics.split(',').map(t => t.trim()) : [] } }); await refreshDashboard(); modal.value = ''; visited.add('exams'); views.exams!.groupId=examForm.groupId; views.exams!.month=examForm.month; section.value = 'exams' }) }
async function toggleExam(e: Exam) { await run(async () => { await api(`/api/exams/${e.id}`, { method: 'PUT', body: { status: e.status === 'OPEN' ? 'CLOSED' : 'OPEN' } }); cache.invalidate('profile:'); await refreshDashboard() }) }
function openResult(r?: Result) { resetError(); resultForm.examId = r?.exam.id || eligibleExams.value[0]?.id || ''; resultForm.answers = r?.answers.map(a => a || '-').join(' ') || ''; resultForm.originalName = ''; modal.value = 'result' }
function changedExam() { const previous = profile.value?.results.find(r => r.exam.id === resultForm.examId); resultForm.answers = previous?.answers.map(a => a || '-').join(' ') || ''; resultForm.originalName = '' }
async function uploadAnswers(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]
  if (!file) return
  error.value = ''
  try {
    if (file.size > 256000) throw new Error(t('fileSize'))
    const text = await file.text()
    if (file.name.toLowerCase().endsWith('.json')) { const data = JSON.parse(text); if (!Array.isArray(data.answers)) throw new Error(t('jsonAnswers')); resultForm.answers = data.answers.map((a: any) => a === null ? '-' : String(a)).join(' ') }
    else resultForm.answers = text.trim()
    resultForm.originalName = file.name
  } catch (e: any) { error.value = e.message } finally { input.value = '' }
}
async function saveResult() { await run(async () => { if (!profile.value) return; await api('/api/results', { method: 'POST', body: { examId: resultForm.examId, studentId: profile.value.id, answers: parseAnswers(resultForm.answers), originalName: resultForm.originalName || undefined } }); cache.invalidate(`profile:${profile.value.id}`); invalidateStudents(profile.value.groupId); await loadProfile(profile.value.id); const row=students.value.find(s=>s.id===profile.value?.id); if(row?._count) row._count.results=profile.value.results.length; await refreshDashboard(); modal.value = 'profile'; notice.value = t('resultSaved') }) }
async function logout() { await run(async()=>{ await api('/api/auth/logout', { method: 'POST' }); cache.clear(); clearNuxtData(); await navigateTo('/giris') }) }
function selectAll(event: Event) { selected.value = (event.target as HTMLInputElement).checked ? filteredStudents.value.map(s => s.id) : [] }
</script>

<template>
  <div class="shell" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <AppSidebar v-model:collapsed="sidebarCollapsed" :section="section" @navigate="navigate" @logout="logout" />
    <main class="content min-w-0">
      <header class="page-head">
        <div class="flex items-center gap-2"><h1>{{ title }}</h1><button class="icon-btn" :disabled="busy" :aria-label="t('refreshData')" :title="t('refreshData')" @click="refreshCurrent"><Icon name="lucide:refresh-cw" size="16" /></button></div>
        <button v-if="section === 'groups'" class="btn primary" @click="openGroup()"><Icon name="lucide:plus" />{{ t('addGroup') }}</button>
        <button v-if="section === 'students'" class="btn primary" :disabled="!groups.length" @click="openStudent()"><Icon name="lucide:plus" />{{ t('addStudent') }}</button>
        <button v-if="section === 'exams'" class="btn primary" :disabled="!groups.length" @click="openExam"><Icon name="lucide:plus" />{{ t('startExam') }}</button>
      </header>
      <p v-if="(error || initialError) && !modal" class="error mb-4" role="alert">{{ error || errorMessage(initialError?.statusMessage,'dataUnavailable') }}</p>
      <p v-if="notice && !modal" class="notice mb-4" role="status">{{ notice }}</p>
      <section v-if="visited.has('groups')" v-show="section === 'groups'" class="view-pane">
        <div v-if="groups.length" class="toolbar"><input v-model="views.groups!.search" :aria-label="t('searchGroup')" :placeholder="t('searchGroup')"><span class="text-xs muted">{{ groups.length }} {{ t('group') }}</span></div>
        <AppTable :rows="filteredGroups" :columns="[{key:'name',label:'group'}, {key:'students',label:'student',value:g=>g._count.students}, {key:'exams',label:'exam',value:g=>g._count.exams}, {key:'actions'}]" :empty="views.groups!.search ? t('groupNotFound') : t('noGroups')">
          <template #name="{row:g}"><button class="row-link" @click="navigate('students',g.id)">{{ g.name }}</button></template>
          <template #actions="{row:g}"><div class="row-actions"><button class="icon-btn" :disabled="busy || groups[0]?.id===g.id" :aria-label="t('moveUp')" @click="moveGroup(g,-1)"><Icon name="lucide:arrow-up" /></button><button class="icon-btn" :disabled="busy || groups.at(-1)?.id===g.id" :aria-label="t('moveDown')" @click="moveGroup(g,1)"><Icon name="lucide:arrow-down" /></button><button class="icon-btn" :aria-label="t('editGroup')" @click="openGroup(g)"><Icon name="lucide:pencil" /></button><button class="icon-btn danger" :aria-label="t('deleteGroup')" @click="askDelete('groups',g.id,g.name)"><Icon name="lucide:trash-2" /></button></div></template>
        </AppTable>
      </section>
      <section v-if="visited.has('students')" v-show="section === 'students'" class="view-pane">
        <div class="toolbar"><select v-model="views.students!.groupId" aria-label="Grup filtresi" @change="selected=[];loadStudents().catch(e => error=errorMessage(e.data?.statusMessage))"><option value="">{{ t('allGroups') }}</option><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select><input v-model="views.students!.search" :aria-label="t('searchStudent')" :placeholder="t('searchStudent')"><button v-if="selected.length" class="btn ml-auto" @click="openTransfer"><Icon name="lucide:arrow-right-left" />{{ t('transfer') }} ({{ selected.length }})</button></div>
        <AppTable :rows="filteredStudents" :loading="loadingStudents" :columns="[{key:'select'}, {key:'name',label:'student',sortable:true,value:s=>s.firstName+' '+(s.lastName||'')}, {key:'group',label:'group',sortable:true,value:s=>s.group?.name}, {key:'phone',label:'phone'}, {key:'exams',label:'exam',sortable:true,value:s=>s._count?.results||0}, {key:'actions'}]" :empty="views.students!.search ? t('studentNotFound') : t('noStudents')">
          <template #header-select><input type="checkbox" :aria-label="t('selectAll')" :checked="filteredStudents.length>0 && filteredStudents.every(s=>selected.includes(s.id))" @change="selectAll"></template>
          <template #select="{row:s}"><input v-model="selected" type="checkbox" :value="s.id" :aria-label="t('selectStudent',{name:s.firstName})"></template>
          <template #name="{row:s}"><button class="row-link" @click="openProfile(s)">{{ s.firstName }} {{ s.lastName }}</button></template>
          <template #actions="{row:s}"><div class="row-actions"><button class="icon-btn" :aria-label="t('editStudent')" @click="openStudent(s)"><Icon name="lucide:pencil" /></button><button class="icon-btn security-button" :aria-label="hasPending(s.id) ? t('securityPending') : t('security')" :title="hasPending(s.id) ? t('securityPending') : t('security')" @click="openSecurity(s)"><Icon name="lucide:shield-check" /><span v-if="hasPending(s.id)" class="pending-dot" /></button><button class="icon-btn danger" :aria-label="t('deleteStudent')" @click="askDelete('students',s.id,s.firstName)"><Icon name="lucide:trash-2" /></button></div></template>
        </AppTable>
      </section>
      <section v-if="visited.has('exams')" v-show="section === 'exams'" class="view-pane">
        <div class="toolbar"><select v-model="views.exams!.groupId" aria-label="Grup filtresi"><option value="">{{ t('allGroups') }}</option><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select><input v-model="views.exams!.month" type="month" :aria-label="t('examMonth')"><button v-if="views.exams!.month" class="icon-btn" :aria-label="t('clearMonth')" @click="views.exams!.month=''"><Icon name="lucide:x" /></button></div>
        <AppTable :rows="filteredExams" :columns="[{key:'title',label:'exam',sortable:true},{key:'group',label:'group',sortable:true,value:e=>e.group.name},{key:'month',label:'month',sortable:true},{key:'results',label:'result',sortable:true,value:e=>e._count.results},{key:'status',label:'status'},{key:'actions'}]" :empty="t('examNotFound')">
          <template #title="{row:e}"><span class="font-medium">{{ e.title }}</span><small class="block mt-1">{{ t('questionCount',{count:e.questionCount}) }}</small></template>
          <template #status="{row:e}"><span class="pill" :class="{'pill-neutral':e.status==='CLOSED'}">{{ e.status==='OPEN'?t('open'):t('closed') }}</span></template>
          <template #actions="{row:e}"><div class="row-actions"><button class="btn text-xs" :disabled="busy" @click="toggleExam(e)">{{ e.status==='OPEN'?t('close'):t('reopen') }}</button><button class="icon-btn danger" :aria-label="t('deleteExam')" @click="askDelete('exams',e.id,e.title)"><Icon name="lucide:trash-2" /></button></div></template>
        </AppTable>
      </section>

    </main>
  <Transition name="modal"><div v-if="modal" class="overlay" @click.self="!busy && (modal='')" @keydown.esc="!busy && (modal='')"><section role="dialog" aria-modal="true" aria-labelledby="modal-title" class="modal" :class="modal==='profile'?'wide':''"><div class="modal-head"><h2 id="modal-title" :class="{'person-name':modal==='security'}">{{ ({group:groupForm.id?t('editGroup'):t('newGroup'),student:studentForm.id?t('editStudent'):t('newStudent'),transfer:t('transferTitle'),security:securityStudent ? `${securityStudent.firstName} ${securityStudent.lastName || ''}`.trim() : t('security'),exam:t('newGroupExam'),result:t('uploadExamResult'),profile:t('profile'),confirm:t('deleteConfirmation')} as Record<string,string>)[modal] }}</h2><button class="icon-btn" :disabled="busy" :aria-label="t('closeWindow')" @click="modal='' ; studentForm.password='' "><Icon name="lucide:x" size="20" /></button></div>
  <p v-if="error" class="error mb-5" role="alert">{{ error }}</p><p v-if="notice" class="notice mb-5" role="status">{{ notice }}</p>
  <form v-if="modal==='group'" @submit.prevent="saveGroup"><div class="field"><label for="group-name">{{ t('groupName') }}</label><input id="group-name" v-model="groupForm.name" autofocus required maxlength="100" :placeholder="t('exampleGroup')"></div><div class="actions"><button type="button" class="btn" @click="modal=''">{{ t('cancel') }}</button><button class="btn primary" :disabled="busy">{{ t('save') }}</button></div></form>
  <form v-if="modal==='student'" @submit.prevent="saveStudent"><div class="grid grid-cols-2 gap-x-4"><div class="field"><label for="first-name">{{ t('firstName') }}<span class="text-brand">*</span></label><input id="first-name" v-model="studentForm.firstName" required maxlength="80"></div><div class="field"><label for="last-name">{{ t('lastName') }}</label><input id="last-name" v-model="studentForm.lastName" maxlength="80"></div><div class="field"><label for="phone">{{ t('phone') }}</label><input id="phone" v-model="studentForm.phone" type="tel" maxlength="30"></div></div><div class="field"><label for="student-group">{{ t('group') }}</label><select id="student-group" v-model="studentForm.groupId" required><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="field"><label for="student-password">{{ studentForm.id?t('editPassword'):t('optionalPassword') }}</label><input id="student-password" v-model="studentForm.password" type="password" minlength="8" maxlength="72" autocomplete="new-password"></div><div class="actions"><button type="button" class="btn" @click="modal=''">{{ t('cancel') }}</button><button class="btn primary" :disabled="busy">{{ t('save') }}</button></div></form>
  <form v-if="modal==='transfer'" @submit.prevent="transfer"><p class="muted mb-5">{{ t('transferNotice',{count:selected.length}) }}</p><div class="field"><label for="target">{{ t('targetGroup') }}</label><select id="target" v-model="transferGroup" required><option value="" disabled>{{ t('selectGroup') }}</option><option v-for="g in groups.filter(g=>g.id!==activeGroup)" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="actions"><button class="btn primary" :disabled="busy || !transferGroup">{{ t('moveStudents') }}</button></div></form>
  <div v-if="modal==='security' && securityStudent">

    <div v-for="request in securityRequests" :key="request.id" class="security-request">
      <span class="flex items-center gap-2 text-sm"><span class="pending-dot inline-dot" />{{ t('pendingPassword') }}</span>
      <div class="flex gap-2 mt-4"><button class="btn danger" :disabled="busy" @click="review(request.id,false)">{{ t('reject') }}</button><button class="btn primary" :disabled="busy" @click="review(request.id,true)">{{ t('approve') }}</button></div>
    </div>
    <p v-if="!securityRequests.length" class="muted text-sm mb-5">{{ t('noRequests') }}</p>
    <div v-if="inviteUrl"><label for="invite-link">{{ t('linkLabel') }}</label><div class="copy-field"><input id="invite-link" :value="inviteUrl" readonly @focus="($event.target as HTMLInputElement).select()"><button class="icon-btn" :aria-label="copied ? t('copied') : t('copyLink')" :title="copied ? t('copied') : t('copyLink')" @click="copyInvite"><Icon :name="copied ? 'lucide:check' : 'lucide:copy'" /></button></div></div>
    <button v-else class="btn" :disabled="busy" @click="createInvite(securityStudent)"><Icon name="lucide:link" />{{ t('createPasswordLink') }}</button>

  </div>
  <form v-if="modal==='exam'" @submit.prevent="saveExam"><div class="field"><label for="exam-title">{{ t('examName') }}</label><input id="exam-title" v-model="examForm.title" required maxlength="120" :placeholder="t('exampleExam')"></div><div class="grid grid-cols-2 gap-4"><div class="field"><label for="exam-group">{{ t('group') }}</label><select id="exam-group" v-model="examForm.groupId" required><option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option></select></div><div class="field"><label for="exam-month">{{ t('examMonth') }}</label><input id="exam-month" v-model="examForm.month" type="month" required></div></div><div class="field"><label for="answer-key">{{ t('answerKey') }}</label><textarea id="answer-key" v-model="examForm.key" rows="3" required placeholder="A B C D E A B C"></textarea><small>{{ t('answerHelp') }}</small></div><div class="field"><label for="topics">{{ t('topics') }}</label><input id="topics" v-model="examForm.topics" :placeholder="t('exampleTopics')"><small>{{ t('topicHelp') }}</small></div><div class="actions"><button class="btn primary" :disabled="busy">{{ t('startTheExam') }}</button></div></form>
  <form v-if="modal==='result'" @submit.prevent="saveResult"><p class="muted mb-5">{{ profile?.firstName }} {{ profile?.lastName }}</p><div class="field"><label for="result-exam">{{ t('exam') }}</label><select id="result-exam" v-model="resultForm.examId" required @change="changedExam"><option value="" disabled>{{ t('selectExam') }}</option><option v-for="e in eligibleExams" :key="e.id" :value="e.id">{{ e.month }} · {{ e.title }}</option></select></div><div class="field"><label for="result-file">{{ t('answerFile') }}</label><input id="result-file" type="file" accept=".txt,.csv,.json" @change="uploadAnswers"><small>JSON: { "answers": ["A", "B", null, "D"] }</small></div><div class="field"><label for="answers">{{ t('studentAnswers') }}{{ availableExam ? ` · ${t('questionCount',{count:availableExam.questionCount})}` : '' }}</label><textarea id="answers" v-model="resultForm.answers" required rows="4" placeholder="A B - D E"></textarea><small>{{ t('blankHelp') }}</small></div><div class="actions"><button type="button" class="btn" @click="modal='profile'">{{ t('backToProfile') }}</button><button class="btn primary" :disabled="busy || !resultForm.examId">{{ t('analyseSave') }}</button></div></form>
  <template v-if="modal==='profile' && profile"><div class="profile-grid"><aside><span class="avatar !w-16 !h-16 !text-xl mb-4">{{ profile.firstName[0] }}{{ profile.lastName?.[0] }}</span><h2>{{ profile.firstName }} {{ profile.lastName }}</h2><span class="pill mt-3">{{ profile.group?.name }}</span><div class="mt-6 space-y-3 text-xs muted"><p class="flex items-center gap-2"><Icon name="lucide:phone" />{{ profile.phone || t('noPhone') }}</p></div><div class="mt-6 grid gap-2"><button class="btn primary" :disabled="!eligibleExams.length" @click="openResult()"><Icon name="lucide:upload" />{{ t('uploadResult') }}</button><button class="btn" @click="openStudent(profile)">{{ t('editProfile') }}</button><button class="btn security-button" @click="openSecurity(profile)"><Icon name="lucide:shield-check" />{{ t('security') }}<span v-if="hasPending(profile.id)" class="pending-dot" /></button></div></aside><div class="min-w-0"><div class="flex justify-between gap-4 items-center mb-5"><h3>{{ t('performance') }}</h3><input v-model="monthFilter" type="month" class="!w-auto" :aria-label="t('performanceMonth')"><button v-if="monthFilter" class="icon-btn" :aria-label="t('clearMonth')" @click="monthFilter=''"><Icon name="lucide:x" /></button></div><div class="profile-metrics"><div><small>{{ t('exam') }}</small><p>{{ profileResults.length }}</p></div><div><small>{{ t('average') }}</small><p class="text-brand">%{{ profileAverage }}</p></div><div><small>{{ t('correct') }}</small><p>{{ profileResults.reduce((a,r)=>a+r.correct,0) }}</p></div></div><div v-if="monthlyResults.length" class="result-row"><p class="text-xs muted">{{ t('monthlySuccess') }}</p><div class="bars"><div v-for="r in monthlyResults" :key="r.month" class="bar-col"><span>%{{ r.score }}</span><div class="bar" :style="{height:Math.max(3,r.score*.8)+'px'}" /><span>{{ r.month }}</span></div></div></div><div v-if="!profileResults.length" class="empty">{{ t('noPeriodResults') }}</div><article v-for="r in profileResults" :key="r.id" class="result-row"><div class="flex items-start justify-between gap-3"><div><h3>{{ r.exam.title }}</h3><p class="muted text-xs mt-1">{{ r.exam.month }} · {{ r.exam.group?.name || t('pastExam') }}</p></div><strong class="text-xl text-brand">%{{ r.score }}</strong></div><div class="flex gap-4 text-xs my-4"><span class="text-success">{{ r.correct }} {{ t('correctLower') }}</span><span class="danger">{{ r.wrong }} {{ t('wrong') }}</span><span class="muted">{{ r.blank }} {{ t('blank') }}</span></div><div v-for="(stats,name) in r.topicAnalysis" :key="name" class="flex justify-between text-xs border-t divider py-2"><span class="muted">{{ name }}</span><span>{{ stats.correct }} {{ t('correctShort') }} / {{ stats.wrong }} {{ t('wrongShort') }} / {{ stats.blank }} {{ t('blankShort') }}</span></div><button v-if="r.exam.status==='OPEN'" class="text-xs text-brand mt-3" @click="openResult(r)">{{ t('updateAnswers') }}</button></article></div></div></template>
  <div v-if="modal==='confirm'"><p class="muted leading-6">{{ confirmText }}</p><div class="actions"><button class="btn" @click="modal=''">{{ t('cancel') }}</button><button class="btn btn-danger" :disabled="busy" @click="confirmAction && run(confirmAction)">{{ t('deleteForever') }}</button></div></div>
  </section></div></Transition>
</div></template>
