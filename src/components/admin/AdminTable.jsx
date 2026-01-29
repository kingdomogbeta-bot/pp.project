import React, { useState, useMemo } from 'react'

export default function AdminTable({ columns = [], data = [], pageSize = 10, onView, onSelectionChange, onDelete }) {
  const [page, setPage] = useState(0)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [selected, setSelected] = useState(new Set())

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [data, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize)

  function toggleSelect(id) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
    onSelectionChange && onSelectionChange(Array.from(next))
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="p-3">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected(new Set(data.map(d => d.id)));
                    onSelectionChange && onSelectionChange(data.map(d => d.id));
                  } else {
                    setSelected(new Set());
                    onSelectionChange && onSelectionChange([]);
                  }
                }}
              />
            </th>
            {columns.map(col => (
              <th key={col.key} className="p-3 cursor-pointer" onClick={() => col.sortable && toggleSort(col.key)}>
                <div className="flex items-center gap-2">
                  <span>{col.label}</span>
                  {col.sortable && sortKey === col.key && <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map(row => (
            <tr key={row.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="p-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} /></td>
              {columns.map(col => (
                <td key={col.key} className="p-3 align-top">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">Showing {page * pageSize + 1}–{Math.min((page+1)*pageSize, sorted.length)} of {sorted.length}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(0, p-1))} className="px-3 py-1 border rounded">Prev</button>
          <div className="text-sm">{page+1}/{pages}</div>
          <button onClick={() => setPage(p => Math.min(pages-1, p+1))} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>
    </div>
  )
}
