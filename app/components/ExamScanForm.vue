<script setup lang="ts">
import type {Question} from '../../shared/examDocument'
const props=defineProps<{examId:string;studentId:string;previous?:{answers:(string|null)[];manualScores?:Record<string,number>|null}}>()
const emit=defineEmits<{saved:[];busy:[value:boolean]}>()
const {t}=useI18n()
const engineError=useEngineError()
type Reading={number:number;answer:string|null;status:string;confirmed:boolean;page:number}
const questions=ref<Question[]>([]),pattern=ref<{pages:{boxes:{number:number;x:number;y:number;width:number;height:number}[]}[]}>({pages:[]})
const readings=ref<Reading[]>([]),previews=ref<string[]>([]),answers=ref<(string|null)[]>([]),manual=reactive<Record<string,number>>({}),busy=ref(false),error=ref(''),originalName=ref('')
watch(busy,value=>emit('busy',value),{flush:'sync'})
const needsReview=computed(()=>readings.value.some(r=>['multiple','uncertain'].includes(r.status)&&!r.confirmed))
const manualComplete=computed(()=>questions.value.filter(q=>q.kind==='manual').every(q=>Number.isFinite(manual[String(q.number)])&&manual[String(q.number)]!>=0&&manual[String(q.number)]!<=1))
const hasInput=computed(()=>previews.value.length>0||!!props.previous)
onMounted(async()=>{
  try{const data=await api(`/api/exams/${props.examId}/engine`);questions.value=data.questions;pattern.value=data.pattern;answers.value=props.previous?.answers.slice()||Array(questions.value.length).fill(null);Object.assign(manual,props.previous?.manualScores||{})}
  catch{error.value=t('operationFailed')}
})
function questionChanged(number:number){const reading=readings.value.find(r=>r.number===number);if(reading)reading.confirmed=true}
async function upload(event:Event){
  const input=event.target as HTMLInputElement,files=Array.from(input.files||[])
  if(!files.length)return
  busy.value=true;error.value=''
  try{
    if(files.length>20||files.reduce((n,f)=>n+f.size,0)>20*1024*1024)throw new Error(t('scanFileSize'))
    const body=new FormData();body.append('studentId',props.studentId);for(const file of files)body.append('files',file)
    const scan=await $fetch<any>(`/api/exams/${props.examId}/scan`,{method:'POST',body})
    previews.value=scan.previews;readings.value=scan.readings.map((r:any)=>({...r,confirmed:false}));answers.value=Array(questions.value.length).fill(null)
    for(const reading of readings.value)answers.value[reading.number-1]=reading.answer
    for(const key of Object.keys(manual))delete manual[key]
    originalName.value=files.map(f=>f.name).join(', ').slice(0,200)
  }catch(e:any){error.value=engineError(e)}
  finally{busy.value=false;input.value=''}
}
async function save(){
  if(needsReview.value||!manualComplete.value||!hasInput.value)return
  busy.value=true;error.value=''
  try{await api('/api/results',{method:'POST',body:{examId:props.examId,studentId:props.studentId,answers:answers.value,manualScores:manual,originalName:originalName.value||undefined,scanAnalysis:readings.value.length?{readings:readings.value.map(({number,status,confirmed})=>({number,status,confirmed}))}:undefined}});emit('saved')}
  catch(e:any){error.value=engineError(e)}finally{busy.value=false}
}
const openCrops=computed(()=>pattern.value.pages.flatMap((page,index)=>page.boxes.map(box=>({...box,page:index,src:previews.value[index]}))))
</script>
<template>
  <div class="field"><label :for="'scan-'+examId">{{t('scanUpload')}}</label><input :id="'scan-'+examId" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple :disabled="busy||!questions.length" @change="upload"></div>
  <p v-if="busy" class="muted" role="status">{{t('processingScan')}}</p><p v-if="error" role="alert" class="error">{{error}}</p>
  <template v-if="hasInput">
    <p v-if="needsReview" class="notice mb-4">{{t('reviewMarks')}}</p>
    <div class="scan-review">
      <div v-for="q in questions" :key="q.number" class="scan-answer-row">
        <label :for="'q-'+q.number">{{q.number}}.</label>
        <template v-if="q.kind==='choice'"><select :id="'q-'+q.number" v-model="answers[q.number-1]" :disabled="busy" @change="questionChanged(q.number)"><option :value="null">{{t('blank')}}</option><option v-for="option in q.options" :key="option" :value="option">{{option}}</option></select><button v-if="readings.find(r=>r.number===q.number&&!r.confirmed&&['multiple','uncertain'].includes(r.status))" type="button" class="btn text-xs" @click="questionChanged(q.number)">{{t('confirmAnswer')}}</button></template>
        <input v-else :id="'q-'+q.number" v-model.number="manual[String(q.number)]" type="number" min="0" max="1" step="0.01" :placeholder="t('manualPoint')" :disabled="busy">
      </div>
    </div>
    <details v-for="crop in openCrops" :key="crop.number" class="manual-crop"><summary>{{t('openQuestion',{number:crop.number})}}</summary><div v-if="crop.src" class="crop-window" :style="{aspectRatio:String(crop.width*794/(crop.height*1122))}"><img :src="crop.src" :alt="t('openQuestion',{number:crop.number})" :style="{width:(100/crop.width)+'%',maxWidth:'none',left:(-100*crop.x/crop.width)+'%',top:(-100*crop.y/crop.height)+'%'}"></div></details>
    <details v-for="(preview,index) in previews" :key="index" class="mt-3"><summary>{{t('scanPage',{number:index+1})}}</summary><img :src="preview" :alt="t('scanPage',{number:index+1})" class="scan-preview"></details>
    <div class="actions"><button type="button" class="btn primary" :disabled="busy||!questions.length||needsReview||!manualComplete" @click="save">{{t('analyseSave')}}</button></div>
  </template>
</template>
