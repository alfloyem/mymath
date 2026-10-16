<script setup lang="ts">
import guide from '../../docs/ai-exam-guide.md?raw'
import { aiExamPrompt,aiProviderUrl,type AiProvider } from '~/utils/aiExam'
const {t}=useI18n()
const config=useRuntimeConfig()
const message=ref(''),manual=ref(false),copying=ref(false)
const providers:{id:AiProvider;name:string;icon:string}[]=[{id:'chatgpt',name:'ChatGPT',icon:'lucide:message-circle'},{id:'gemini',name:'Gemini',icon:'lucide:sparkles'},{id:'claude',name:'Claude',icon:'lucide:asterisk'}]
const content=computed(()=>aiExamPrompt(guide,String(config.public.aiGuideUrl||'')))
async function launch(event:MouseEvent){
  if(copying.value){event.preventDefault();return}
  message.value='';manual.value=false;copying.value=true
  // The native link opens independently; do not wait before navigation.
  let copy:Promise<void>|undefined
  try{copy=navigator.clipboard?.writeText(content.value.prompt)}catch{}
  try{
    if(!copy)throw new Error('Clipboard unavailable')
    await copy;message.value=t('aiPromptCopied')
  }catch{manual.value=true;message.value=t('aiCopyFallback')}
  finally{copying.value=false}
}
</script>
<template>
  <div class="field">
    <span class="mb-2 block text-sm font-medium">{{t('aiAssistant')}}</span>
    <div class="flex flex-wrap items-center gap-2"><a v-for="provider in providers" :key="provider.id" :href="aiProviderUrl(provider.id,content.chatgptUrl)" target="_blank" rel="noopener noreferrer" class="btn text-sm" :aria-disabled="copying" :aria-label="t('openAiAssistant',{name:provider.name})" @click="launch"><Icon :name="provider.icon" size="16"/>{{provider.name}}<Icon name="lucide:arrow-up-right" size="13" class="muted"/></a></div>
    <small v-if="message" role="status" class="block mt-2">{{message}}</small>
    <textarea v-if="manual" :value="content.prompt" readonly rows="5" class="mt-2 text-xs" :aria-label="t('aiGuidePrompt')" @focus="($event.target as HTMLTextAreaElement).select()" />
  </div>
</template>
