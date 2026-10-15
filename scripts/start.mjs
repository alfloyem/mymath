// Nitro chunks can initialize their fallback URL before the ESM entry executes.
// file:///_entry.js is not an absolute Windows file URL; supply the real entry.
globalThis._importMeta_ ??= {
  url: new URL('../.output/server/index.mjs', import.meta.url).href,
  env: process.env
}
await import('../.output/server/index.mjs')
