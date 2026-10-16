import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createError } from 'h3'
import type { Pattern } from './examPdf'
const exec=promisify(execFile)
export async function scanExam(files:{data:Buffer;filename?:string}[],reference:Uint8Array,pattern:Pattern,worker:string){
  const dir=await mkdtemp(join(tmpdir(),'mymath-scan-'))
  try {
    const scans:string[]=[]
    for(let i=0;i<files.length;i++){const path=join(dir,`scan-${i}`);await writeFile(path,files[i]!.data);scans.push(path)}
    const template=join(dir,'reference.pdf'),script=join(dir,'scan.py'),job=join(dir,'job.json')
    await Promise.all([writeFile(template,reference),writeFile(script,worker),writeFile(job,JSON.stringify({scans,reference:template,pattern}))])
    let stdout:string
    try{({stdout}=await exec(process.env.OMR_PYTHON||'python',[script,job],{timeout:90000,maxBuffer:2*1024*1024,windowsHide:true,env:{...process.env,PYTHONUTF8:'1'}}))}
    catch(error:any){let message='Scan could not be processed';try{message=JSON.parse(error.stdout).error||message}catch{};throw createError({statusCode:422,statusMessage:'Scan could not be processed',data:{message}})}
    let result:{readings:{number:number;answer:string|null;status:string;fills:Record<string,number>;page:number}[];previews:string[];pages:number}
    try{result=JSON.parse(stdout);if(!Array.isArray(result.readings)||!Array.isArray(result.previews))throw new Error('Invalid worker output')}
    catch{throw createError({statusCode:422,statusMessage:'Scan could not be processed',data:{message:'OMR worker returned no valid result; check OMR_PYTHON and its dependencies'}})}
    return {...result,previews:await Promise.all(result.previews.map(async(path)=>`data:image/jpeg;base64,${(await readFile(path)).toString('base64')}`))}
  } finally {await rm(dir,{recursive:true,force:true})}
}
