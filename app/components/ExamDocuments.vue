<script setup lang="ts">
const props=defineProps<{examId:string;autoDownload?:boolean}>()
const {t}=useI18n()
const kind=ref('paper'),url=ref(''),error=ref(''),loading=ref(false)
const blobs=new Map<string,string>()
let request=0
function download(){if(!url.value)return;const link=document.createElement('a');link.href=url.value;link.download=`exam-${props.examId}-${kind.value}.pdf`;link.click()}
async function load(){
  const current=++request;loading.value=true;error.value=''
  try{
    const key=kind.value
    if(!blobs.has(key)){const blob=await $fetch<Blob>(`/api/exams/${props.examId}/documents`,{query:{kind:key},responseType:'blob'});if(current!==request)return;blobs.set(key,URL.createObjectURL(blob))}
    url.value=blobs.get(key)!
    if(props.autoDownload&&current===1)download()
  }catch{if(current===request)error.value=t('operationFailed')}finally{if(current===request)loading.value=false}
}
watch(kind,load)
onMounted(load)
onUnmounted(()=>{request++;for(const url of blobs.values())URL.revokeObjectURL(url)})
</script>
<template>
  <div class="toolbar"><select v-model="kind" :aria-label="t('documentType')"><option value="paper">{{t('examPaper')}}</option><option value="answers">{{t('answerSheet')}}</option><option value="key">{{t('answerKeyPdf')}}</option></select><button class="btn" :disabled="loading||!url" @click="download"><Icon name="lucide:download"/>{{t('download')}}</button></div>
  <p v-if="error" class="error">{{error}}</p><p v-if="loading" role="status" class="muted">{{t('loading')}}</p>
  <iframe v-if="url&&!loading" :src="url" :title="t('pdfPreview')" class="pdf-preview" />
</template>
