import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  modules: ['@nuxt/icon', '@nuxtjs/color-mode', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'tr', strategy: 'no_prefix',
    locales: [
      { code: 'tr', language: 'tr-TR', name: 'Türkçe', file: 'tr.json' },
      { code: 'az', language: 'az-AZ', name: 'Azərbaycanca', file: 'az.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' }
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'mymath-locale', redirectOn: 'root' }
  },
  colorMode: { preference: 'system', fallback: 'light', classSuffix: '', storage: 'cookie', storageKey: 'mymath-color-mode' },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  icon: { serverBundle: { collections: ['lucide'] } },
  typescript: { strict: true },
  app: { head: { title: 'MyMath', htmlAttrs: { lang: 'tr' } } }
})
