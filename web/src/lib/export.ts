export function csvText(rows: unknown[][]) {
  const cell = (value: unknown) => {
    const text = String(value ?? '')
    const safe = /^[\s]*[=+@-]/.test(text) && typeof value === 'string' ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }
  return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')
}
export function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function printText(title: string, body: string) {
  const frame = document.createElement('iframe'); frame.title = title
  frame.style.cssText = 'position:fixed;width:1px;height:1px;bottom:0;left:-9999px;border:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  if (!doc) { frame.remove(); return }
  doc.title = title
  const style = doc.createElement('style'); style.textContent = 'body{font:14px/1.8 serif;padding:24px;color:#202820}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}@page{margin:18mm}'
  doc.head.appendChild(style)
  const pre = doc.createElement('pre'); pre.textContent = body; doc.body.appendChild(pre)
  frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true })
  frame.contentWindow?.focus(); frame.contentWindow?.print()
  setTimeout(() => frame.remove(), 60000)
}
