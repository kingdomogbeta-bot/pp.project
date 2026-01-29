// Shared order management with real-time sync between admin and users
// Uses localStorage and event listeners for cross-tab/cross-window sync

class OrderManager {
  constructor() {
    this.listeners = []
    this.setupStorageListener()
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'all_orders' || e.key === 'order_updates') {
        this.notifyListeners()
      }
    })
  }

  // Get all orders (admin view)
  getAllOrders() {
    try {
      const raw = localStorage.getItem('all_orders')
      console.log('🔍 getAllOrders - raw data from localStorage:', raw ? JSON.parse(raw) : 'null/empty')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('❌ Error parsing orders from localStorage:', e)
      return []
    }
  }

  // Get orders for specific user
  getUserOrders(userEmail) {
    const all = this.getAllOrders()
    return all.filter(o => o.userEmail === userEmail)
  }

  // Create/save a new order
  createOrder(order) {
    const orders = this.getAllOrders()
    const newOrder = {
      id: order.id || 'ORD' + Date.now(),
      userEmail: order.userEmail,
      customer: order.customer || 'Customer',
      items: order.items || [],
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      total: order.total || 0,
      shipping: order.shipping || {},
      address: order.address || {},
      payment: order.payment || {},
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    }
    orders.push(newOrder)
    console.log('📦 Creating order:', newOrder)
    this.saveOrders(orders)
    console.log('💾 All orders in localStorage:', orders)
    this.notifyListeners()
    return newOrder
  }

  // Update order status (admin action)
  updateOrderStatus(orderId, status) {
    const orders = this.getAllOrders()
    const order = orders.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      this.saveOrders(orders)
      // If order marked as Delivered, create a user notification
      if (status === 'Delivered' && order.userEmail) {
        try {
          this.addNotification({
            userEmail: order.userEmail,
            type: 'delivery',
            message: `Your order ${order.id} has been delivered. Please rate your item.`,
            orderId: order.id,
            productId: (order.items && order.items[0] && order.items[0].id) ? order.items[0].id : null
          })
        } catch (e) {
          console.error('Failed to create delivery notification', e)
        }
      }
      this.notifyListeners()
    }
    return order
  }

  // Notification helpers
  getNotifications() {
    try {
      const raw = localStorage.getItem('notifications')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Error reading notifications:', e)
      return []
    }
  }

  saveNotifications(list) {
    try {
      localStorage.setItem('notifications', JSON.stringify(list))
      localStorage.setItem('notifications_updated', new Date().toISOString())
    } catch (e) {
      console.error('Failed to save notifications:', e)
    }
  }

  addNotification(nt) {
    const list = this.getNotifications()
    const newNt = Object.assign({
      id: 'NTF' + Date.now(),
      userEmail: nt.userEmail || null,
      type: nt.type || 'info',
      message: nt.message || '',
      orderId: nt.orderId || null,
      productId: nt.productId || null,
      read: false,
      createdAt: new Date().toISOString()
    }, nt)
    list.push(newNt)
    this.saveNotifications(list)
    // notify listeners via storage event (already set by saveNotifications)
    return newNt
  }

  markNotificationRead(id) {
    const list = this.getNotifications()
    const found = list.find(n => n.id === id)
    if (found) {
      found.read = true
      this.saveNotifications(list)
      // Dispatch custom event for current tab update (storage event only fires in other tabs)
      window.dispatchEvent(new Event('notification:updated'))
    }
    return found
  }

  getUserNotifications(userEmail) {
    return this.getNotifications().filter(n => n.userEmail === userEmail).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  // Update order details (admin action)
  updateOrder(orderId, updates) {
    const orders = this.getAllOrders()
    const order = orders.find(o => o.id === orderId)
    if (order) {
      Object.assign(order, updates, { updatedAt: new Date().toISOString() })
      this.saveOrders(orders)
      this.notifyListeners()
    }
    return order
  }

  // Get single order
  getOrder(orderId) {
    const orders = this.getAllOrders()
    return orders.find(o => o.id === orderId)
  }

  // Delete order (admin action)
  deleteOrder(orderId) {
    const orders = this.getAllOrders()
    const filtered = orders.filter(o => o.id !== orderId)
    this.saveOrders(filtered)
    this.notifyListeners()
  }

  // Save all orders to localStorage
  saveOrders(orders) {
    try {
      localStorage.setItem('all_orders', JSON.stringify(orders))
      localStorage.setItem('order_updates', new Date().toISOString())
    } catch (e) {
      console.error('Failed to save orders:', e)
    }
  }

  // Subscribe to order changes (for real-time sync)
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  // Notify all subscribers
  notifyListeners() {
    const orders = this.getAllOrders()
    console.log('📢 Notifying', this.listeners.length, 'listeners with', orders.length, 'orders')
    this.listeners.forEach(cb => {
      try {
        cb(orders)
      } catch (e) {
        console.error('Listener error:', e)
      }
    })
  }
}

export const orderManager = new OrderManager()

export default orderManager
