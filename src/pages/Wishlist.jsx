import React from 'react'
import StarRating from '../components/StarRating'

export default function Wishlist({ items = [], onNavigate, onAddToCart, onRemove }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-8 py-12 max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">{items.length} item{items.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button 
            onClick={() => onNavigate('products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Continue Shopping
          </button>
        </div>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-5xl mb-4">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Favorites Yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Start adding your favorite products to your wishlist!</p>
            <button 
              onClick={() => onNavigate('products')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Browse Products
            </button>
          </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
                <div className="relative">
                    <img 
                    onClick={() => onNavigate('product:' + p.id)} 
                    src={p.image} 
                    alt={p.title}
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/240?text=No+Image')}
                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition" 
                  />
                  <button 
                    onClick={() => onRemove(p.id)}
                    className="absolute top-3 right-3 bg-white dark:bg-gray-700 rounded-full p-2 hover:bg-red-50 transition shadow-lg text-gray-700 dark:text-gray-200"
                    title="Remove from wishlist"
                  >
                    <span className="text-red-600 text-xl">❤️</span>
                  </button>
                  {p.originalPrice && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                      -20%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div 
                    onClick={() => onNavigate('product:' + p.id)}
                    className="font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 transition text-sm line-clamp-2"
                  >
                    {p.title}
                  </div>
                  <div className="text-gray-500 dark:text-gray-300 text-xs mb-2">{p.brand}</div>
                  <div className="mb-3">
                    <StarRating rating={p.rating} count={p.reviews} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {p.originalPrice ? (
                      <>
                        <span className="text-sm text-gray-500 dark:text-gray-300 line-through">₦{p.originalPrice.toLocaleString('en-NG')}</span>
                        <span className="text-lg font-bold text-green-600">₦{p.price.toLocaleString('en-NG')}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">₦{p.price.toLocaleString('en-NG')}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onAddToCart(p, 1)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => onNavigate('product:' + p.id)}
                      className="flex-1 border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
