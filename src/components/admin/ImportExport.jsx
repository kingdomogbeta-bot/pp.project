import React from 'react'

export default function ImportExport({ onImport }) {
  function handleFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      const lines = text.split(/\r?\n/).filter(Boolean)
      const headers = lines[0].split(',').map(h=>h.trim())
      const rows = lines.slice(1).map(l => {
        const cols = l.split(',')
        const obj = {}
        headers.forEach((h,i)=>{ obj[h]=cols[i] })
        return obj
      })
      onImport && onImport(rows)
    }
    reader.readAsText(f)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded cursor-pointer text-sm">Upload CSV
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>
    </div>
  )
}
