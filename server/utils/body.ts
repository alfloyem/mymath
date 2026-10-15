import type { Readable } from 'node:stream'
import { createError } from 'h3'

// Bound memory while reading, including requests without Content-Length.
export function readBoundedJson(stream: Readable, maxBytes = 256000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytes = 0, exceeded = false
    const cleanup = () => { stream.off('data', onData); stream.off('end', onEnd); stream.off('error', onError); stream.off('aborted', onAborted) }
    const onData = (chunk: Buffer | string) => {
      if (exceeded) return
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += buffer.byteLength
      if (bytes > maxBytes) {
        exceeded = true; chunks.length = 0
        reject(createError({ statusCode: 413, statusMessage: 'Dosya en fazla 256 KB olabilir.' }))
      } else chunks.push(buffer)
    }
    const onError = (error: Error) => { cleanup(); reject(error) }
    const onAborted = () => onError(createError({ statusCode: 400, statusMessage: 'İstek tamamlanamadı.' }))
    const onEnd = () => {
      cleanup()
      if (exceeded) return
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) }
      catch { reject(createError({ statusCode: 400, statusMessage: 'Geçersiz JSON.' })) }
    }
    stream.on('data', onData).once('end', onEnd).once('error', onError).once('aborted', onAborted)
  })
}
