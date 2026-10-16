export const fmt = n => (n ?? 0).toLocaleString('en-US')

export function fmtCompact(n) {
  if (n === null || n === undefined) return '—'
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

export const pct = (n, total, digits = 0) => (total > 0 ? `${((n / total) * 100).toFixed(digits)}%` : '—')

/** RFC-4180 CSV cell escaping (+ guard against spreadsheet formula injection). */
export function csvCell(v) {
  let s = v === null || v === undefined ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadBlob(filename, text, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'trials'

export const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 640

/** Truncate long axis labels (mobile-aware) so they never overflow the plot area. */
export function axisLabel(s, max = isNarrow() ? 14 : 24) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}
