import { createError } from 'h3'
let working = false
export async function withEngineSlot<T>(work: () => Promise<T>) {
  if (working) throw createError({statusCode:429,statusMessage:'Engine busy. Try again shortly.'})
  working=true
  try { return await work() } finally { working=false }
}
