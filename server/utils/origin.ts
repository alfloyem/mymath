export function isAllowedOrigin(origin: string, requestOrigin: string, appUrl: string | undefined, development: boolean) {
  try {
    const configured = appUrl ? new URL(appUrl).origin : requestOrigin
    if (origin === configured) return true
    // Nuxt may choose another port; local same-origin requests remain valid.
    const request = new URL(requestOrigin)
    return development && ['localhost', '127.0.0.1', '[::1]'].includes(request.hostname) && origin === request.origin
  } catch { return false }
}
