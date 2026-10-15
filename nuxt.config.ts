import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  modules: ['@nuxt/icon', '@nuxtjs/color-mode'],
  colorMode: { preference: 'system', fallback: 'light', classSuffix: '', storage: 'cookie', storageKey: 'mymath-color-mode' },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  icon: { serverBundle: { collections: ['lucide'] } },
  typescript: { strict: true },
  app: { head: { title: 'MyMath', htmlAttrs: { lang: 'tr' } } }
})
