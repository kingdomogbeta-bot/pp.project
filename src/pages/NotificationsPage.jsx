import React, { useEffect, useState } from 'react'
import { orderManager } from '../utils/orderManager'
import RatingReviewModal from '../components/RatingReviewModal'

export default function NotificationsPage({ user, onNavigate }) {
  const [items, setItems] = useState([])
  const [ratingModal, setRatingModal] = useState({ isOpen: false, notification: null })

  useEffect(() => {
    load()
    function onStorage(e) {
      if (e.key === 'notifications' || e.key === 'notifications_updated') load()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [user])

  function load() {
    if (!user || !user.email) return setItems([])
    setItems(orderManager.getUserNotifications(user.email))
  }

  function markRead(id) {
    orderManager.markNotificationRead(id)
    load()
  }

  function handleRate(nt) {
    markRead(nt.id)
    if (nt.productId) {
      // Find product details from orders
      const orders = JSON.parse(localStorage.getItem('all_orders') || '[]')
      let productTitle = 'Product'
      for (const order of orders) {
        for (const item of order.items || []) {
          if (item.id === nt.productId) {
            productTitle = item.name
            break
          }
        }
      }
      setRatingModal({ isOpen: true, notification: { ...nt, productTitle } })
    }
  }

  function handleRatingSubmit(review) {
    setRatingModal({ isOpen: false, notification: null })
    load()
  }


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notifications</h1>
        {items.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">You have no notifications.</div>
        ) : (
          <div className="space-y-4">
            {items.map(nt => (
              <div key={nt.id} className={`p-4 rounded-md ${nt.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800 border-l-4 border-blue-500'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{nt.message}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(nt.createdAt).toLocaleString()}</div>
                </div>
                <div className="mt-2 flex gap-2">
                  {!nt.read && <button onClick={() => markRead(nt.id)} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">Mark read</button>}
                  {nt.type === 'delivery' && <button onClick={() => handleRate(nt)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition">Rate</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RatingReviewModal
        isOpen={ratingModal.isOpen}
        productId={ratingModal.notification?.productId}
        productTitle={ratingModal.notification?.productTitle}
        userEmail={user?.email}
        onClose={() => setRatingModal({ isOpen: false, notification: null })}
        onSubmit={handleRatingSubmit}
      />
    </div>
  )
}
