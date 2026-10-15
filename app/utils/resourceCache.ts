type Entry = { value: unknown; expires: number }
type Flight = { controller: AbortController; promise: Promise<unknown> }

/** Per-view/session memory only. Never use this as a shared server or disk cache. */
export function createResourceCache(maxEntries = 32, now: () => number = Date.now) {
  const entries = new Map<string, Entry>()
  const flights = new Map<string, Flight>()
  function invalidate(prefix = '') {
    for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key)
    for (const [key, flight] of flights) if (key.startsWith(prefix)) { flights.delete(key); flight.controller.abort() }
  }
  async function read<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, ttl = 300000): Promise<T> {
    const cached = entries.get(key)
    if (cached && cached.expires > now()) {
      entries.delete(key); entries.set(key, cached)
      return cached.value as T
    }
    entries.delete(key)
    const pending = flights.get(key)
    if (pending) return pending.promise as Promise<T>
    const controller = new AbortController()
    const flight: Flight = { controller, promise: Promise.resolve() }
    flight.promise = Promise.resolve().then(() => loader(controller.signal)).then(value => {
      if (controller.signal.aborted) throw new DOMException('Request invalidated', 'AbortError')
      if (!controller.signal.aborted && flights.get(key) === flight) {
        entries.set(key, { value, expires: now() + ttl })
        while (entries.size > maxEntries) entries.delete(entries.keys().next().value!)
      }
      return value
    }).finally(() => { if (flights.get(key) === flight) flights.delete(key) })
    flights.set(key, flight)
    return flight.promise as Promise<T>
  }
  function prime<T>(key: string, value: T, ttl = 300000) {
    invalidate(key)
    entries.set(key, { value, expires: now() + ttl })
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value!)
  }
  return { read, prime, invalidate, clear: () => invalidate() }
}
