import React from 'react'

export default function Topbar({ onToggleSidebar, onAddProduct, onImport, onSearch }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
          ☰
        </button>
        <input
          onChange={(e) => onSearch && onSearch(e.target.value)}
          placeholder="Search orders, products..."
          className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onImport} className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 hover:bg-gray-50">Import</button>
        <button onClick={onAddProduct} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700">+ Add Product</button>
      </div>
    </div>
  )
}
