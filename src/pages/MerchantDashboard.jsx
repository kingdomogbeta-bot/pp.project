import React, { useState, useEffect } from 'react'
import AdminTable from '../components/admin/AdminTable'
import KpiCard from '../components/admin/KpiCard'
import { getCurrentUser } from '../utils/auth'
import { orderManager } from '../utils/orderManager'
import OrderDrawer from '../components/admin/OrderDrawer'
import ImportExport from '../components/admin/ImportExport'
import Topbar from '../components/admin/Topbar'

export default function MerchantDashboard({ products: externalProducts, onNavigate, onProductsChange, orders: externalOrders, ordersMap, onOrdersChange }) {
  const [tab, setTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const currentUser = getCurrentUser()
  const isAdmin = !!(currentUser && (currentUser.role === 'admin' || currentUser.isAdmin))

  const [orders, setOrders] = useState(() => {
    return orderManager.getAllOrders()
  })

  const [products, setProducts] = useState(() => {
    try {
      if (externalProducts && Array.isArray(externalProducts) && externalProducts.length) return externalProducts
      const raw = localStorage.getItem('merchant_products')
      return raw ? JSON.parse(raw) : [
        { id: 'p1', title: 'Bluetooth Headphones', sku: 'BT-001', stock: 45, price: 59.99 },
        { id: 'p2', title: 'Running Sneakers', sku: 'RUN-001', stock: 12, price: 89.0 }
      ]
    } catch (e) { return [] }
  })

  // Extract unique customers from orders
  const customers = Array.from(new Map(
    orders.map(o => [o.userEmail, { email: o.userEmail, name: o.customer, orders: orders.filter(x => x.userEmail === o.userEmail).length, totalSpent: orders.filter(x => x.userEmail === o.userEmail).reduce((s, x) => s + x.total, 0) }])
  ).values())

  // Calculate analytics
  const analytics = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + (o.total || 0), 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((s, o) => s + (o.total || 0), 0) / orders.length : 0,
    totalCustomers: customers.length,
    pendingOrders: orders.filter(o => o.status === 'Pending').length,
    shippedOrders: orders.filter(o => o.status === 'Shipped').length,
    processingOrders: orders.filter(o => o.status === 'Processing').length,
    totalProducts: products.length,
    lowStockProducts: products.filter(p => p.stock < 10).length
  }

  const [viewOrder, setViewOrder] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState([])

  useEffect(() => {
    // Subscribe to real-time order changes (only once on mount)
    console.log('👨‍💼 MerchantDashboard subscribing to orders')
    
    // Load existing orders from localStorage first
    const existingOrders = orderManager.getAllOrders()
    console.log('📥 Loading existing orders from orderManager:', existingOrders)
    if (existingOrders && existingOrders.length > 0) {
      setOrders(existingOrders)
    }
    
    // Subscribe to future changes
    const unsubscribe = orderManager.subscribe((updatedOrders) => {
      console.log('📊 Orders updated in dashboard from subscription:', updatedOrders)
      setOrders(updatedOrders)
    })
    return unsubscribe
  }, [])

  // If external orders are passed as props, use them (fallback)
  useEffect(() => {
    if (externalOrders && Array.isArray(externalOrders) && externalOrders.length > 0) {
      console.log('📩 Using external orders from props:', externalOrders)
      setOrders(externalOrders)
      return
    }
    if (ordersMap && typeof ordersMap === 'object' && Object.keys(ordersMap).length > 0) {
      console.log('📩 Using orders from ordersMap:', ordersMap)
      setOrders(Object.values(ordersMap).flat())
    }
  }, [externalOrders, ordersMap])

  useEffect(() => {
    localStorage.setItem('merchant_orders', JSON.stringify(orders))
    if (typeof onOrdersChange === 'function') onOrdersChange(orders)
  }, [orders, onOrdersChange])

  useEffect(() => {
    localStorage.setItem('merchant_products', JSON.stringify(products))
    if (typeof onProductsChange === 'function') onProductsChange(products)
  }, [products, onProductsChange])

  useEffect(() => {
    if (externalProducts && Array.isArray(externalProducts)) {
      setProducts(externalProducts)
    }
  }, [externalProducts])

  function updateOrderStatus(id, status) {
    orderManager.updateOrderStatus(id, status)
  }

  function removeOrder(id) {
    orderManager.deleteOrder(id)
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
      <div className="flex h-screen">
        
        <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-blue-900 text-white p-4 transition-all duration-200`}> 
          <div className="flex items-center justify-between mb-6">
            <h1 className={`text-xl font-bold ${sidebarCollapsed ? 'hidden' : ''}`}>Merchant Panel</h1>
            <button onClick={() => setSidebarCollapsed(s => !s)} className="p-1 rounded bg-blue-800/60 hover:bg-blue-700">{sidebarCollapsed ? '→' : '←'}</button>
          </div>
          <nav className="space-y-3">
            <button onClick={() => setTab('overview')} className={`w-full flex items-center gap-3 px-3 py-2 rounded ${tab === 'overview' ? 'bg-blue-700' : 'hover:bg-blue-800/60'}`} title="Dashboard">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? 'D' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>Dashboard</span>
            </button>

            <button onClick={() => setTab('analytics')} className={`w-full flex items-center gap-3 px-3 py-2 rounded ${tab === 'analytics' ? 'bg-blue-700' : 'hover:bg-blue-800/60'}`} title="Analytics">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? 'A' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>Analytics</span>
            </button>

            <button onClick={() => setTab('customers')} className={`w-full flex items-center gap-3 px-3 py-2 rounded ${tab === 'customers' ? 'bg-blue-700' : 'hover:bg-blue-800/60'}`} title="Customers">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? 'C' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>Customers</span>
            </button>

            <button onClick={() => setTab('orders')} className={`w-full flex items-center gap-3 px-3 py-2 rounded ${tab === 'orders' ? 'bg-blue-700' : 'hover:bg-blue-800/60'}`} title="Orders">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? 'O' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>Orders</span>
            </button>

            <button onClick={() => setTab('products')} className={`w-full flex items-center gap-3 px-3 py-2 rounded ${tab === 'products' ? 'bg-blue-700' : 'hover:bg-blue-800/60'}`} title="Products">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? 'P' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>Products</span>
            </button>

            <button onClick={() => onNavigate('home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-200 hover:text-white`} title="Back to Store">
              <span className="inline-block w-6 text-center text-sm">{sidebarCollapsed ? '<' : ''}</span>
              <span className={`${sidebarCollapsed ? 'hidden' : ''}`}>← Back to Store</span>
            </button>
          </nav>
        </div>

        
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Topbar
              onToggleSidebar={() => setSidebarCollapsed(s => !s)}
              onAddProduct={() => { setEditingProduct(null); setShowProductForm(true) }}
              onImport={() => alert('Import CSV - not implemented')}
              onSearch={(q) => console.log('search admin:', q)}
            />
            {tab === 'overview' && (
              <div>
                <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <KpiCard title="Total Orders" value={analytics.totalOrders} />
                  <KpiCard title="Total Revenue" value={`₦${analytics.totalRevenue.toLocaleString('en-NG')}`} />
                  <KpiCard title="Avg Order Value" value={`₦${analytics.avgOrderValue.toLocaleString('en-NG')}`} />
                  <KpiCard title="Total Customers" value={analytics.totalCustomers} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Pending Orders</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.pendingOrders}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Processing Orders</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.processingOrders}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Shipped Orders</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.shippedOrders}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
                  <AdminTable
                    columns={[
                      { key: 'id', label: 'Order ID', sortable: true },
                      { key: 'customer', label: 'Customer', sortable: true },
                      { key: 'total', label: 'Amount', sortable: true, render: (r) => `₦${r.total.toLocaleString('en-NG')}` },
                      { key: 'status', label: 'Status', sortable: true, render: (r) => <span className={`px-2 py-1 rounded text-sm ${r.status === 'Shipped' ? 'bg-green-100 text-green-700' : r.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }
                    ]}
                    data={orders.slice(0, 10)}
                    pageSize={5}
                    onView={(o)=>setViewOrder(o)}
                  />
                </div>
              </div>
            )}

            {tab === 'analytics' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Analytics & Reports</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Products</div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">{analytics.totalProducts}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Low Stock Items</div>
                    <div className="text-4xl font-bold text-amber-600">{analytics.lowStockProducts}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Customers</div>
                    <div className="text-4xl font-bold text-blue-600">{analytics.totalCustomers}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Revenue</div>
                    <div className="text-3xl font-bold text-green-600">₦{analytics.totalRevenue.toLocaleString('en-NG')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Pending</span>
                        <div className="flex items-center gap-2">
                          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{width: `${orders.length > 0 ? (analytics.pendingOrders / orders.length) * 100 : 0}%`}}></div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white min-w-12">{analytics.pendingOrders}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Processing</span>
                        <div className="flex items-center gap-2">
                          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{width: `${orders.length > 0 ? (analytics.processingOrders / orders.length) * 100 : 0}%`}}></div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white min-w-12">{analytics.processingOrders}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">Shipped</span>
                        <div className="flex items-center gap-2">
                          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{width: `${orders.length > 0 ? (analytics.shippedOrders / orders.length) * 100 : 0}%`}}></div>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white min-w-12">{analytics.shippedOrders}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Revenue:</span>
                        <span className="font-bold text-gray-900 dark:text-white">₦{analytics.totalRevenue.toLocaleString('en-NG')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Total Orders:</span>
                        <span className="font-bold text-gray-900 dark:text-white">{analytics.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Average Order Value:</span>
                        <span className="font-bold text-gray-900 dark:text-white">₦{analytics.avgOrderValue.toLocaleString('en-NG')}</span>
                      </div>
                      <hr className="border-gray-200 dark:border-gray-700" />
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">Average per Customer:</span>
                        <span className="font-bold text-gray-900 dark:text-white">₦{analytics.totalCustomers > 0 ? (analytics.totalRevenue / analytics.totalCustomers).toLocaleString('en-NG') : '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'customers' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Customers</h2>
                <AdminTable
                  columns={[
                    { key: 'email', label: 'Email', sortable: true },
                    { key: 'name', label: 'Name', sortable: true },
                    { key: 'orders', label: 'Orders', sortable: true, render: (c) => c.orders },
                    { key: 'totalSpent', label: 'Total Spent', sortable: true, render: (c) => `₦${c.totalSpent.toLocaleString('en-NG')}` }
                  ]}
                  data={customers}
                  pageSize={10}
                  onView={(c) => console.log('View customer:', c)}
                />
              </div>
            )}

            {tab === 'orders' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Orders</h2>
                <AdminTable
                  columns={[
                    { key: 'id', label: 'Order ID', sortable: true },
                    { key: 'customer', label: 'Customer', sortable: true },
                    { key: 'date', label: 'Date', sortable: true },
                    { key: 'total', label: 'Amount', sortable: true, render: r => `$${r.total}` },
                    { key: 'status', label: 'Status', sortable: true, render: r => <span className={`px-2 py-1 rounded text-sm ${r.status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span> }
                  ]}
                  data={orders}
                  pageSize={10}
                  onView={(o)=>setViewOrder(o)}
                />
              </div>
            )}

            {tab === 'products' && (
              <div>
                <h2 className="text-3xl font-bold mb-6">Products</h2>
                <div className="mb-6">
                  {!isAdmin && (
                    <>
                      <button onClick={()=>{setEditingProduct(null); setShowProductForm(true)}} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Add Product</button>
                      <div className="inline-block ml-3 align-middle">
                        <ImportExport onImport={(rows)=>{
                          const mapped = rows.map(r=>({ id: 'p' + Date.now() + Math.random().toString(36).slice(2,6), title: r.title || r.name || 'Imported', sku: r.sku || '', price: Number(r.price) || 0, stock: Number(r.stock) || 0, image: r.image || '', category: r.category || 'Uncategorized' }))
                          setProducts(prev => [...mapped, ...prev])
                        }} />
                      </div>
                    </>
                  )}
                </div>
                {selectedProductIds && selectedProductIds.length > 0 && (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="text-sm text-gray-700">{selectedProductIds.length} selected</div>
                    <button onClick={() => {
                      if (!confirm('Delete selected products?')) return
                      setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)))
                      logAction('bulk-delete', 'product', { ids: selectedProductIds })
                      setSelectedProductIds([])
                    }} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Delete</button>

                    <button onClick={() => {
                      const v = prompt('Set stock for selected products (number):')
                      if (v == null) return
                      const n = Number(v)
                      if (Number.isNaN(n)) { alert('Invalid number'); return }
                      setProducts(prev => prev.map(p => selectedProductIds.includes(p.id) ? { ...p, stock: n } : p))
                      logAction('bulk-update', 'product', { action: 'set-stock', ids: selectedProductIds, value: n })
                    }} className="px-3 py-1 rounded bg-yellow-500 text-white text-sm">Set Stock</button>

                    <button onClick={() => {
                      const cat = prompt('Assign category to selected products:')
                      if (cat == null) return
                      setProducts(prev => prev.map(p => selectedProductIds.includes(p.id) ? { ...p, category: cat } : p))
                      logAction('bulk-update', 'product', { action: 'assign-category', ids: selectedProductIds, category: cat })
                    }} className="px-3 py-1 rounded bg-blue-500 text-white text-sm">Assign Category</button>

                    <button onClick={() => {
                      const rows = products.filter(p => selectedProductIds.includes(p.id)).map(p => ({ id: p.id, title: p.title, sku: p.sku, price: p.price, stock: p.stock, category: p.category }))
                      const csv = [Object.keys(rows[0]||{}).join(','), ...rows.map(r=>Object.values(r).map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')
                      const blob = new Blob([csv], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url; a.download = 'products-export.csv'; a.click(); URL.revokeObjectURL(url)
                      logAction('export', 'product', { action: 'export-csv', ids: selectedProductIds, count: rows.length })
                    }} className="px-3 py-1 rounded bg-gray-700 text-white text-sm">Export CSV</button>
                  </div>
                )}
                <AdminTable
                  columns={[
                    { key: 'title', label: 'Title', sortable: true, render: r => r.title },
                    { key: 'sku', label: 'SKU', sortable: true },
                    { key: 'price', label: 'Price', sortable: true, render: r => `$${r.price}` },
                    { key: 'stock', label: 'Stock', sortable: true, render: r => <span className={`px-2 py-1 rounded text-sm ${r.stock > 20 ? 'bg-green-100 text-green-700' : r.stock > 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-amber-100 text-amber-800'}`}>{r.stock} units</span> },
                    { key: 'category', label: 'Category', sortable: true, render: r => r.category || 'Uncategorized' }
                  ]}
                  data={products}
                  pageSize={10}
                  onView={(p)=>{ setEditingProduct(p); setShowProductForm(true) }}
                  onSelectionChange={(ids)=>{ setSelectedProductIds(ids) }}
                  onDelete={(p)=>{ if(!confirm('Delete product?')) return; setProducts(prev=>prev.filter(x=>x.id!==p.id)) }}
                />
              </div>
            )}

            
            <OrderDrawer order={viewOrder} onClose={() => setViewOrder(null)} onUpdateStatus={(id, s) => { updateOrderStatus(id, s); setViewOrder(prev=> prev ? ({...prev, status: s}) : prev) }} />

            
            {showProductForm && (
              <ProductForm product={editingProduct} onSave={saveProduct} onClose={()=>{setShowProductForm(false); setEditingProduct(null)}} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductForm({ product, onSave, onClose }){
  const [title, setTitle] = useState(product?.title||'')
  const [sku, setSku] = useState(product?.sku||'')
  const [price, setPrice] = useState(product?.price||0)
  const [stock, setStock] = useState(product?.stock||0)
  const [image, setImage] = useState(product?.image||'')
  const [imagePreview, setImagePreview] = useState(product?.image||'')

  function submit(){
    const p = { id: product?.id||null, title, sku, price: Number(price), stock: Number(stock), image }
    onSave(p)
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [])

  function handleFile(e){
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{product? 'Edit Product':'Add Product'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Image URL</label>
            <input value={image} onChange={e=>{ setImage(e.target.value); setImagePreview(e.target.value) }} placeholder="https://... or upload file" className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Or Upload Image</label>
            <input type="file" accept="image/*" onChange={handleFile} className="w-full mt-1" />
          </div>
          {imagePreview && (
            <div>
              <label className="text-sm text-gray-600">Preview</label>
              <div className="mt-2">
                <img src={imagePreview} alt="preview" className="w-32 h-32 object-cover rounded border" />
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm text-gray-600">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>
          <div>
            <label className="text-sm text-gray-600">SKU</label>
            <input value={sku} onChange={e=>setSku(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Price</label>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Stock</label>
              <input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded bg-white dark:bg-black text-gray-900 dark:text-gray-200" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
