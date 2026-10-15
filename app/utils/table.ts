export function sortTableRows<T>(rows: T[], value: (row: T) => unknown, direction: number, locale: string) {
  if (!direction) return [...rows]
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  return [...rows].sort((a,b) => {
    const av = value(a), bv = value(b)
    if (av == null) return bv == null ? 0 : 1
    if (bv == null) return -1
    return (typeof av === 'number' && typeof bv === 'number' ? av - bv : collator.compare(String(av), String(bv))) * direction
  })
}
