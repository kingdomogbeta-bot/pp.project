import React, { useState, useMemo } from 'react'
import StarRating from '../components/StarRating'
import { Heart } from '../icons/LucideIcons'
import ProductComparison from '../components/ProductComparison'
import PageTransition from '../components/PageTransition'

export default function ProductListing({ products = [], onAddToCart, onNavigate, wishlist = [], onToggleWishlist }) {
  const LOW_STOCK_THRESHOLD = 5
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('relevance')
  const [brand, setBrand] = useState('all')
  const [category, setCategory] = useState('all')
  const [compareProducts, setCompareProducts] = useState([])
  const [showComparison, setShowComparison] = useState(false)

  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand))), [products])
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products])

  let filtered = products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
  if (brand !== 'all') filtered = filtered.filter(p => p.brand === brand)
  if (category !== 'all') filtered = filtered.filter(p => p.category === category)

  if (sort === 'price-asc') filtered = filtered.slice().sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') filtered = filtered.slice().sort((a, b) => b.price - a.price)
  if (sort === 'rating') filtered = filtered.slice().sort((a, b) => b.rating - a.rating)

  function toggleCompare(product) {
    setCompareProducts(prev => {
      const exists = prev.find(p => p.id === product.id)
      if (exists) {
        return prev.filter(p => p.id !== product.id)
      }
      if (prev.length < 4) {
        return [...prev, product]
      }
      return prev
    })
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="px-8 py-8">
        <div className="flex items-center justify-between gap-6 mb-8 flex-wrap animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h2>
          <div className="flex gap-3 items-center flex-wrap">
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
              placeholder="Search products..." 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={brand} 
              onChange={e => setBrand(e.target.value)} 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Brands</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value)} 
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
            {compareProducts.length > 0 && (
              <button
                onClick={() => setShowComparison(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                Compare ({compareProducts.length})
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-300 text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((p, idx) => {
              const isInWishlist = wishlist && wishlist.find(w => w.id === p.id)
              const isInCompare = compareProducts.find(c => c.id === p.id)
              const hasDiscount = p.originalPrice && p.originalPrice > p.price
              const discountPercent = hasDiscount ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0
              const showDiscount = ['p1', 'p4', 'p8'].includes(p.id)
              return (
              <div key={p.id} onClick={() => onNavigate && onNavigate('product:' + p.id)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-400 transform hover:-translate-y-1 animate-scale-in flex flex-col cursor-pointer" style={{animationDelay: `${(idx % 8) * 0.05}s`}}>
                {/* Product Image Container */}
                <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square group">
                  <img 
                    src={p.image} 
                    alt={p.title}
                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x600?text=No+Image')}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                  
                  {/* Discount Badge */}
                  {showDiscount && hasDiscount && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-lg">
                        -{discountPercent}%
                      </div>
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button onClick={(e) => { e.stopPropagation(); onToggleWishlist && onToggleWishlist(p) }} className="absolute top-3 right-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 p-2 rounded-full shadow-lg hover:scale-110 transition-transform duration-200 z-10">
                    <Heart className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-300'}`} />
                  </button>
                  
                  {/* Stock Status Overlay */}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm">Out of Stock</span>
                    </div>
                  )}
                  
                  {/* Low Stock Badge */}
                  {p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-lg shadow">Only {p.stock} left</span>
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Title */}
                  <div 
                    className="font-semibold text-gray-900 dark:text-white mb-2 text-sm line-clamp-2 flex-grow"
                  >
                    {p.title}
                  </div>
                  
                  {/* Brand */}
                  <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">{p.brand}</div>
                  
                  {/* Rating */}
                  <div className="mb-3">
                    <StarRating rating={p.rating} count={p.reviews} />
                  </div>
                  
                  {/* Price Section */}
                  <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">₦{p.price.toLocaleString('en-NG')}</span>
                      {showDiscount && p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-sm text-gray-400 line-through">₦{p.originalPrice.toLocaleString('en-NG')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Add to Cart Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); p.stock > 0 && onAddToCart(p, 1) }}
                    disabled={p.stock === 0}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 mb-2 ${
                      p.stock > 0 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg cursor-pointer' 
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {p.stock > 0 ? '🛒 Add to cart' : 'N/A'}
                  </button>
                  
                  {/* Compare Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompare(p) }}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isInCompare
                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isInCompare ? '✓ Compare' : 'Compare'}
                  </button>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {showComparison && (
        <ProductComparison
          products={compareProducts}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
    </PageTransition>
  )
}
