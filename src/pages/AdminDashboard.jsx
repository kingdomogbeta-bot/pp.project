import React, { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Package, Users, ShoppingCart, Naira, Edit } from '../icons/LucideIcons'
import AdminTable from '../components/admin/AdminTable'
import OrderDrawer from '../components/admin/OrderDrawer'
import ImportExport from '../components/admin/ImportExport'
import { orderManager } from '../utils/orderManager'
import defaultProducts from '../data/products'

export default function AdminDashboard({ products: externalProducts, onNavigate, onProductsChange, orders: externalOrders, ordersMap, onOrdersChange, storeSettings = {}, onStoreSettingsChange }) {
  const [tab, setTab] = useState('dashboard')
  const [orders, setOrders] = useState(() => {
    // Load from orderManager (single source of truth)
    return orderManager.getAllOrders()
  })

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('adminProducts')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return externalProducts || []
  })

  // One-time seeder: if no products exist in localStorage, seed from default data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminProducts')
      const merchantSaved = localStorage.getItem('merchant_products')
      if ((!saved || saved === '[]') && (!merchantSaved || merchantSaved === '[]') && (!externalProducts || externalProducts.length === 0)) {
        setProducts(defaultProducts)
        localStorage.setItem('adminProducts', JSON.stringify(defaultProducts))
        localStorage.setItem('merchant_products', JSON.stringify(defaultProducts))
        console.log('📦 Seeded adminProducts and merchant_products from default products')
      }
    } catch (e) {}
    // only run on mount
  }, [])

  const [viewOrder, setViewOrder] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [settingsTab, setSettingsTab] = useState('general')
  const [analyticsTab, setAnalyticsTab] = useState('revenue')
  const [adminNotifications, setAdminNotifications] = useState([])
  const [showAdminNotifications, setShowAdminNotifications] = useState(false)
  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('admin_users')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })
  const [localSettings, setLocalSettings] = useState(storeSettings || {
    storeName: 'Horizon Store',
    storeEmail: 'admin@store.com',
    storeDescription: 'Your one-stop shop for quality products at great prices.',
    phoneNumber: '+1 (555) 123-4567',
    timezone: 'Eastern Time (ET)',
    storeAddress: '123 Commerce Street, Suite 100, New York, NY 10001',
    defaultCurrency: 'NGN - Nigerian Naira',
    language: 'English'
  })

  // Sync local settings with parent when props change
  useEffect(() => {
    if (storeSettings && Object.keys(storeSettings).length > 0) {
      setLocalSettings(storeSettings)
    }
  }, [storeSettings])

  // Update parent when local settings change
  useEffect(() => {
    if (typeof onStoreSettingsChange === 'function') {
      onStoreSettingsChange(localSettings)
    }
  }, [localSettings])

  // Persist products to localStorage
  useEffect(() => {
    // Subscribe to real-time order changes from orderManager
    console.log('👨‍💼 AdminDashboard subscribing to orderManager')
    const unsubscribe = orderManager.subscribe((updatedOrders) => {
      console.log('📊 AdminDashboard - Orders updated:', updatedOrders.length, 'orders')
      setOrders(updatedOrders)
    })
    return unsubscribe
  }, [])

  // Load and listen to admin notifications (for tracking new customers this month)
  useEffect(() => {
    function loadAdminNotifications() {
      const allNotifications = orderManager.getNotifications()
      const adminNotifs = allNotifications.filter(n => n.userEmail === 'admin')
      setAdminNotifications(adminNotifs)
    }
    loadAdminNotifications()
    
    function handleStorage(e) {
      if (e.key === 'notifications' || e.key === 'notifications_updated') {
        loadAdminNotifications()
      }
      if (e.key === 'admin_users') {
        const raw = localStorage.getItem('admin_users')
        if (raw) {
          try {
            setUsers(JSON.parse(raw))
          } catch (err) {}
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('notification:updated', loadAdminNotifications)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('notification:updated', loadAdminNotifications)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('adminProducts', JSON.stringify(products))
      // Also persist to merchant_products so user-facing pages reflect admin changes
      localStorage.setItem('merchant_products', JSON.stringify(products))
    } catch (e) {}
    if (typeof onProductsChange === 'function') onProductsChange(products)
  }, [products])

  // Persist orders to localStorage
  useEffect(() => {
    localStorage.setItem('adminOrders', JSON.stringify(orders))
    if (typeof onOrdersChange === 'function') onOrdersChange(orders)
  }, [orders])

  // KPI Metrics
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
  const totalOrders = orders.length
  const totalProducts = products.length
  const totalCustomers = new Set(orders.map(o => o.email || o.customer)).size

  // Load known customers from localStorage
  const [knownCustomerEmails, setKnownCustomerEmails] = useState(() => {
    try {
      const saved = localStorage.getItem('knownCustomerEmails')
      return saved ? JSON.parse(saved) : {}
    } catch (e) {
      return {}
    }
  })

  // Extract unique customers from orders and mark new ones
  const customers = Array.from(new Map(
    orders.map(o => {
      const email = o.userEmail || o.email
      const customerOrders = orders.filter(x => (x.userEmail || x.email) === email)
      const firstOrderDate = customerOrders.length > 0 ? customerOrders[customerOrders.length - 1].date || new Date(customerOrders[customerOrders.length - 1].id).toISOString() : new Date().toISOString()
      const isNew = !knownCustomerEmails[email]
      
      // Track new customers
      if (isNew && email) {
        setKnownCustomerEmails(prev => {
          const updated = { ...prev, [email]: firstOrderDate }
          localStorage.setItem('knownCustomerEmails', JSON.stringify(updated))
          
          // Create admin notification for new customer
          try {
            orderManager.addNotification({
              userEmail: 'admin',
              type: 'new_customer',
              message: `New customer registered: ${o.customer || email}`,
              customerEmail: email,
              customerName: o.customer || 'New Customer'
            })
          } catch (e) {
            console.error('Failed to create new customer notification', e)
          }
          
          return updated
        })
      }
      
      return [email, { 
        email, 
        name: o.customer, 
        orders: customerOrders.length, 
        totalSpent: customerOrders.reduce((s, x) => s + (x.total || 0), 0),
        isNew,
        firstOrderDate
      }]
    })
  ).values())

  // Revenue trend (calculated from actual orders by month)
  const revenueData = (() => {
    const monthMap = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Initialize all months with 0
    monthNames.forEach(month => {
      monthMap[month] = 0
    })
    
    // Calculate revenue for each month from actual orders
    orders.forEach(order => {
      try {
        let orderDate
        if (order.date) {
          orderDate = new Date(order.date)
        } else if (order.id) {
          // Fallback: use order ID timestamp if available
          orderDate = new Date(parseInt(order.id.substring(1)) || Date.now())
        } else {
          orderDate = new Date()
        }
        
        const month = monthNames[orderDate.getMonth()]
        monthMap[month] += (order.total || 0)
      } catch (e) {
        // If date parsing fails, skip this order
      }
    })
    
    // Return last 6 months of data
    const currentMonth = new Date().getMonth()
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const month = monthNames[monthIndex]
      last6Months.push({ month, revenue: monthMap[month] || 0 })
    }
    return last6Months
  })()

  // Weekly sales (calculated from actual orders by day of week)
  const weeklySalesData = (() => {
    const dayMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 }
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Count orders by day of week
    orders.forEach(order => {
      try {
        let orderDate
        if (order.date) {
          orderDate = new Date(order.date)
        } else if (order.id) {
          orderDate = new Date(parseInt(order.id.substring(1)) || Date.now())
        } else {
          orderDate = new Date()
        }
        
        const dayName = dayNames[orderDate.getDay()]
        dayMap[dayName] += 1
      } catch (e) {
        // If date parsing fails, skip this order
      }
    })
    
    return [
      { day: 'Mon', sales: dayMap['Mon'] },
      { day: 'Tue', sales: dayMap['Tue'] },
      { day: 'Wed', sales: dayMap['Wed'] },
      { day: 'Thu', sales: dayMap['Thu'] },
      { day: 'Fri', sales: dayMap['Fri'] },
      { day: 'Sat', sales: dayMap['Sat'] },
      { day: 'Sun', sales: dayMap['Sun'] }
    ]
  })()

  // Category sales (calculated from orders and products)
  const categorySalesData = (() => {
    const categoryMap = {}
    
    // Process each order
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          // Find the product to get its category
          const product = products.find(p => p.id === item.id || p.id === item.productId)
          const category = product?.category || 'Other'
          const itemTotal = (item.price || 0) * (item.quantity || 1)
          
          if (!categoryMap[category]) {
            categoryMap[category] = 0
            
          }
          categoryMap[category] += itemTotal
        })
      }
    })
    
    // Convert to chart format and sort by value (descending)
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  })()

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

  // Analytics metrics
  const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered')
  const completedRevenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0)
  const avgOrderValue = completedOrders.length > 0 ? completedRevenue / completedOrders.length : 0

  // Count new customers from admin notifications this month
  const newCustomersThisMonth = adminNotifications.filter(n => {
    const notifDate = new Date(n.createdAt)
    const now = new Date()
    const isThisMonth = notifDate.getMonth() === now.getMonth() && notifDate.getFullYear() === now.getFullYear()
    return n.type === 'new_customer' && isThisMonth
  }).length

  function updateOrderStatus(id, status) {
    console.log('🔄 Updating order status:', id, 'to', status)
    orderManager.updateOrderStatus(id, status)
    // The subscription will automatically update local state when orderManager notifies
  }

  function removeProduct(id) {
    if (!confirm('Delete this product?')) return
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  function saveProduct(prod) {
    if (prod.id) {
      setProducts(prev => prev.map(p => p.id === prod.id ? prod : p))
    } else {
      prod.id = 'p' + Date.now()
      setProducts(prev => [prod, ...prev])
    }
    setShowProductForm(false)
    setEditingProduct(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-blue-900 text-white p-6 border-r border-blue-800 overflow-y-auto overflow-x-hidden sticky top-0 h-screen">
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Admin Panel
            </h1>
            <p className="text-blue-200 text-sm mt-2">Horizon Store</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'dashboard' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span className="text-lg font-bold">₦</span>
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'orders' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Orders</span>
            </button>
            <button
              onClick={() => setTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'products' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Products</span>
            </button>
            <button
              onClick={() => setTab('customers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'customers' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Customers</span>
            </button>
            <button
              onClick={() => setTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'analytics' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span className="text-lg">📊</span>
              <span className="font-medium">Analytics</span>
            </button>
            <button
              onClick={() => setTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                tab === 'settings' ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Admin Notifications Bar */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
            <div></div>
            <div className="relative">
              <button
                onClick={() => setShowAdminNotifications(!showAdminNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700 dark:text-gray-200">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.438L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                {adminNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                    {adminNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {showAdminNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white">Admin Notifications</h3>
                  </div>
                  {adminNotifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {adminNotifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => !notif.read && orderManager.markNotificationRead(notif.id)}
                          className={`p-4 cursor-pointer hover:opacity-80 transition ${notif.type === 'new_customer' ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${notif.read ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-gray-400' : notif.type === 'new_customer' ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${notif.read ? 'text-gray-600 dark:text-gray-500' : 'font-semibold text-gray-900 dark:text-white'}`}>{notif.message}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            {tab === 'dashboard' && (
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h2>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <KpiCard
                    title="Total Revenue"
                    value={`₦${totalRevenue.toLocaleString('en-NG')}`}
                    icon="₦"
                    trend={12.5}
                    trendUp
                  />
                  <KpiCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={<ShoppingCart className="w-6 h-6" />}
                    trend={8.2}
                    trendUp
                  />
                  <KpiCard
                    title="Products"
                    value={totalProducts}
                    icon={<Package className="w-6 h-6" />}
                    trend={-2.4}
                    trendUp={false}
                  />
                  <KpiCard
                    title="Customers"
                    value={totalCustomers}
                    icon={<Users className="w-6 h-6" />}
                    trend={15.3}
                    trendUp
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Revenue Overview */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Weekly Sales */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Sales</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklySalesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Orders & Category Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
                    <AdminTable
                      columns={[
                        { key: 'id', label: 'Order ID', sortable: true },
                        { key: 'customer', label: 'Customer', sortable: true },
                        { key: 'total', label: 'Amount', sortable: true, render: r => `₦${r.total?.toLocaleString('en-NG') || '0'}` },
                        { key: 'status', label: 'Status', sortable: true, render: r => (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            r.status === 'Completed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            r.status === 'Processing' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                            r.status === 'Shipped' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {r.status || 'Pending'}
                          </span>
                        )}
                      ]}
                      data={orders.slice(0, 5)}
                      pageSize={5}
                      onView={setViewOrder}
                    />
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categorySalesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categorySalesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₦${value.toLocaleString('en-NG')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {categorySalesData.map((cat, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                          <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                          <span className="ml-auto font-bold text-gray-900 dark:text-white">₦{cat.value.toLocaleString('en-NG')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders</h2>
                  <p className="text-gray-600 dark:text-gray-300">Manage and track all customer orders</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Orders</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Processing</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{orders.filter(o => o.status === 'Processing').length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Shipped</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{orders.filter(o => o.status === 'Shipped').length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Delivered</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{orders.filter(o => o.status === 'Delivered').length}</p>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setOrderFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          orderFilter === 'all'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        All Orders
                      </button>
                      <button
                        onClick={() => setOrderFilter('Processing')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          orderFilter === 'Processing'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-100'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Processing
                      </button>
                      <button
                        onClick={() => setOrderFilter('Shipped')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          orderFilter === 'Shipped'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Shipped
                      </button>
                      <button
                        onClick={() => setOrderFilter('Delivered')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          orderFilter === 'Delivered'
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Delivered
                      </button>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500"
                      />
                      <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium">
                        Filter
                      </button>
                    </div>
                  </div>

                  <AdminTable
                    columns={[
                      { key: 'id', label: 'Order ID', sortable: true },
                      { key: 'customer', label: 'Customer', sortable: true },
                      { key: 'date', label: 'Date', sortable: true },
                      { key: 'items', label: 'Items', sortable: false, render: r => (r.items?.length || 0) },
                      { key: 'total', label: 'Amount', sortable: true, render: r => `₦${r.total?.toLocaleString('en-NG') || '0'}` },
                      { key: 'status', label: 'Status', sortable: true, render: r => (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          r.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                          r.status === 'Processing' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                          r.status === 'Shipped' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {r.status || 'Pending'}
                        </span>
                      )},
                      { key: 'actions', label: 'Actions', sortable: false, render: r => (
                        <button onClick={() => setViewOrder(r)} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                    ]}
                    data={orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter)}
                    pageSize={10}
                    onView={setViewOrder}
                  />
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your product inventory</p>
                  </div>
                  <button
                    onClick={() => { setEditingProduct(null); setShowProductForm(true) }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    + Add Product
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Products ({products.length})</h3>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Search products..."
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 w-64"
                      />
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-medium">
                        Filter
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Product</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Category</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Price</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Stock</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, i) => (
                          <tr key={product.id || i} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  {product.image ? (
                                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/50?text=No+Image')} />
                                  ) : (
                                    <span className="text-2xl">📦</span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-white">{product.title}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-gray-600 dark:text-gray-400">{product.category || 'Uncategorized'}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-gray-900 dark:text-white">₦{typeof product.price === 'number' ? product.price.toLocaleString('en-NG') : product.price}</p>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-semibold text-gray-900 dark:text-white">{product.stock || 0}</p>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                product.stock > 20 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                product.stock > 5 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}>
                                {product.stock > 20 ? 'In Stock' : product.stock > 5 ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <button onClick={() => { setEditingProduct(product); setShowProductForm(true) }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                ⋮
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'customers' && (
              <div>
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Customers</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">View and manage your customer base</p>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
                    👤 Add Customer
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Customers</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{totalCustomers.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">New This Month</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{newCustomersThisMonth.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Active Customers</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">{Math.floor(totalCustomers * 0.93).toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Avg. Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">₦{(totalRevenue / totalOrders).toLocaleString('en-NG')}</p>
                  </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Customers ({totalCustomers})</h3>
                    <input
                      type="text"
                      placeholder="Search customers..."
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 w-64"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Customer</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Contact</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Orders</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Total Spent</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer, i) => {
                          const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                          const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700', 'bg-yellow-100 text-yellow-700', 'bg-indigo-100 text-indigo-700', 'bg-red-100 text-red-700', 'bg-cyan-100 text-cyan-700'];

                          return (
                            <tr key={customer.email} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-full ${colors[i % colors.length]} flex items-center justify-center font-semibold`}>
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{customer.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">✉️ {customer.email}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-gray-900 dark:text-white">{customer.orders}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="font-semibold text-gray-900 dark:text-white">₦{customer.totalSpent.toLocaleString('en-NG')}</p>
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                              </td>
                              <td className="py-4 px-4">
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {tab === 'analytics' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Detailed insights and performance metrics</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Completed Orders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedOrders.length}</p>
                      </div>
                      <span className="text-3xl opacity-40 flex-shrink-0 ml-2">✅</span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">📈 +{((completedOrders.length / totalOrders) * 100).toFixed(1)}% of total</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Avg. Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{avgOrderValue.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</p>
                      </div>
                      <span className="text-3xl opacity-40 flex-shrink-0 ml-2">🛒</span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">📈 from {completedOrders.length} orders</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 relative">
                    <span className="absolute top-4 right-4 text-3xl opacity-40">💰</span>
                    <div className="mb-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">₦{completedRevenue.toLocaleString('en-NG')}</p>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">From completed orders</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Customers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
                      </div>
                      <span className="text-3xl opacity-40 flex-shrink-0 ml-2">👥</span>
                    </div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Active customers</p>
                  </div>
                </div>

                {/* Tab Filters */}
                <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={() => setAnalyticsTab('revenue')}
                    className={`px-4 py-2 border-b-2 font-semibold transition ${
                      analyticsTab === 'revenue' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Revenue
                  </button>
                  <button 
                    onClick={() => setAnalyticsTab('orders')}
                    className={`px-4 py-2 border-b-2 font-semibold transition ${
                      analyticsTab === 'orders' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Orders
                  </button>
                  <button 
                    onClick={() => setAnalyticsTab('categories')}
                    className={`px-4 py-2 border-b-2 font-semibold transition ${
                      analyticsTab === 'categories' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Categories
                  </button>
                </div>

                {/* Revenue Trend Chart */}
                {analyticsTab === 'revenue' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Trend (Completed Orders)</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                )}

                {/* Weekly Orders Chart */}
                {analyticsTab === 'orders' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-8">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Orders by Day (This Week)</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={weeklySalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="day" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                )}

                {/* Category Sales Chart */}
                {analyticsTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categorySalesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categorySalesData.map((entry, index) => {
                            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                          })}
                        </Pie>
                        <Tooltip formatter={(value) => `₦${value.toLocaleString('en-NG')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
                    <div className="space-y-3">
                      {categorySalesData.map((cat, i) => {
                        const colors = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-red-100 text-red-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700', 'bg-orange-100 text-orange-700']
                        const barColors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-orange-500']
                        const maxValue = Math.max(...categorySalesData.map(d => d.value))
                        const percentage = maxValue > 0 ? (cat.value / maxValue) * 100 : 0
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${colors[i % colors.length]}`}>
                                {cat.name}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">₦{cat.value.toLocaleString('en-NG')}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`${barColors[i % barColors.length]} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

            {tab === 'settings' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your store settings and preferences</p>
                </div>

                {/* Settings Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setSettingsTab('general')}
                    className={`pb-3 px-2 border-b-2 font-semibold transition ${
                      settingsTab === 'general'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setSettingsTab('payments')}
                    className={`pb-3 px-2 border-b-2 font-semibold transition ${
                      settingsTab === 'payments'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => setSettingsTab('shipping')}
                    className={`pb-3 px-2 border-b-2 font-semibold transition ${
                      settingsTab === 'shipping'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Shipping
                  </button>
                  <button
                    onClick={() => setSettingsTab('notifications')}
                    className={`pb-3 px-2 border-b-2 font-semibold transition ${
                      settingsTab === 'notifications'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Notifications
                  </button>
                </div>

                {/* General Settings */}
                {settingsTab === 'general' && (
                  <div>
                    {/* Store Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Store Information</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Store Name</label>
                            <input
                              type="text"
                              value={localSettings.storeName}
                              onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Store Email</label>
                            <input
                              type="email"
                              value={localSettings.storeEmail}
                              onChange={(e) => setLocalSettings({ ...localSettings, storeEmail: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Store Description</label>
                          <textarea
                            value={localSettings.storeDescription}
                            onChange={(e) => setLocalSettings({ ...localSettings, storeDescription: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={localSettings.phoneNumber}
                              onChange={(e) => setLocalSettings({ ...localSettings, phoneNumber: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                            <select
                              value={localSettings.timezone}
                              onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                              <option>Eastern Time (ET)</option>
                              <option>Central Time (CT)</option>
                              <option>Mountain Time (MT)</option>
                              <option>Pacific Time (PT)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Store Address</label>
                          <input
                            type="text"
                            value={localSettings.storeAddress}
                            onChange={(e) => setLocalSettings({ ...localSettings, storeAddress: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                          />
                        </div>
                        <button onClick={() => alert('Store information saved successfully!')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                          Save Changes
                        </button>
                      </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Regional Settings</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Default Currency</label>
                            <select
                              value={localSettings.defaultCurrency}
                              onChange={(e) => setLocalSettings({ ...localSettings, defaultCurrency: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                              <option>NGN - Nigerian Naira</option>
                              <option>USD - US Dollar</option>
                              <option>EUR - Euro</option>
                              <option>GBP - British Pound</option>
                              <option>CAD - Canadian Dollar</option>
                              <option>AUD - Australian Dollar</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Language</label>
                            <select
                              value={localSettings.language}
                              onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                            >
                              <option>English</option>
                              <option>Spanish</option>
                              <option>French</option>
                              <option>German</option>
                              <option>Chinese</option>
                            </select>
                          </div>
                        </div>
                        <button onClick={() => alert('Regional settings saved successfully!')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payments Settings */}
                {settingsTab === 'payments' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Payment Methods</h3>
                    <div className="space-y-6">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Stripe</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Accept credit and debit cards</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">PayPal</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Accept PayPal payments</p>
                          </div>
                          <input type="checkbox" className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Apple Pay</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Accept Apple Pay payments</p>
                          </div>
                          <input type="checkbox" className="w-5 h-5" />
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Shipping Settings */}
                {settingsTab === 'shipping' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Shipping Rates</h3>
                    <div className="space-y-6">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Standard Shipping</h4>
                        <input
                          type="text"
                          placeholder="$9.99"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Express Shipping</h4>
                        <input
                          type="text"
                          placeholder="$19.99"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Free Shipping Threshold</h4>
                        <input
                          type="text"
                          placeholder="$50.00"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                        />
                      </div>
                      <button onClick={() => alert('Shipping rates saved successfully!')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {settingsTab === 'notifications' && (
                  <div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 mb-8">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Email Notifications</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">New Order</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get notified when a new order is placed</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-600" />
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Order Shipped</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get notified when an order is shipped</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-600" />
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Low Stock Alert</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get notified when product stock is low</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-600" />
                        </div>
                        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">New Customer</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get notified when a new customer registers</p>
                          </div>
                          <input type="checkbox" className="w-6 h-6 rounded accent-blue-600" />
                        </div>
                        <div className="flex items-center justify-between py-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Report</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Receive weekly sales and analytics report</p>
                          </div>
                          <input type="checkbox" defaultChecked className="w-6 h-6 rounded accent-blue-600" />
                        </div>
                      </div>
                    </div>
                    <button onClick={() => alert('Notification preferences saved successfully!')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                      Save Preferences
                    </button>
                  </div>
                )}
              </div>
            )}

            {showProductForm && (
              <ProductForm product={editingProduct} onSave={saveProduct} onClose={() => { setShowProductForm(false); setEditingProduct(null) }} />
            )}

            {viewOrder && (
              <OrderDrawer order={viewOrder} onClose={() => setViewOrder(null)} onUpdateStatus={updateOrderStatus} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon, trend, trendUp }) {
  const isReactIcon = icon && typeof icon === 'object' && icon.$$typeof // Check if it's a React component
  const isNairaSymbol = icon === '₦' // Check if it's the naira symbol
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`flex-shrink-0 ${isReactIcon || isNairaSymbol ? 'text-blue-500 text-2xl' : 'text-3xl opacity-40'}`}>{icon}</div>
      </div>
      <div className="flex items-center gap-1">
        {trendUp ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
        <span className={`text-sm font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {trendUp ? '+' : ''}{trend}% from last month
        </span>
      </div>
    </div>
  )
}

function ProductForm({ product, onSave, onClose }) {
  const [title, setTitle] = useState(product?.title || '')
  const [sku, setSku] = useState(product?.sku || '')
  const [price, setPrice] = useState(product?.price || 0)
  const [stock, setStock] = useState(product?.stock || 0)
  const [category, setCategory] = useState(product?.category || '')
  const [image, setImage] = useState(product?.image || '')
  const [imagePreview, setImagePreview] = useState(product?.image || '')

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target.result)
        setImagePreview(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  function submit() {
    // Preserve all original product data and only update the edited fields
    onSave({ 
      ...product,
      id: product?.id || null, 
      title, 
      sku, 
      price: Number(price), 
      stock: Number(stock), 
      category, 
      image 
    })
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{product ? 'Edit Product' : 'Add Product'}</h3>
        <div className="space-y-3">
          {/* Image Upload */}
          <div>
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-2">Product Image</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Product preview" className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={() => { setImage(''); setImagePreview('') }}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">SKU</label>
            <input value={sku} onChange={e => setSku(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" placeholder="e.g., Electronics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Price</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-300">Stock</label>
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
