import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  modules: ['@nuxt/icon', '@nuxtjs/color-mode', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'az', strategy: 'no_prefix',
    locales: [
      { code: 'az', language: 'az-AZ', name: 'Azərbaycan dili', file: 'az.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' }
    ],
    detectBrowserLanguage: false
  },
  colorMode: { preference: 'system', fallback: 'light', classSuffix: '', storage: 'cookie', storageKey: 'mymath-color-mode' },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  icon: { serverBundle: { collections: ['lucide'] } },
  typescript: { strict: true },
  app: { head: { title: 'MyMath', htmlAttrs: { lang: 'az' } } }
})
