import React, { useState, useEffect } from 'react'
import { orderManager } from '../utils/orderManager'
import StarRating from '../components/StarRating'

export default function OrderHistory({ onNavigate, user = null, orders = [], onReorder }) {
  const [userOrders, setUserOrders] = useState([])

  useEffect(() => {
    // Load initial orders
    const email = user?.email
    if (email) {
      const loaded = orderManager.getUserOrders(email)
      console.log('📥 OrderHistory initial load for', email, ':', loaded.length, 'orders')
      setUserOrders(loaded)
    }

    // Subscribe to order changes for real-time sync
    const unsubscribe = orderManager.subscribe((allOrders) => {
      if (email) {
        const filtered = allOrders.filter(o => o.userEmail === email)
        console.log('📢 OrderHistory received update for', email, ':', filtered.length, 'orders')
        setUserOrders(filtered)
      }
    })

    return unsubscribe
  }, [user?.email])

  const displayOrders = userOrders.length > 0 ? userOrders : orders
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-8 py-12 max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Order History</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">View and track all your orders</p>
          </div>
          <button 
            onClick={() => onNavigate('products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Continue Shopping
          </button>
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Orders Yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">You haven't placed any orders yet. Start shopping now!</p>
            <button 
              onClick={() => onNavigate('products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="grid md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Order ID</p>
                    <p className="font-bold text-gray-900 dark:text-white">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Date</p>
                    <p className="font-bold text-gray-900 dark:text-white">{order.date || new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        order.status === 'Shipped' ? 'bg-green-500' :
                        order.status === 'Processing' ? 'bg-blue-500' :
                        order.status === 'Pending' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></span>
                      <span className={`font-bold ${
                        order.status === 'Shipped' ? 'text-green-600' :
                        order.status === 'Processing' ? 'text-blue-600' :
                        order.status === 'Pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>{order.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Total</p>
                    <p className="font-bold text-lg text-green-600">₦{order.total?.toLocaleString('en-NG') || '0'}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
                  <div className="space-y-3">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg items-center">
                        <img src={item.image} alt={item.title} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/160?text=No+Image')} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Qty: {item.qty}</p>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">₦{(item.price * item.qty).toLocaleString('en-NG')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-t border-gray-200 pt-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Shipping Address</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {order.address?.name}<br />
                      {order.address?.street}<br />
                      {order.address?.city}, {order.address?.state} {order.address?.zip}<br />
                      {order.address?.country}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₦{order.subtotal?.toLocaleString('en-NG') || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>₦{order.tax?.toLocaleString('en-NG') || '0'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-300">
                        <span>Total:</span>
                        <span>₦{order.total?.toLocaleString('en-NG') || '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition font-medium">
                    Track Order
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">
                    View Receipt
                  </button>
                  <button
                    onClick={() => onReorder && onReorder(order)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
