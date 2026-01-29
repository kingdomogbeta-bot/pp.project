import React, { useState } from 'react'
import { validatePromoCode, calculateDiscount } from '../utils/promoCodes'
import PageTransition from '../components/PageTransition'

export default function ProductCart({ items = [], onRemove, onUpdateQty, onNavigate, onApplyPromo }) {
  const [promoCode, setPromoCode] = useState('')
  const [appliedCode, setAppliedCode] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState('')

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const discount = appliedCode ? calculateDiscount(subtotal, appliedCode.data) : 0
  const taxableAmount = subtotal - discount
  const tax = taxableAmount * 0.08
  const total = taxableAmount + tax

  function handleApplyPromo() {
    setPromoError('')
    setPromoSuccess('')
    
    const validation = validatePromoCode(promoCode, subtotal, appliedCode?.code)
    
    if (!validation.valid) {
      setPromoError(validation.error)
      return
    }

    setAppliedCode({ code: validation.code, data: validation.data })
    setPromoSuccess(`Promo code "${validation.code}" applied! You saved ₦${calculateDiscount(subtotal, validation.data).toLocaleString('en-NG')}`)
    setPromoCode('')
    
    // Pass promo code to parent
    if (onApplyPromo) {
      onApplyPromo({ code: validation.code, data: validation.data })
    }
  }

  function handleRemovePromo() {
    setAppliedCode(null)
    setPromoCode('')
    setPromoError('')
    setPromoSuccess('')
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-8 py-12 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 animate-fade-in">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-300 text-lg mb-6">Your cart is empty</p>
            <button 
              onClick={() => onNavigate && onNavigate('products')} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {items.map((it, idx) => (
                <div key={it.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 flex gap-6 items-start border border-gray-200 dark:border-gray-700 animate-slide-in-left mb-6" style={{animationDelay: `${idx * 0.05}s`}}>
                  <img src={it.image} alt={it.title} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/240?text=No+Image')} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{it.title}</h3>
                    <p className="text-gray-500 dark:text-gray-300 text-sm mb-3">{it.brand || 'Product'}</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">₦{it.price.toLocaleString('en-NG')}</p>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button onClick={() => onUpdateQty(it.id, Math.max(1, it.qty - 1))} className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">−</button>
                      <span className="px-4 py-1 border-l border-r border-gray-300 font-semibold">{it.qty}</span>
                      <button onClick={() => onUpdateQty(it.id, it.qty + 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
                    </div>
                    <div>
                      <p className="text-right text-gray-700 dark:text-gray-200 mb-2">₦{(it.price * it.qty).toLocaleString('en-NG')}</p>
                      <button onClick={() => onRemove(it.id)} className="text-red-600 text-sm hover:text-red-700 font-medium">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-fit animate-fade-in lg:col-span-1 lg:sticky lg:top-28 self-start" style={{animationDelay: '0.2s'}}>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-6">Order Summary</h3>
              
              {/* Promo Code Section */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Apply Promo Code</label>
                {appliedCode ? (
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                          <span className="text-xl">✓</span>
                          {appliedCode.code}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-200 mt-1">{appliedCode.data.description}</p>
                        <p className="text-sm font-bold text-green-800 dark:text-green-100 mt-2">
                          You save: ₦{discount.toLocaleString('en-NG')}
                        </p>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition whitespace-nowrap"
                      >
                        Remove Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-row gap-2">
                      <input
                        type="text"
                        placeholder="e.g., SAVE10, SAVE20, FLAT15"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                        className="flex-1 h-12 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="h-12 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap shadow-md hover:shadow-lg"
                      >
                        Apply
                      </button>
                    </div>
                    {promoError && (
                      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-200 font-semibold mt-0.5">!</span>
                        <p className="text-red-700 dark:text-red-200 text-sm">{promoError}</p>
                      </div>
                    )}
                    {promoSuccess && (
                      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-200 font-semibold mt-0.5">✓</span>
                        <p className="text-green-700 dark:text-green-200 text-sm">{promoSuccess}</p>
                      </div>
                    )}
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400 italic">Available codes: SAVE10, SAVE20, FLAT15, WELCOME, SUMMER30, FREESHIP</p> */}
                  </div>
                )}
              </div>

              <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString('en-NG')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                    <span>Discount ({appliedCode.code})</span>
                    <span>-₦{discount.toLocaleString('en-NG')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Tax (est.)</span>
                  <span>₦{tax.toLocaleString('en-NG')}</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white my-6">
                <span>Total</span>
                <span>₦{total.toLocaleString('en-NG')}</span>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('checkout')} 
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
              >
                Proceed to Checkout
              </button>
              <button 
                onClick={() => onNavigate && onNavigate('products')} 
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 py-3 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
