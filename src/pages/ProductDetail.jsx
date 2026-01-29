import React, { useState, useMemo } from 'react'
import StarRating from '../components/StarRating'
import { Heart } from '../icons/LucideIcons'
import productsData from '../data/products'

export default function ProductDetail({ product, products = productsData, onAddToCart, wishlist = [], onToggleWishlist, onNavigate, onSetDeliveryLocation }) {
  const [qty, setQty] = useState(1)
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || null)
  const [selectedState, setSelectedState] = useState('Lagos')
  const [selectedPlace, setSelectedPlace] = useState('Lekki')
  const [isAdded, setIsAdded] = useState(false)

  if (!product) return <div className="p-8 text-gray-500 dark:text-gray-300">Product not found.</div>

  const inStock = product.stock > 0
  const LOW_STOCK_THRESHOLD = 5

  
  const nigerianLocations = {
    'Lagos': {
      places: ['Lekki', 'VI', 'Ikoyi', 'Surulere', 'Yaba', 'Ikeja', 'Bariga', 'Ajah', 'Festac', 'Badagry'],
      deliveryFee: 8680,
      minDays: 2,
      maxDays: 3,
      pickupStations: ['LEKKI-AJAH (SANGOTEDO)', 'VI (VICTORIA ISLAND)', 'IKOYI BRANCH', 'SURULERE CENTER', 'IKEJA MAIN']
    },
    'Abuja': {
      places: ['Central Business District', 'Wuse', 'Maitama', 'Garki', 'Nyanya', 'Kuje', 'Gwagwalada'],
      deliveryFee: 13175,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['ABUJA CBD', 'WUSE II', 'MAITAMA JUNCTION', 'GARKI CENTER']
    },
    'Abia': {
      places: ['Aba', 'Umuahia', 'Ohafia', 'Arochukwu'],
      deliveryFee: 11160,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['ABA CENTER', 'UMUAHIA MAIN']
    },
    'Adamawa': {
      places: ['Yola', 'Girei', 'Mayo-Belwa', 'Numan'],
      deliveryFee: 15190,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['YOLA CENTER', 'GIREI JUNCTION']
    },
    'Akwa Ibom': {
      places: ['Uyo', 'Eket', 'Ikot Ekpene', 'Oron'],
      deliveryFee: 12400,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['UYO CENTER', 'EKET MARKET']
    },
    'Anambra': {
      places: ['Onitsha', 'Awka', 'Nnewi', 'Ekwulobia'],
      deliveryFee: 10540,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['ONITSHA MAIN', 'AWKA CENTER', 'NNEWI JUNCTION']
    },
    'Bauchi': {
      places: ['Bauchi', 'Azare', 'Dass', 'Katagum'],
      deliveryFee: 16275,
      minDays: 4,
      maxDays: 7,
      pickupStations: ['BAUCHI CENTER', 'AZARE JUNCTION']
    },
    'Bayelsa': {
      places: ['Yenagoa', 'Brass', 'Ogbia', 'Sagbama'],
      deliveryFee: 14260,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['YENAGOA CENTER', 'BRASS JUNCTION']
    },
    'Benue': {
      places: ['Makurdi', 'Gboko', 'Otukpo', 'Katsina-Ala'],
      deliveryFee: 13640,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['MAKURDI CENTER', 'GBOKO MAIN']
    },
    'Borno': {
      places: ['Maiduguri', 'Biu', 'Damaturu'],
      deliveryFee: 17360,
      minDays: 5,
      maxDays: 7,
      pickupStations: ['MAIDUGURI CENTER', 'BIU JUNCTION']
    },
    'Cross River': {
      places: ['Calabar', 'Buea', 'Ogoja', 'Ikom'],
      deliveryFee: 13950,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['CALABAR CENTER', 'OGOJA JUNCTION']
    },
    'Delta': {
      places: ['Warri', 'Asaba', 'Sapele', 'Abraka'],
      deliveryFee: 12865,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['WARRI CENTER', 'ASABA MAIN']
    },
    'Ebonyi': {
      places: ['Abakaliki', 'Onueke', 'Ezzamgbo', 'Ishielu'],
      deliveryFee: 11625,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['ABAKALIKI CENTER', 'ONUEKE JUNCTION']
    },
    'Edo': {
      places: ['Benin City', 'Auchi', 'Ekpoma', 'Uromi'],
      deliveryFee: 12090,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['BENIN CITY CENTER', 'AUCHI MAIN']
    },
    'Ekiti': {
      places: ['Ado-Ekiti', 'Ikere', 'Ilawe', 'Ijero'],
      deliveryFee: 10850,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['ADO-EKITI CENTER', 'IKERE JUNCTION']
    },
    'Enugu': {
      places: ['Enugu', 'Nsukka', 'Agbani', 'Nkpor'],
      deliveryFee: 10695,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['ENUGU CENTER', 'NSUKKA MAIN']
    },
    'Gombe': {
      places: ['Gombe', 'Bajoga', 'Yamaltu', 'Dukku'],
      deliveryFee: 15810,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['GOMBE CENTER', 'BAJOGA JUNCTION']
    },
    'Imo': {
      places: ['Owerri', 'Orlu', 'Okigwe', 'Ngor-Okpala'],
      deliveryFee: 11315,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['OWERRI CENTER', 'ORLU MAIN']
    },
    'Jigawa': {
      places: ['Dutse', 'Hadejia', 'Kazaure', 'Kiyawa'],
      deliveryFee: 16740,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['DUTSE CENTER', 'HADEJIA JUNCTION']
    },
    'Kaduna': {
      places: ['Kaduna', 'Zaria', 'Kafanchan', 'Zonkwa'],
      deliveryFee: 13795,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['KADUNA CENTER', 'ZARIA MAIN']
    },
    'Kano': {
      places: ['Kano', 'Kano (Danmawi)', 'Bebeji', 'Gaya', 'Wudil'],
      deliveryFee: 15810,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['KANO CENTRAL', 'KANO DANMAWI', 'BEBEJI JUNCTION']
    },
    'Katsina': {
      places: ['Katsina', 'Kachere', 'Batsari', 'Daura'],
      deliveryFee: 16430,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['KATSINA CENTER', 'KACHERE JUNCTION']
    },
    'Kebbi': {
      places: ['Birnin Kebbi', 'Argungu', 'Jega', 'Yauri'],
      deliveryFee: 17050,
      minDays: 5,
      maxDays: 7,
      pickupStations: ['BIRNIN KEBBI CENTER', 'ARGUNGU MAIN']
    },
    'Kogi': {
      places: ['Lokoja', 'Okene', 'Ofu', 'Kabba'],
      deliveryFee: 11780,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['LOKOJA CENTER', 'OKENE JUNCTION']
    },
    'Kwara': {
      places: ['Ilorin', 'Offa', 'Omu-Aran', 'Lafiagi'],
      deliveryFee: 11470,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['ILORIN CENTER', 'OFFA MAIN']
    },
    'Nasarawa': {
      places: ['Lafia', 'Keffi', 'Nasarawa', 'Obi'],
      deliveryFee: 13325,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['LAFIA CENTER', 'KEFFI JUNCTION']
    },
    'Niger': {
      places: ['Minna', 'Bida', 'Suleja', 'Kontagora'],
      deliveryFee: 13020,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['MINNA CENTER', 'BIDA MAIN']
    },
    'Ogun': {
      places: ['Abeokuta', 'Ijebu-Ode', 'Sagamu', 'Ilaro'],
      deliveryFee: 9610,
      minDays: 2,
      maxDays: 3,
      pickupStations: ['ABEOKUTA CENTER', 'IJEBU-ODE MAIN']
    },
    'Ondo': {
      places: ['Akure', 'Ondo Town', 'Ose', 'Okitipupa'],
      deliveryFee: 11625,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['AKURE CENTER', 'ONDO TOWN MAIN']
    },
    'Osun': {
      places: ['Osogbo', 'Ilesha', 'Ife', 'Iwo'],
      deliveryFee: 10695,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['OSOGBO CENTER', 'ILESHA MAIN']
    },
    'Oyo': {
      places: ['Ibadan', 'Oyo', 'Ogbomoso', 'Saki'],
      deliveryFee: 10075,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['IBADAN CENTRAL', 'OYO MAIN', 'OGBOMOSO JUNCTION']
    },
    'Plateau': {
      places: ['Jos', 'Bukuru', 'Pankshin', 'Shendam'],
      deliveryFee: 14105,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['JOS CENTER', 'BUKURU JUNCTION']
    },
    'Rivers': {
      places: ['Port Harcourt', 'Obio-Akpor', 'Bonny', 'Eleme'],
      deliveryFee: 12090,
      minDays: 2,
      maxDays: 4,
      pickupStations: ['PORT HARCOURT MALL', 'OBIO-AKPOR CENTER']
    },
    'Sokoto': {
      places: ['Sokoto', 'Gusau', 'Talaka', 'Gudu'],
      deliveryFee: 17670,
      minDays: 5,
      maxDays: 7,
      pickupStations: ['SOKOTO CENTER', 'GUSAU JUNCTION']
    },
    'Taraba': {
      places: ['Jalingo', 'Wukari', 'Zing', 'Ibi'],
      deliveryFee: 15965,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['JALINGO CENTER', 'WUKARI MAIN']
    },
    'Yobe': {
      places: ['Damaturu', 'Potiskum', 'Nguru', 'Gashua'],
      deliveryFee: 16895,
      minDays: 4,
      maxDays: 6,
      pickupStations: ['DAMATURU CENTER', 'POTISKUM JUNCTION']
    },
    'Zamfara': {
      places: ['Gusau', 'Kaura-Namoda', 'Talaka', 'Maru'],
      deliveryFee: 17205,
      minDays: 5,
      maxDays: 7,
      pickupStations: ['GUSAU CENTER', 'KAURA-NAMODA MAIN']
    },
    'FCT': {
      places: ['Central Business District', 'Wuse', 'Maitama', 'Garki', 'Nyanya'],
      deliveryFee: 13175,
      minDays: 3,
      maxDays: 5,
      pickupStations: ['ABUJA CBD', 'WUSE II', 'MAITAMA JUNCTION']
    }
  }

  const currentLocation = nigerianLocations[selectedState]
  const currentPlaces = currentLocation?.places || []
  const currentPickupStation = currentLocation?.pickupStations?.[0] || 'Main Hub'

  // Estimate delivery based on location
  const estimateDelivery = useMemo(() => {
    try {
      const now = new Date()
      const processing = product.stock > 20 ? 1 : product.stock > 0 ? 2 : 5
      const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
      const minDate = addDays(now, processing + currentLocation.minDays)
      const maxDate = addDays(now, processing + currentLocation.maxDays)
      const fmt = d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      return `${fmt(minDate)} - ${fmt(maxDate)}`
    } catch (e) {
      return '3-7 business days'
    }
  }, [product, currentLocation])

  // Recommendations
  const alternatives = useMemo(() => {
    const same = (products || []).filter(p => p.id !== product.id && p.category === product.category)
    same.sort((a, b) => {
      const priceDiffA = Math.abs(a.price - product.price)
      const priceDiffB = Math.abs(b.price - product.price)
      return priceDiffA - priceDiffB || b.rating - a.rating
    })
    return same.slice(0, 4)
  }, [products, product])

  const complementary = useMemo(() => {
    const pool = (products || []).filter(p => p.id !== product.id && p.category !== product.category)
    const minPrice = product.price * 0.5
    const maxPrice = product.price * 1.5
    const filtered = pool.filter(p => p.price >= minPrice && p.price <= maxPrice)
    filtered.sort((a, b) => b.rating - a.rating)
    return filtered.slice(0, 4)
  }, [products, product])

  // Build a varied reviews list (3-7) using Nigerian names and mark verified purchases when orders include this product
  // Also include user-submitted reviews from localStorage
  const reviewsList = useMemo(() => {
    if (product.reviewsDetailed && product.reviewsDetailed.length) return product.reviewsDetailed

    let orders = {}
    try { orders = JSON.parse(localStorage.getItem('orders') || '{}') } catch (e) { orders = {} }
    const buyers = new Set()
    Object.values(orders).flat().forEach(o => {
      ;(o.items || []).forEach(it => {
        if (it.id === product.id) buyers.add(o.email || o.customer || 'guest')
      })
    })

    const names = [
      'Chinedu Okafor','Aisha Bello','Tunde Adeyemi','Ngozi Eze','Emeka Nwosu','Ifeoma Chukwu','Olufemi Balogun','Adeola Adebayo',
      'Chinwe Nwankwo','Kemi Osinowo','Ibrahim Musa','Fatima Abdullahi','Seyi Ogundele','Uchechi Nnamani','Bola Akinyemi','Nkechi Okoro',
      'Ikechukwu N.', 'Oluwaseun A.', 'Yemi O.', 'Kehinde F.'
    ]

    const reviewTexts = [
      'Excellent quality — exactly as described. Highly recommend!',
      'Good value for money; I use it daily.',
      'Solid build and reliable performance.',
      'Comfortable and well-made. Meets expectations.',
      'Decent product but shipping took longer than expected.',
      'Customer support helped with an issue quickly.',
      'Not satisfied with the packaging, otherwise OK.',
      'Works even better than advertised.'
    ]

    // Get user-submitted reviews
    let userReviews = []
    try {
      const allReviews = JSON.parse(localStorage.getItem('product_reviews') || '[]')
      userReviews = allReviews.filter(r => r.productId === product.id).map(r => ({
        name: r.userEmail.split('@')[0],
        rating: r.rating,
        text: r.text,
        date: new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        verified: true,
        isUserReview: true
      }))
    } catch (e) {
      userReviews = []
    }

    // deterministic seed based on product id so reviews are stable per product
    const seed = (product.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0)
    const pick = (arr, i) => arr[(seed + i * 13) % arr.length]
    const count = 3 + (seed % 5) // 3..7 reviews

    const baseRating = Math.max(3, Math.min(5, Math.round(product.rating || 4)))
    const reviews = Array.from({ length: count }).map((_, i) => {
      const name = pick(names, i)
      const text = pick(reviewTexts, i)
      const rating = Math.max(1, Math.min(5, baseRating + ((seed + i) % 3) - 1))
      const daysAgo = (i * 8 + (seed % 20))
      const d = new Date()
      d.setDate(d.getDate() - daysAgo)
      const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const verified = buyers.size > 0 && ((i === 0) || ((seed + i) % 3 === 0))
      return { name, rating, text, date, verified }
    })

    // Combine user reviews with generated reviews
    return [...userReviews, ...reviews]
  }, [product])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="px-8 py-12 grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
        
        {/* Product Image */}
        <div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl overflow-hidden aspect-square flex items-center justify-center shadow-lg">
            <img src={product.image} alt={product.title} onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/800x800?text=No+Image')} className="w-full h-full object-cover" />
          </div>
        </div>

        
        {/* Product Details */}
        <div>
          {/* Category and Stock Status */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-bold uppercase tracking-wide">{product.category}</p>
            {inStock ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">In Stock</span>
            ) : (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">Out of Stock</span>
            )}
          </div>

          {/* Title and Wishlist */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-grow">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">{product.title}</h1>
            </div>
            <button onClick={() => onToggleWishlist && onToggleWishlist(product)} className={`p-2.5 rounded-full border-2 flex-shrink-0 transition-all ${wishlist && wishlist.find(w => w.id === product.id) ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`} title="Add to wishlist">
              <Heart className="w-6 h-6" />
            </button>
          </div>
          
          {/* Brand and Badges */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <p className="text-gray-600 dark:text-gray-400 font-semibold">{product.brand}</p>
            <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-lg">⭐ Verified</span>
          </div>

          {/* Rating */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <StarRating rating={product.rating} count={product.reviews} size="lg" />
          </div>

          {/* Price Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-blue-600 dark:text-blue-400">₦{product.price.toLocaleString()}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-lg text-gray-500 line-through">₦{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-2">Save ₦{(product.originalPrice - product.price).toLocaleString()} ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%)</p>
            )}
          </div>

          {/* Location Selection and Delivery Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <label className="block font-bold text-gray-900 dark:text-white mb-3 text-sm">Choose your location</label>
            
            {/* State Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
              <select 
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value)
                  const newPlaces = nigerianLocations[e.target.value]?.places || []
                  setSelectedPlace(newPlaces[0] || '')
                }}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(nigerianLocations).sort().map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Place Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Preferred Delivery Place</label>
              <select 
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentPlaces.map(place => (
                  <option key={place} value={place}>{place}</option>
                ))}
              </select>
            </div>

            {/* Delivery & Returns Card */}
            <div className="space-y-3 border-t border-blue-200 dark:border-blue-800 pt-4">
              <div className="flex items-start gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="text-lg">📦</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Estimated Delivery</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{estimateDelivery}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 pb-3 border-b border-blue-200 dark:border-blue-800">
                <div className="text-lg">🚚</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Delivery Options</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div><strong>Door Delivery:</strong> ₦{currentLocation?.deliveryFee.toLocaleString('en-NG')}</div>
                    <div><strong>Pickup Station:</strong> {currentPickupStation}</div>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="text-lg">↩️</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Returns & Warranty</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">30-day returns | {product.specs?.Warranty || '1 year warranty'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-6">
              <label className="block font-bold text-gray-900 dark:text-white mb-3 text-sm">Color</label>
              <div className="flex gap-3 flex-wrap">
                {product.colors.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setSelectedColor(c)} 
                    className={`px-5 py-2.5 rounded-lg border-2 font-semibold transition-all ${
                      selectedColor === c 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-600 shadow-lg' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex gap-4 items-center mb-8">
            <div className="flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-bold text-lg">−</button>
              <span className="px-6 py-3 border-l border-r border-gray-300 dark:border-gray-600 font-bold text-lg text-gray-900 dark:text-white">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-bold text-lg">+</button>
            </div>
            <button 
              onClick={() => {
                if (!isAdded) {
                  // First click - add to cart
                  if (inStock && onAddToCart) {
                    onAddToCart(product, qty)
                    // Store the delivery location when adding to cart
                    if (onSetDeliveryLocation) {
                      onSetDeliveryLocation({ state: selectedState, place: selectedPlace, fee: currentLocation?.deliveryFee, pickupStation: currentPickupStation })
                    }
                    setIsAdded(true)
                  }
                } else {
                  // Second click - proceed to checkout
                  onNavigate && onNavigate('checkout')
                }
              }}
              disabled={!inStock && !isAdded}
              className={`flex-1 px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 shadow-lg ${
                isAdded
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-xl cursor-pointer'
                  : inStock 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl cursor-pointer' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {!inStock && !isAdded ? '❌ Out of Stock' : isAdded ? '✓ Proceed to Checkout' : '🛒 Add to Cart'}
            </button>
          </div>

          {/* Stock Info */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            {inStock ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">✓ In Stock - Ships Today</p>
                {product.stock <= LOW_STOCK_THRESHOLD && (
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">⚠️ Only {product.stock} items left — order soon!</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">Out of Stock</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12">
        {/* Description Section */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Description</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">{product.description || 'No description available for this product.'}</p>
        </div>

        {/* Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mb-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">{key}</p>
                  <p className="text-gray-900 dark:text-white font-medium mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12">
        {complementary && complementary.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customers Also Bought</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {complementary.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <img src={p.image} alt={p.title} className="w-full h-40 object-cover" onError={(e)=>e.currentTarget.src='https://via.placeholder.com/300x200?text=No+Image'} />
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">{p.title}</h4>
                    <p className="text-sm text-blue-600 font-bold mb-3">₦{p.price.toLocaleString()}</p>
                    <div className="flex gap-2 mb-2">
                      <StarRating rating={p.rating} count={p.reviews} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onAddToCart && onAddToCart(p, 1)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition">Add</button>
                      <button onClick={() => onNavigate && onNavigate(`product:${p.id}`)} className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm px-3 py-2 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {alternatives && alternatives.length > 0 && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Similar Items</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {alternatives.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <img src={p.image} alt={p.title} className="w-full h-40 object-cover" onError={(e)=>e.currentTarget.src='https://via.placeholder.com/300x200?text=No+Image'} />
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">{p.title}</h4>
                    <p className="text-sm text-blue-600 font-bold mb-3">₦{p.price.toLocaleString()}</p>
                    <div className="flex gap-2 mb-2">
                      <StarRating rating={p.rating} count={p.reviews} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onAddToCart && onAddToCart(p, 1)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition">Add</button>
                      <button onClick={() => onNavigate && onNavigate(`product:${p.id}`)} className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm px-3 py-2 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12 pb-12">
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customer Reviews ({product.reviews || reviewsList.length})</h3>
          <div className="space-y-4">
            {reviewsList.map((r, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div className="font-semibold text-gray-900 dark:text-white">{r.name}</div>
                      <StarRating rating={r.rating} size="sm" />
                      <div className="text-sm text-gray-500 dark:text-gray-400">{r.date}</div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{r.text}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex flex-col gap-2 items-end">
                    {r.verified && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">✓ Verified</span>
                    )}
                    {r.isUserReview && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">User</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
