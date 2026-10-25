let currency = 'INR'

export function setCurrency(code: string) {
  currency = code
}

export function money(n: number, opts: { compact?: boolean; sign?: boolean } = {}) {
  const f = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: opts.compact ? 1 : 2,
    minimumFractionDigits: 0,
    notation: opts.compact ? 'compact' : 'standard',
  })
  const s = f.format(Math.abs(n))
  if (!opts.sign) return n < 0 ? `-${s}` : s
  return `${n < 0 ? '−' : '+'}${s}`
}

export function isoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function prettyDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
