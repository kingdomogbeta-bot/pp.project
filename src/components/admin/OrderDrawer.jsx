import React, { useState, useEffect } from 'react'

export default function OrderDrawer({ order, onClose, onUpdateStatus }) {
  if (!order) return null
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [order])
  
  const [localStatus, setLocalStatus] = useState(order.status || 'Pending')

  useEffect(() => {
    setLocalStatus(order.status || 'Pending')
  }, [order])

  const handleStatusChange = (newStatus) => {
    console.log('📋 Status changed (local):', order.id, '→', newStatus)
    setLocalStatus(newStatus)
    if (onUpdateStatus) {
      onUpdateStatus(order.id, newStatus)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex p-4">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md sm:w-96 bg-white dark:bg-gray-800 p-6 shadow-xl overflow-auto rounded-lg max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Order {order.id}</h3>
          <button onClick={onClose} className="text-gray-500">×</button>
        </div>
        <div>
          <p className="text-sm text-gray-500">Customer</p>
          <div className="font-semibold mb-2">{order.customer}</div>
          <p className="text-sm text-gray-500">Date</p>
          <div className="font-semibold mb-2">{order.date}</div>
          <p className="text-sm text-gray-500">Total</p>
          <div className="font-semibold mb-4">${order.total}</div>

          <div className="mb-4">
            <label className="text-sm text-gray-500">Status</label>
            <select value={localStatus} onChange={(e)=>handleStatusChange(e.target.value)} className="ml-2 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200">
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
            </select>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Items</h4>
            {order.items && order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <img src={it.image} alt="" className="w-12 h-12 object-cover rounded" onError={(e)=>e.currentTarget.src='https://via.placeholder.com/120?text=No+Image'} />
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-sm text-gray-500">Qty: {it.qty} • ${it.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
