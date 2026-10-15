import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  modules: ['@nuxt/icon'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  icon: { serverBundle: { collections: ['lucide'] } },
  typescript: { strict: true },
  app: { head: { title: 'MyMath · Öğrenmenin izini sür', htmlAttrs: { lang: 'tr' }, meta: [{ name: 'description', content: 'Matematik grupları, öğrenciler ve aylık gelişim takibi.' }] } }
})
