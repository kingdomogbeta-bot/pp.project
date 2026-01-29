import React, { useState, useEffect } from 'react'
import { calculateDiscount } from '../utils/promoCodes'
import { getShippingRates } from '../utils/shipping'
import PageTransition from '../components/PageTransition'

export default function Checkout({ items = [], onPlaceOrder, onCancel, appliedPromoCode = null, user = null, onRequireAuth = null, selectedDeliveryLocation = null }) {
  const [email, setEmail] = useState(user?.email || '')
  const [address, setAddress] = useState(() => {
    const initialAddress = { name: user?.name || '', street: '', city: '', state: '', zip: '', country: '' }
    // Auto-fill from selectedDeliveryLocation if available
    if (selectedDeliveryLocation) {
      initialAddress.state = selectedDeliveryLocation.state || ''
      initialAddress.city = selectedDeliveryLocation.place || ''
      initialAddress.country = 'Nigeria'
    }
    return initialAddress
  })
  const [payment, setPayment] = useState('card')
  const [errors, setErrors] = useState({})
  const [deliveryMethod, setDeliveryMethod] = useState('door')

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = appliedPromoCode ? calculateDiscount(subtotal, appliedPromoCode.data) : 0
  const [shippingOptions, setShippingOptions] = useState([])
  const [shippingLoading, setShippingLoading] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [selectedShipping, setSelectedShipping] = useState(null)

  const taxableAmount = subtotal - discount
  const tax = taxableAmount * 0.08
  const shippingCost = selectedShipping ? selectedShipping.price : 0
  const total = taxableAmount + tax + shippingCost

  const validateEmail = (e) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }

  function handlePlace() {
    const newErrors = {}
    const isNigeria = address.country === 'Nigeria' || address.country === 'Nigeria'
    
    if (!email || !validateEmail(email)) {
      newErrors.email = 'Valid email required'
    }
    
    // Only validate address fields if using door delivery
    if (deliveryMethod === 'door') {
      if (!address.name) newErrors.name = 'Name required'
      if (!address.street) newErrors.street = 'Street required'
      if (!address.city) newErrors.city = 'City required'
      // Only require ZIP for non-Nigeria locations
      if (!isNigeria && !address.zip) newErrors.zip = 'ZIP required'
    }
    
    // Check if we have errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      console.warn('❌ Checkout validation failed:', newErrors)
      return
    }

    console.log('✅ Validation passed, proceeding with order')

    // If user is not signed in, ask them to sign in before placing order
    if (!user) {
      console.log('👤 User not signed in, requesting auth')
      if (onRequireAuth) {
        onRequireAuth('checkout', { email, address, payment, items, subtotal, tax, total, deliveryMethod })
        return
      }
    }

    console.log('🛒 Placing order with payment method:', payment, 'delivery:', deliveryMethod)
    // Call onPlaceOrder - it will handle orderManager creation in App.jsx
    onPlaceOrder && onPlaceOrder({ email, address, payment, items, subtotal, tax, total, shipping: selectedShipping, deliveryMethod, deliveryLocation: selectedDeliveryLocation })
  }

  useEffect(() => {
    // fetch shipping rates when address changes
    let mounted = true
    async function fetchRates() {
      setShippingError('')
      setShippingLoading(true)
      try {
        const res = await getShippingRates({ address, items })
        if (!mounted) return
        if (res.error) {
          setShippingError(res.error)
          setShippingOptions([])
          setSelectedShipping(null)
        } else {
          setShippingOptions(res.rates || [])
          // pick the cheapest when options change
          if ((res.rates || []).length > 0) setSelectedShipping(res.rates[0])
        }
      } catch (e) {
        if (!mounted) return
        setShippingError('Failed to load shipping rates')
        setShippingOptions([])
        setSelectedShipping(null)
      } finally {
        if (mounted) setShippingLoading(false)
      }
    }

    // only fetch if we have at least a ZIP
    if (address && address.zip) fetchRates()
    else {
      setShippingOptions([])
      setSelectedShipping(null)
    }

    return () => { mounted = false }
  }, [address.zip, items])

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-8 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 animate-fade-in">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-slide-in-left">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Contact Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <input 
                  type="email"
                  placeholder="your@email.com" 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({...errors, email: ''})
                  }} 
                  className={`w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Delivery Method Selection for Nigeria */}
            {address.country === 'Nigeria' && selectedDeliveryLocation && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Delivery Method</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 cursor-pointer p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition" style={{borderColor: deliveryMethod === 'door' ? '#3b82f6' : undefined}}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="door" 
                      checked={deliveryMethod === 'door'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <span className="text-gray-900 dark:text-white font-bold text-lg">
                      🚚 Door Delivery - ₦{selectedDeliveryLocation.fee.toLocaleString('en-NG', {minimumFractionDigits: 1})}
                    </span>
                  </label>
                  <label className="flex items-center gap-4 cursor-pointer p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition" style={{borderColor: deliveryMethod === 'pickup' ? '#3b82f6' : undefined}}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      value="pickup" 
                      checked={deliveryMethod === 'pickup'}
                      onChange={(e) => setDeliveryMethod(e.target.value)}
                      className="w-5 h-5 cursor-pointer"
                    />
                    <div className="text-gray-900 dark:text-white font-bold text-lg">
                      📍 Pickup Station<br/>
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">{selectedDeliveryLocation.pickupStation}</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Shipping Address - Only show for Door Delivery */}
            {deliveryMethod === 'door' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Shipping Address</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input 
                    type="text"
                    placeholder="John Doe" 
                    value={address.name} 
                    onChange={e => {
                      setAddress({...address, name: e.target.value})
                      if (errors.name) setErrors({...errors, name: ''})
                    }} 
                    className={`w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                  <input 
                    type="text"
                    placeholder="123 Main St" 
                    value={address.street} 
                    onChange={e => {
                      setAddress({...address, street: e.target.value})
                      if (errors.street) setErrors({...errors, street: ''})
                    }} 
                      className={`w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                      errors.street ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                  />
                  {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <input 
                      type="text"
                      placeholder="New York" 
                      value={address.city} 
                      onChange={e => {
                        setAddress({...address, city: e.target.value})
                        if (errors.city) setErrors({...errors, city: ''})
                      }} 
                      className={`w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        errors.city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                    />
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                    <input 
                      type="text"
                      placeholder="NY" 
                      value={address.state} 
                      onChange={e => setAddress({...address, state: e.target.value})} 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {address.country !== 'Nigeria' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP / Postal Code</label>
                      <input 
                        type="text"
                        placeholder="10001" 
                        value={address.zip} 
                        onChange={e => {
                          setAddress({...address, zip: e.target.value})
                          if (errors.zip) setErrors({...errors, zip: ''})
                        }} 
                        className={`w-full border rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
                          errors.zip ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        }`}
                      />
                      {errors.zip && <p className="text-red-500 text-sm mt-1">{errors.zip}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                      <input 
                        type="text"
                        placeholder="United States" 
                        value={address.country} 
                        onChange={e => setAddress({...address, country: e.target.value})} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Payment Method</h3>
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition" style={{borderColor: payment === 'card' ? '#2563eb' : '#d1d5db'}}>
                  <input type="radio" name="pay" checked={payment==='card'} onChange={() => setPayment('card')} className="w-4 h-4 cursor-pointer" />
                  <span className="font-medium text-gray-900 dark:text-white">Credit / Debit Card</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition" style={{borderColor: payment === 'paypal' ? '#2563eb' : '#d1d5db'}}>
                  <input type="radio" name="pay" checked={payment==='paypal'} onChange={() => setPayment('paypal')} className="w-4 h-4 cursor-pointer" />
                  <span className="font-medium text-gray-900 dark:text-white">PayPal</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition" style={{borderColor: payment === 'apple' ? '#2563eb' : '#d1d5db'}}>
                  <input type="radio" name="pay" checked={payment==='apple'} onChange={() => setPayment('apple')} className="w-4 h-4 cursor-pointer" />
                  <span className="font-medium text-gray-900 dark:text-white">Apple Pay</span>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition" style={{borderColor: payment === 'cod' ? '#2563eb' : '#d1d5db'}}>
                  <input type="radio" name="pay" checked={payment==='cod'} onChange={() => setPayment('cod')} className="w-4 h-4 cursor-pointer" />
                  <span className="font-medium text-gray-900 dark:text-white">Pay on Delivery</span>
                </label>
              </div>

              {payment === 'card' && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 text-sm">Card Details (Demo Mode)</h4>
                  <div className="space-y-3">
                    <input type="text" placeholder="4111 1111 1111 1111" className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 cursor-not-allowed" readOnly />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="MM/YY" className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 cursor-not-allowed" readOnly />
                      <input type="text" placeholder="CVC" className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 cursor-not-allowed" readOnly />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-3">Demo mode: All card data is simulated.</p>
                </div>
              )}
            </div>
          </div>

          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-fit sticky top-8">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Order Summary</h3>
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 max-h-64 overflow-y-auto">
              {items.map(it => (
                <div key={it.id} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{it.title}</div>
                    <div className="text-gray-500 dark:text-gray-300 text-xs">Qty: {it.qty}</div>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">₦{(it.price * it.qty).toLocaleString('en-NG')}</div>
                </div>
              ))}
            </div>

              <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString('en-NG')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-medium text-sm">
                  <span>Discount ({appliedPromoCode.code})</span>
                  <span>-₦{discount.toLocaleString('en-NG')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600 dark:text-gray-300 text-sm">
                <span>Tax (8%)</span>
                <span>₦{tax.toLocaleString('en-NG')}</span>
              </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping Method</label>
                  {shippingLoading ? (
                    <div className="text-sm text-gray-600">Loading shipping options...</div>
                  ) : shippingError ? (
                    <div className="text-sm text-red-600">{shippingError}</div>
                  ) : shippingOptions.length === 0 ? (
                    <div className="text-sm text-gray-600">Enter ZIP to see shipping options</div>
                  ) : (
                    <div className="space-y-2">
                      {shippingOptions.map(opt => (
                        <label key={opt.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${selectedShipping?.id === opt.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-700'}`}>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">{opt.carrierName} — {opt.serviceName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-300">{opt.eta}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="font-semibold text-gray-900 dark:text-white">₦{opt.price.toLocaleString('en-NG')}</div>
                            <input type="radio" name="shipping" checked={selectedShipping?.id === opt.id} onChange={() => setSelectedShipping(opt)} />
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white mb-6">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400">₦{total.toLocaleString('en-NG')}</span>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 border border-gray-300 text-gray-900 dark:text-gray-200 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handlePlace}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
