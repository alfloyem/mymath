import { useStorage } from 'nitropack/runtime'
export async function engineSources() {
  const storage=useStorage('assets:engines')
  const [document,answers,mathjax]=await Promise.all([storage.getItemRaw('document.html'),storage.getItemRaw('answers.html'),useStorage('assets:mathjax').getItemRaw('tex-svg-full.js')])
  if(!document||!answers||!mathjax)throw new Error('Missing packaged PDF engines')
  const text=(value:any)=>typeof value==='string'?value:Buffer.from(value).toString('utf8')
  return {document:text(document),answers:text(answers),mathjax:text(mathjax)}
}
