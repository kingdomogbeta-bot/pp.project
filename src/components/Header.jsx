import React, { useState, useRef, useEffect } from 'react'
import { Heart, ShoppingCart, LogOut, LogIn, Sun, Moon, Menu, X } from '../icons/LucideIcons'
import { orderManager } from '../utils/orderManager'

function UserNotificationsButton({ user, onNavigate }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    function load() {
      if (!user || !user.email) return setUnread(0)
      const list = orderManager.getUserNotifications(user.email)
      setUnread(list.filter(n => !n.read).length)
    }
    load()
    function onStorage(e) {
      if (e.key === 'notifications' || e.key === 'notifications_updated') load()
    }
    function onNotificationUpdate() {
      load()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('notification:updated', onNotificationUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('notification:updated', onNotificationUpdate)
    }
  }, [user])

  return (
    <button onClick={() => onNavigate && onNavigate('notifications')} title="Notifications" className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700 dark:text-gray-100"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .538-.214 1.055-.595 1.438L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
      {unread > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white">{unread}</span>}
    </button>
  )
}

export default function Header({ onNavigate, cartCount = 0, cartItems = [], onRemoveFromCart, user, onShowAuth, onRequireAuth, onLogout, wishlist = [], theme = 'light', onToggleTheme }) {
  const [openCart, setOpenCart] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const ref = useRef()
  const cartButtonRef = useRef()
  const [cartPos, setCartPos] = useState({ top: 0, right: 0 })
  
  // Check if user is admin
  const isAdmin = !!(user && (user.role === 'admin' || user.isAdmin))

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpenCart(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  const updateCartPosition = () => {
    if (cartButtonRef.current) {
      const rect = cartButtonRef.current.getBoundingClientRect()
      setCartPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }

  useEffect(() => {
    if (openCart) {
      updateCartPosition()
      window.addEventListener('scroll', updateCartPosition)
      window.addEventListener('resize', updateCartPosition)
      return () => {
        window.removeEventListener('scroll', updateCartPosition)
        window.removeEventListener('resize', updateCartPosition)
      }
    }
  }, [openCart])

  const subtotal = cartItems.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0)

  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 dark:bg-gray-900 border-b border-blue-200 dark:border-gray-700 w-full overflow-x-hidden shadow-sm relative z-40">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(m => !m)} aria-label="Open menu" className="md:hidden p-2 rounded-md hover:bg-blue-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate && onNavigate('home')}>
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">H</div>
              <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Horizon</span>
            </div>

            <nav aria-label="Primary" className="hidden md:flex items-center gap-6 ml-6">
              {!isAdmin ? (
                <>
                  <button onClick={() => onNavigate && onNavigate('home')} className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-indigo-600 after:transition-all after:duration-300">Home</button>
                  <button onClick={() => onNavigate && onNavigate('products')} className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-indigo-600 after:transition-all after:duration-300">Products</button>
                  <button onClick={() => onNavigate && onNavigate('orders')} className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-0.5 after:bg-gradient-to-r after:from-blue-600 after:to-indigo-600 after:transition-all after:duration-300">Orders</button>
                </>
              ) : (
                <button onClick={() => onNavigate && onNavigate('merchant')} className="text-sm font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition">Admin Dashboard</button>
              )}
            </nav>
          </div>

          <div className="hidden md:flex md:flex-1 md:justify-center">
            <div className="w-full max-w-2xl px-6 md:px-12">
              <label htmlFor="site-search" className="sr-only">Search products</label>
              <input id="site-search" type="search" placeholder="Search products, brands..." className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" onKeyDown={(e) => { if (e.key === 'Enter') { const q = e.currentTarget.value.trim(); if (q) onNavigate && onNavigate('products', { q }) } }} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => onToggleTheme && onToggleTheme()} className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-100" title="Toggle theme">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {user && !isAdmin && (
              <UserNotificationsButton user={user} onNavigate={onNavigate} />
            )}

            {!isAdmin && (
              <button onClick={() => onNavigate && onNavigate('wishlist')} className="relative p-2 rounded-full hover:bg-pink-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-100" title="Wishlist">
                <Heart className={`w-5 h-5 ${wishlist && wishlist.length > 0 ? 'text-red-600 fill-red-600' : 'text-gray-600 dark:text-gray-100'}`} />
              </button>
            )}

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => onNavigate && onNavigate('account')} title="Account settings" className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 dark:bg-gradient-to-br dark:from-purple-600 dark:to-blue-600 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                  {(() => {
                    const name = user.name || user.email || ''
                    const parts = String(name).split(' ').filter(Boolean)
                    if (parts.length === 0) return ''
                    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
                    return (parts[0][0] + parts[1][0]).toUpperCase()
                  })()}
                </button>
                <button onClick={() => { if (confirm('Sign out?')) { onLogout && onLogout() } }} title="Sign out" className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => onShowAuth && onShowAuth()} className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition text-sm font-semibold dark:from-blue-500 dark:to-indigo-500">
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </button>
            )}

            {!isAdmin && (
              <div className="relative" ref={ref}>
                <button ref={cartButtonRef} onClick={() => { setOpenCart(o => !o); setTimeout(updateCartPosition, 0) }} className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-300 transition px-2 py-1 rounded-md">
                  <span className="text-lg">🛒</span>
                  <span className="hidden sm:inline">Cart</span>
                  {cartCount > 0 && <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">{cartCount}</span>}
                </button>

                {openCart && (
                  <div className="fixed inset-0 z-40" onClick={() => setOpenCart(false)} />
                )}

                {openCart && (
                  <div className="fixed w-80 bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-4 z-50 border border-blue-200 dark:border-gray-700" style={{ top: `${cartPos.top}px`, right: `${cartPos.right}px` }}>
                    <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Shopping Cart</div>
                    {cartItems.length === 0 ? (
                      <div className="text-gray-500 dark:text-gray-300 text-sm py-4">Your cart is empty</div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {cartItems.map(it => (
                          <div key={it.id} className="flex gap-3 items-start border-b pb-3">
                            <img src={it.image} alt="" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/160?text=No+Image')} className="w-14 h-14 object-cover rounded" />
                            <div className="flex-1 text-left">
                              <div className="font-semibold text-sm text-gray-900 dark:text-white">{it.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-300">Qty: {it.qty}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm text-gray-900 dark:text-white">₦{(it.price * it.qty).toLocaleString('en-NG')}</div>
                              <button onClick={(e) => { e.stopPropagation(); onRemoveFromCart && onRemoveFromCart(it.id); setOpenCart(true); }} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 mt-1">Remove</button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white">Subtotal</div>
                          <div className="font-bold text-gray-900 dark:text-white">₦{subtotal.toLocaleString('en-NG')}</div>
                        </div>
                        <div className="flex gap-2 pt-3">
                          <button onClick={() => { setOpenCart(false); onNavigate && onNavigate('cart') }} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-gray-600 transition">View Cart</button>
                          <button onClick={() => { setOpenCart(false); onNavigate && onNavigate('checkout') }} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition">Checkout</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-700">
          <nav className="px-4 py-3 space-y-1">
            {!isAdmin ? (
              <>
                <button onClick={() => { setMobileOpen(false); onNavigate && onNavigate('home') }} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Home</button>
                <button onClick={() => { setMobileOpen(false); onNavigate && onNavigate('products') }} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Products</button>
                <button onClick={() => { setMobileOpen(false); onNavigate && onNavigate('orders') }} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Orders</button>
              </>
            ) : (
              <button onClick={() => { setMobileOpen(false); onNavigate && onNavigate('merchant') }} className="w-full text-left px-3 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 font-semibold text-blue-600 dark:text-blue-400">Admin Dashboard</button>
            )}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {user ? (
                <div className="px-3 py-2">
                  <div className="font-semibold">Signed in as</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{user.email || user.name}</div>
                  <button onClick={() => { onLogout && onLogout(); setMobileOpen(false) }} className="mt-2 w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Sign out</button>
                </div>
              ) : (
                <button onClick={() => { onShowAuth && onShowAuth(); setMobileOpen(false) }} className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">Sign in</button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
