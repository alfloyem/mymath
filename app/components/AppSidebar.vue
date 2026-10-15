<script setup lang="ts">
defineProps<{ section: string }>()
const collapsed = defineModel<boolean>('collapsed', { required: true })
const emit = defineEmits<{ navigate: [section: string]; logout: [] }>()
const { t } = useI18n()
const open = ref(false), mobile = ref(false), drawer = ref<HTMLElement>(), trigger = ref<HTMLButtonElement>()
const items = [{ id: 'groups', icon: 'layout-grid' }, { id: 'students', icon: 'users' }, { id: 'exams', icon: 'notebook-pen' }]
function close() { open.value = false; trigger.value?.focus() }
function navigate(id: string) { emit('navigate', id); if (mobile.value) close() }
function trap(event: KeyboardEvent) {
  if (!mobile.value || !open.value || event.key !== 'Tab') return
  const controls = [...(drawer.value?.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, [tabindex="0"]') || [])].filter(el => el.getClientRects().length)
  const first = controls[0], last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
watch(open, async value => { if (value) { await nextTick(); drawer.value?.querySelector<HTMLButtonElement>('button')?.focus() } })
useHead(() => ({ bodyAttrs: { style: { overflow: mobile.value && open.value ? 'hidden' : undefined } } }))
onMounted(() => {
  const media = window.matchMedia('(max-width: 1023px)')
  const update = () => { mobile.value = media.matches; if (!media.matches) open.value = false }
  update(); media.addEventListener('change', update)
  onUnmounted(() => media.removeEventListener('change', update))
})
</script>
<template>
  <header class="mobile-bar"><button ref="trigger" class="icon-btn" :aria-label="t('openMenu')" :aria-expanded="open" aria-controls="app-sidebar" @click="open=true"><Icon name="lucide:menu" size="21" /></button><span class="brand">MyMath</span></header>
  <Transition name="fade"><button v-if="mobile && open" class="sidebar-backdrop" :aria-label="t('closeMenu')" tabindex="-1" @click="close" /></Transition>
  <aside id="app-sidebar" ref="drawer" class="sidebar" :class="{ 'is-open':open }" :inert="mobile && !open" :aria-label="t('mainMenu')" @keydown.esc="close" @keydown="trap">
    <div class="sidebar-brand"><button class="brand-toggle" :aria-label="mobile ? t('closeMenu') : collapsed ? t('expandSidebar') : t('collapseSidebar')" :aria-expanded="mobile ? open : !collapsed" @click="mobile ? close() : collapsed=!collapsed"><Icon name="lucide:calculator" size="24" class="brand-symbol" /><Icon :name="mobile?'lucide:x':'lucide:panel-left'" size="21" class="brand-toggle-icon" /></button><span class="brand sidebar-label">MyMath</span></div>
    <nav class="nav"><button v-for="item in items" :key="item.id" :class="{ active:section===item.id }" :title="t(item.id)" :aria-label="t(item.id)" :aria-current="section===item.id?'page':undefined" @click="navigate(item.id)"><Icon :name="`lucide:${item.icon}`" size="18" /><span class="sidebar-label">{{ t(item.id) }}</span></button></nav>
    <div class="sidebar-footer"><ThemeControls /><button class="icon-btn" :aria-label="t('logout')" :title="t('logout')" @click="emit('logout')"><Icon name="lucide:log-out" size="18" /></button></div>
  </aside>
</template>
