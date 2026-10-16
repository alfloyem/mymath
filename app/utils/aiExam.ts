export type AiProvider = 'chatgpt' | 'gemini' | 'claude'

export function publicGuideUrl(value:unknown) {
  if(typeof value!=='string'||!value.trim())return ''
  try{
    const url=new URL(value.trim())
    if(url.protocol!=='https:'||url.username||url.password||['localhost','127.0.0.1','[::1]'].includes(url.hostname))return ''
    return url.href
  }catch{return ''}
}

export function aiExamPrompt(guide:string,guideUrl:string) {
  const url=publicGuideUrl(guideUrl)
  const introduction='You help a teacher create MyMath exam/lesson JSON. Keep replies brief. First reply only "Hazıram. Nə hazırlayaq?" Wait for the teacher’s request. Final output must be one complete JSON code block, no explanation. Use Azerbaijani unless requested otherwise.'
  const linkedPrompt=`${introduction}\nRead the full MyMath JSON guide before generating anything: ${url}\nIf you cannot open it, ask me to paste the full guide already copied to my clipboard; do not invent the format.`
  const prompt=`${introduction}${url?`\nGuide reference: ${url}`:''}\n\n${guide}`
  // A self-contained starter also works before the repository becomes public.
  const compact='MyMath JSON assistant. First reply only "Hazıram. Nə hazırlayaq?" Wait for my requirements; keep replies brief. Final output: one complete JSON code block, no prose. Azerbaijani text. Format: {"mode":"imtahan","title":"Title","cols":2,"blocks":[{"type":"q","t":"$2+3$?","o":["3","4","5","6"],"answer":"C","topic":"Toplama"},{"type":"q","t":"Explain","space":150,"topic":"Tənlik"}]}. Each test needs 2-5 unique options and one verified uppercase answer A-E matching an option. Open questions omit o and answer; teacher scores 0-1. Questions top-level, numbered automatically from 1. At most 200 questions. Double every LaTeX backslash in JSON. No IDs, custom numbering, coordinates or solutions. For lesson sheets use mode qayda and h/p/eq/list/fig blocks, no q blocks. If asked for advanced layout or diagrams, ask me to paste the full guide already copied to my clipboard.'
  const candidate=`https://chatgpt.com/?q=${encodeURIComponent(url?linkedPrompt:prompt)}`
  const starter=candidate.length<=2000?(url?linkedPrompt:prompt):compact
  // A long configured URL also falls back to the complete copied guide.
  const chatgptUrl=`https://chatgpt.com/?q=${encodeURIComponent(starter)}`
  return {prompt,chatgptUrl:chatgptUrl.length<=2000?chatgptUrl:'https://chatgpt.com/'}
}

export function aiProviderUrl(provider:AiProvider,chatgptUrl:string) {
  return provider==='chatgpt'?chatgptUrl:provider==='gemini'?'https://gemini.google.com/app':'https://claude.ai/new'
}
