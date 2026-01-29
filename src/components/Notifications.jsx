import React, { useState, useEffect, useRef } from 'react'
import { orderManager } from '../utils/orderManager'

export default function Notifications({ user, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const ref = useRef()

  useEffect(() => {
    function handleStorage(e) {
      if (e.key === 'notifications' || e.key === 'notifications_updated') {
        load()
      }
    }
    window.addEventListener('storage', handleStorage)
    load()
    return () => window.removeEventListener('storage', handleStorage)
  }, [user])

  function load() {
    if (!user || !user.email) {
      setItems([])
      return
    }
    const list = orderManager.getUserNotifications(user.email)
    setItems(list)
  }

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  function markRead(id) {
    orderManager.markNotificationRead(id)
    load()
  }

  function handleRate(nt) {
    markRead(nt.id)
    if (nt.productId) {
      onNavigate && onNavigate('product:' + nt.productId)
    } else {
      onNavigate && onNavigate('orders')
    }
    setOpen(false)
  }

  const unread = items.filter(i => !i.read).length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} title="Notifications" className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700 dark:text-gray-300"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.438L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        {unread > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">{unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 z-50 border border-gray-200 dark:border-gray-700">
          <div className="font-bold text-gray-900 dark:text-white mb-2">Notifications</div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-300">No notifications</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {items.map(nt => (
                <div key={nt.id} className={`p-3 rounded-md ${nt.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'}`}>
                  <div className="text-sm text-gray-900 dark:text-white font-medium">{nt.message}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(nt.createdAt).toLocaleString()}</div>
                  <div className="mt-2 flex gap-2">
                    {!nt.read && <button onClick={() => markRead(nt.id)} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">Mark read</button>}
                    {nt.type === 'delivery' && <button onClick={() => handleRate(nt)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Rate</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
