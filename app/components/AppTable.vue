<script setup lang="ts">
type Column = { key: string; label?: string; sortable?: boolean; value?: (row: any) => unknown }
const props = withDefaults(defineProps<{ rows: any[]; columns: Column[]; empty?: string; loading?: boolean }>(), { empty: '' })
const { t, locale } = useI18n()
const sortKey = ref(''), direction = ref(0), page = ref(1), perPage = ref(10)
const sorted = computed(() => sortTableRows(props.rows, row => {
  const col = props.columns.find(c => c.key === sortKey.value)
  return col?.value ? col.value(row) : row[sortKey.value]
}, direction.value, locale.value))
const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / perPage.value)))
watch([pageCount, perPage], () => { page.value = Math.min(page.value, pageCount.value) })
watch(() => props.rows, () => { page.value = Math.min(page.value, pageCount.value) })
const visible = computed(() => sorted.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
function sort(col: Column) {
  if (!col.sortable) return
  if (sortKey.value !== col.key) { sortKey.value = col.key; direction.value = 1 }
  else direction.value = direction.value === 1 ? -1 : direction.value === -1 ? 0 : 1
  page.value = 1
}
</script>
<template>
  <section class="panel data-table" :aria-busy="loading">
    <div v-if="loading" class="empty" role="status">{{ t('loading') }}</div>
    <div v-else-if="!rows.length" class="empty">{{ empty || t('noRecords') }}</div>
    <template v-else>
      <div class="table-wrap"><table><thead><tr>
        <th v-for="col in columns" :key="col.key" :class="{ 'actions-cell': col.key === 'actions', 'selection-cell': col.key === 'select' }" :aria-sort="col.sortable ? (sortKey === col.key && direction ? direction === 1 ? 'ascending' : 'descending' : 'none') : undefined">
          <slot :name="`header-${col.key}`"><button v-if="col.sortable" class="table-sort" @click="sort(col)">{{ t(col.label || col.key) }}<Icon :name="sortKey === col.key && direction ? direction === 1 ? 'lucide:arrow-up' : 'lucide:arrow-down' : 'lucide:arrow-up-down'" :class="{'sort-active':sortKey===col.key && direction}" size="13" /></button><template v-else>{{ col.label ? t(col.label) : '' }}</template></slot>
        </th>
      </tr></thead><TransitionGroup tag="tbody" name="table-row"><tr v-for="row in visible" :key="row.id"><td v-for="col in columns" :key="col.key" :class="{'actions-cell':col.key==='actions','selection-cell':col.key==='select'}"><slot :name="col.key" :row="row">{{ col.value ? col.value(row) : row[col.key] ?? '—' }}</slot></td></tr></TransitionGroup></table></div>
      <footer class="table-footer"><span>{{ t('recordCount', { count: rows.length }) }}</span><div class="flex items-center gap-2"><select v-model.number="perPage" :aria-label="t('rowsPerPage')" @change="page=1"><option :value="10">10</option><option :value="25">25</option><option :value="50">50</option></select><button class="icon-btn" :disabled="page===1" :aria-label="t('previousPage')" @click="page--"><Icon name="lucide:chevron-left" /></button><span class="tabular-nums">{{ page }} / {{ pageCount }}</span><button class="icon-btn" :disabled="page===pageCount" :aria-label="t('nextPage')" @click="page++"><Icon name="lucide:chevron-right" /></button></div></footer>
    </template>
  </section>
</template>
