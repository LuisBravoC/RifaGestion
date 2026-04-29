export const fmt = n => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

export function fmtNum(n, total) {
  const digits = (total ?? 100) <= 100 ? 2 : String(total ?? 100).length
  return String(n).padStart(digits, '0')
}

export function fmtDate(d) {
  if (!d) return '—'
  const raw = typeof d === 'string' && d.length === 10 ? d + 'T12:00:00' : d
  return new Date(raw).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const today = () => new Date().toISOString().slice(0, 10)
