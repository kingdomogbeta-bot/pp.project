import React, { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import { orderManager } from './utils/orderManager'
import Home from './pages/Home'
import ProductListing from './pages/ProductListing'
import ProductDetail from './pages/ProductDetail'
import ProductCart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderHistory from './pages/OrderHistory'
import AccountSettings from './pages/AccountSettings'
import Wishlist from './pages/Wishlist'
import AdminDashboard from './pages/AdminDashboard'
import NotificationsPage from './pages/NotificationsPage'
import productsData from './data/products'

function App() {
  const [route, setRoute] = useState('home')
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })
  
  const [showAuth, setShowAuth] = useState(false)
  const [pendingRoute, setPendingRoute] = useState(null)
  const [theme, setTheme] = useState(() => {
    try {
      const raw = localStorage.getItem('theme')
      return raw || 'dark'
    } catch (e) {
      return 'dark'
    }
  })
  
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  const [products, setProducts] = useState(() => {
    try {
      // Try merchant_products first (synced from admin), fallback to base products
      const merchant = localStorage.getItem('merchant_products')
      if (merchant) {
        const parsed = JSON.parse(merchant)
        if (parsed && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Failed to load merchant_products:', e)
    }
    // Fallback to base products with stock initialized
    return productsData.map(p => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : 50 // Ensure all products have stock
    }))
  })

  // Ensure merchant_products is seeded for non-admin users so storefront shows full catalog
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const force = params.get('forceSeed') === '1' || params.get('forceSeed') === 'true'

      const raw = localStorage.getItem('merchant_products')
      const parsed = raw ? JSON.parse(raw) : null
      console.log('🔍 merchant_products length:', parsed ? parsed.length : 0, 'bundled products:', productsData?.length || 0, 'forceSeed:', force)

      // Check if products have rating/description - if not, they're corrupted
      const isCorrupted = parsed && parsed.length > 0 && parsed.some(p => !p.rating || !p.description)
      
      // Only seed if merchant_products is completely empty OR corrupted (missing ratings/descriptions)
      const needSeed = !parsed || parsed.length === 0 || isCorrupted
      if (force || needSeed) {
        // Merge stored prices with default product data to preserve prices while restoring ratings/descriptions
        const seeded = productsData.map(defaultProduct => {
          const stored = parsed?.find(p => p.id === defaultProduct.id)
          return {
            ...defaultProduct, // Start with complete default data (includes rating, description, etc)
            price: stored?.price !== undefined ? stored.price : defaultProduct.price, // Keep custom price if it exists
            stock: stored?.stock !== undefined ? stored.stock : (defaultProduct.stock || 50) // Keep custom stock if it exists
          }
        })
        localStorage.setItem('merchant_products', JSON.stringify(seeded))
        setProducts(seeded)
        console.log('📦 Seeded merchant_products from productsData in App (force=%s, isCorrupted=%s)', force, isCorrupted)
      } else {
        // if merchant_products exists and is not corrupted, use it as-is (don't overwrite with old prices)
        if (parsed && parsed.length > 0) {
          setProducts(parsed)
          console.log('✅ merchant_products present — first IDs:', parsed.slice(0,5).map(p=>p.id))
        }
      }
    } catch (e) {
      console.error('Failed to seed merchant_products:', e)
    }
  }, [])

  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem('wishlist')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('storeSettings')
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return {
      storeName: 'Horizon Store',
      storeEmail: 'admin@store.com',
      storeDescription: 'Your one-stop shop for quality products at great prices.',
      phoneNumber: '+1 (555) 123-4567',
      timezone: 'Eastern Time (ET)',
      storeAddress: '123 Commerce Street, Suite 100, New York, NY 10001',
      defaultCurrency: 'USD - US Dollar',
      language: 'English'
    }
  })

  function addToCart(product, qty = 1) {
    setCart(prev => {
      const found = prev.find(p => p.id === product.id)
      if (found) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + qty } : p)
      }
      return [...prev, { ...product, qty }]
    })
    setToast({ message: 'Cart successfully updated', show: true, type: 'success' })
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(p => p.id !== id))
  }

  function updateQty(id, qty) {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty } : p))
  }

  function toggleWishlist(product) {
    const exists = wishlist.find(p => p.id === product.id)
    if (exists) {
      setWishlist(prev => prev.filter(p => p.id !== product.id))
    } else {
      setWishlist(prev => [...prev, product])
    }
  }

  function handleAuth(authData) {
    const userObj = { name: authData.name, email: authData.email }
    if (authData.isAdmin) userObj.isAdmin = true
    setUser(userObj)
    setShowAuth(false)
    
    // If there's pending checkout data, complete the order
    if (pendingCheckoutData && pendingRoute === 'checkout') {
      onPlaceOrder(pendingCheckoutData)
      setPendingCheckoutData(null)
      setPendingRoute(null)
      return
    }
    
    // If user is admin, redirect to merchant dashboard
    if (authData.isAdmin) {
      setRoute('merchant')
      setPendingRoute(null)
      return
    }
    
    if (pendingRoute) {
      if (pendingRoute === 'merchant') {
        if (authData.isAdmin) setRoute(pendingRoute)
      } else {
        setRoute(pendingRoute)
      }
      setPendingRoute(null)
    }
  }

  function handleLogout() {
    setUser(null)
    setRoute('home')
  }

  function requireAuth(routeName) {
    if (user) {
      setRoute(routeName)
    } else {
      setPendingRoute(routeName)
      setShowAuth(true)
    }
  }

  // Wrapper function for navigation that prevents admins from accessing user routes
  function safeSetRoute(newRoute) {
    const isAdmin = !!(user && (user.role === 'admin' || user.isAdmin))
    const userOnlyRoutes = ['home', 'products', 'wishlist', 'cart', 'checkout', 'order-confirmation', 'orders', 'account']
    
    // If admin tries to access user-only route, redirect to merchant
    if (isAdmin && userOnlyRoutes.includes(newRoute)) {
      setRoute('merchant')
      return
    }
    
    setRoute(newRoute)
  }

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  const [orders, setOrders] = useState(() => {
    try {
      const raw = localStorage.getItem('orders')
      return raw ? JSON.parse(raw) : {}
    } catch (e) {
      return {}
    }
  })

  const [lastOrder, setLastOrder] = useState(null)
  const [toast, setToast] = useState({ message: '', show: false, type: 'info' })
  const [appliedPromoCode, setAppliedPromoCode] = useState(null)
  const [pendingCheckoutData, setPendingCheckoutData] = useState(null)
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState(null)

  function onPlaceOrder(order) {
    console.log('🛒 onPlaceOrder called with:', order)
    const customerName = user?.name || order.address?.name || ''
    const emailKey = user?.email || order.email || 'guest'
    
    console.log('👤 Customer:', customerName, 'Email:', emailKey)
    
    // Use orderManager to save order (this syncs to admin dashboard)
    const savedOrder = orderManager.createOrder({
      userEmail: emailKey,
      customer: customerName,
      items: order.items || [],
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      total: order.total || 0,
      shipping: order.shipping || {},
      address: order.address || {},
      payment: order.payment || {}
    })
    
    console.log('✅ Order saved:', savedOrder)
    setLastOrder(savedOrder)
    setCart([])
    setRoute('order-confirmation')
  }

  function handleReorder(order) {
    try {
      (order.items || []).forEach(it => {
        addToCart(it, it.qty || 1)
      })
      setToast({ message: 'Items added to cart for reorder', show: true, type: 'success' })
      setRoute('cart')
    } catch (e) {
      setToast({ message: 'Failed to reorder items', show: true, type: 'error' })
    }
  }

  function handleUpdateUser(info) {
    const next = { ...(user || {}), name: info.name, phone: info.phone }
    setUser(next)
  }

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (e) {
    }
  }, [cart])

  useEffect(() => {
    try {
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
    } catch (e) {
    }
  }, [wishlist])

  useEffect(() => {
    try {
      localStorage.setItem('storeSettings', JSON.stringify(storeSettings))
    } catch (e) {
    }
  }, [storeSettings])

  useEffect(() => {
    try {
      localStorage.setItem('user', JSON.stringify(user))
    } catch (e) {
    }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem('orders', JSON.stringify(orders))
    } catch (e) {
    }
  }, [orders])

  useEffect(() => {
    try {
      localStorage.setItem('theme', theme)
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    } catch (e) {}
  }, [theme])

  // Listen for merchant_products changes (admin updates to sync to user side)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'merchant_products') {
        try {
          const updated = JSON.parse(e.newValue || '[]')
          if (updated && updated.length > 0) {
            setProducts(updated)
          }
        } catch (err) {
          console.error('Failed to sync merchant_products:', err)
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => setToast({ message: '', show: false, type: 'info' }), 3000)
    return () => clearTimeout(t)
  }, [toast.show])

  return (
    <ErrorBoundary>
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-full overflow-x-hidden`}>
      <Header 
        onNavigate={safeSetRoute} 
        cartCount={cart.reduce((s, it) => s + it.qty, 0)} 
        cartItems={cart} 
        onRemoveFromCart={removeFromCart}
        user={user}
        wishlist={wishlist}
        onShowAuth={() => setShowAuth(true)}
        onRequireAuth={requireAuth}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <main>
        {/* Admin merchant dashboard - show for all admin routes */}
        {route === 'merchant' && user && (user.role === 'admin' || user.isAdmin) && (
          <AdminDashboard 
            products={products}
            onNavigate={safeSetRoute} 
            onProductsChange={(list)=>setProducts(list)} 
            orders={Object.values(orders || {}).flat()} 
            ordersMap={orders}
            storeSettings={storeSettings}
            onStoreSettingsChange={setStoreSettings}
            onOrdersChange={(list)=>{
              try {
                const map = {}
                (list || []).forEach(o => {
                  const key = o.email || o.customer || 'guest'
                  if (!map[key]) map[key] = []
                  map[key].push(o)
                })
                setOrders(map)
              } catch (e) {
                setOrders({})
              }
            }}
          />
        )}
        
        {/* Redirect admins away from user pages */}
        {user && (user.role === 'admin' || user.isAdmin) && ['home', 'products', 'wishlist', 'cart', 'checkout', 'order-confirmation', 'orders', 'account'].includes(route) && (
          <AdminDashboard 
            products={products}
            onNavigate={safeSetRoute} 
            onProductsChange={(list)=>setProducts(list)} 
            orders={Object.values(orders || {}).flat()} 
            ordersMap={orders}
            storeSettings={storeSettings}
            onStoreSettingsChange={setStoreSettings}
            onOrdersChange={(list)=>{
              try {
                const map = {}
                (list || []).forEach(o => {
                  const key = o.email || o.customer || 'guest'
                  if (!map[key]) map[key] = []
                  map[key].push(o)
                })
                setOrders(map)
              } catch (e) {
                setOrders({})
              }
            }}
          />
        )}
        
        {(!user || (!user.role && !user.isAdmin)) && (
          <>
        {route === 'home' && <Home onNavigate={safeSetRoute} featured={products.slice(0, 6)} />}

        {route === 'products' && (
          <ProductListing 
            products={products} 
            onAddToCart={addToCart} 
            onNavigate={safeSetRoute} 
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
          />
        )}

        {route === 'wishlist' && (
          <Wishlist 
            items={wishlist} 
            onNavigate={safeSetRoute} 
            onAddToCart={addToCart}
            onRemove={(id) => setWishlist(prev => prev.filter(p => p.id !== id))}
          />
        )}

        {route && route.startsWith('product:') && (() => {
          const id = route.split(':')[1]
          const prod = products.find(p => p.id === id)
          return <ProductDetail 
            product={prod} 
            products={products}
            onAddToCart={addToCart}
            onNavigate={safeSetRoute}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            onSetDeliveryLocation={setSelectedDeliveryLocation}
          />
        })()}

        {route === 'checkout' && (
          <Checkout 
            items={cart} 
            onPlaceOrder={onPlaceOrder} 
            onCancel={() => safeSetRoute('cart')} 
            appliedPromoCode={appliedPromoCode}
            user={user}
            selectedDeliveryLocation={selectedDeliveryLocation}
            onRequireAuth={(route, checkoutData) => {
              setPendingRoute(route)
              setPendingCheckoutData(checkoutData)
              setShowAuth(true)
            }}
          />
        )}

        {route === 'order-confirmation' && lastOrder && (
          <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16">
            <div className="max-w-2xl mx-auto px-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border-t-4 border-green-500">
                <div className="text-6xl mb-4 text-green-500">✓</div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Thank you for your purchase. Your order has been placed successfully.</p>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8 text-left">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Order ID</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{lastOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Email</p>
                      <p className="font-bold text-gray-900 dark:text-white">{lastOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Payment Method</p>
                      <p className="font-bold text-gray-900 dark:text-white capitalize">{lastOrder.payment}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Total Amount</p>
                      <p className="font-bold text-lg text-green-600">₦{lastOrder.total?.toLocaleString('en-NG')}</p>
                    </div>
                  </div>
                </div>

                      <div className="bg-blue-50 dark:bg-blue-800 rounded-lg p-6 mb-8 text-left border border-blue-200 dark:border-blue-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">Shipping Address</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {lastOrder.address?.name}<br />
                    {lastOrder.address?.street}<br />
                    {lastOrder.address?.city}, {lastOrder.address?.state} {lastOrder.address?.zip}<br />
                    {lastOrder.address?.country}
                  </p>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300 mb-8">
                  <p>You will receive an email confirmation shortly with tracking information.</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => safeSetRoute('orders')}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    View Order
                  </button>
                  <button 
                    onClick={() => safeSetRoute('home')}
                    className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {route === 'orders' && (
          <OrderHistory orders={user ? (orders[user.email] || []) : []} user={user} onNavigate={safeSetRoute} onReorder={handleReorder} />
        )}

        {route === 'notifications' && (
          <NotificationsPage user={user} onNavigate={safeSetRoute} />
        )}

        {route === 'account' && (
          <AccountSettings user={user} onUpdateUser={handleUpdateUser} onSignOut={handleLogout} />
        )}

        {route === 'cart' && (
          <React.Suspense fallback={<div>Loading cart...</div>}>
            <ProductCart 
              items={cart} 
              onRemove={removeFromCart} 
              onUpdateQty={updateQty} 
              onNavigate={safeSetRoute}
              onApplyPromo={setAppliedPromoCode}
            />
          </React.Suspense>
        )}
          </>
        )}
      </main>

      {(!user || (!user.role && !user.isAdmin)) && <Footer storeSettings={storeSettings} />}

      {toast.show && (
        <div className="fixed top-20 right-2 left-2 sm:right-6 sm:left-auto z-50 flex justify-end">
          <div className={`max-w-md w-full px-4 py-2 rounded-lg shadow-lg border ${toast.type === 'success' ? 'bg-green-100 border-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' : toast.type === 'error' ? 'bg-red-100 border-red-200 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200'}`}>
            {toast.message}
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onAuth={handleAuth} 
      />
    </div>
    </ErrorBoundary>
  )
}

export default App
