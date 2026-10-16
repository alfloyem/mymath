export function useEngineError(){
  const {t}=useI18n()
  return (error:any)=>{
    if(error instanceof SyntaxError)return t('invalidExamDocument')
    const status=error.data?.statusMessage||error.statusMessage
    if(status==='Engine busy. Try again shortly.')return t('engineBusy')
    if(status==='Scan could not be processed')return t('scanFailed')
    if(status==='Invalid exam document'||status==='Invalid document')return t('invalidExamDocument')
    if(status==='Invalid result')return t('invalidEngineResult')
    if(error.statusCode===413||error.status===413)return t('scanFileSize')
    if(error.message===t('scanFileSize'))return t('scanFileSize')
    return t('operationFailed')
  }
}
