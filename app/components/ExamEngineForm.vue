<script setup lang="ts">
const props=defineProps<{groups:{id:string;name:string}[];groupId:string;month:string}>()
const emit=defineEmits<{created:[id:string,groupId:string,month:string];busy:[value:boolean]}>()
const {t}=useI18n()
const engineError=useEngineError()
const group=ref(props.groupId),month=ref(props.month),source=ref(''),busy=ref(false),error=ref('')
watch(busy,value=>emit('busy',value),{flush:'sync'})
async function upload(event:Event){
  const input=event.target as HTMLInputElement,file=input.files?.[0]
  if(!file)return
  try{if(file.size>256000)throw new Error(t('fileSize'));source.value=(await file.text()).replace(/^\uFEFF/,'');JSON.parse(source.value);error.value=''}catch(e:any){error.value=e.message}finally{input.value=''}
}
async function submit(){
  busy.value=true;error.value=''
  try{
    const document=JSON.parse(source.value)
    if(document.mode==='qayda'){
      const blob=await $fetch<Blob>('/api/documents/render',{method:'POST',body:document,responseType:'blob'})
      const url=URL.createObjectURL(blob),link=window.document.createElement('a');link.href=url;link.download='rules.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
    }else{
      const result=await api('/api/exams/engine',{method:'POST',body:{document,groupId:group.value,month:month.value}})
      emit('created',result.id,group.value,month.value)
    }
  }catch(e:any){error.value=engineError(e)}
  finally{busy.value=false}
}
</script>
<template>
  <form @submit.prevent="submit">
    <ExamAiLinks />
    <div class="field"><label for="engine-group">{{t('group')}}</label><select id="engine-group" v-model="group" required :disabled="busy"><option v-for="item in groups" :key="item.id" :value="item.id">{{item.name}}</option></select></div>
    <div class="field"><label for="engine-month">{{t('examMonth')}}</label><input id="engine-month" v-model="month" type="month" required :disabled="busy"></div>
    <div class="field"><label for="engine-file">JSON</label><input id="engine-file" type="file" accept=".json,application/json" :disabled="busy" @change="upload"></div>
    <div class="field"><label for="engine-json">{{t('examDocument')}}</label><textarea id="engine-json" v-model="source" rows="9" required spellcheck="false" :disabled="busy" class="font-mono text-xs" /></div>
    <p v-if="error" role="alert" class="error">{{error}}</p>
    <div class="actions"><button class="btn primary" :disabled="busy||!source">{{busy?t('generatingPdf'):t('generatePdf')}}</button></div>
  </form>
</template>
