// ── CSV utilities ────────────────────────────────────────────────────────────

export function normalizeKey(h) {
  return h.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function parseCSV(text) {
  const clean   = text.replace(/^\uFEFF/, '')
  const lines   = clean.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(normalizeKey)
  return lines.slice(1).map(line => {
    const fields = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"')              inQ = !inQ
      else if (line[i] === ',' && !inQ) { fields.push(cur); cur = '' }
      else                              cur += line[i]
    }
    fields.push(cur)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (fields[i] ?? '').trim() })
    return obj
  })
}

export function parseFechaCSV(str) {
  if (!str) return null
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return null
}

export function csvEsc(v) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}
