import React, { useState, useEffect } from 'react'
import StarRating from '../components/StarRating'
import PageTransition from '../components/PageTransition'

export default function Home({ onNavigate, featured = [] }) {
  const slides = [
     'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c21hcnR3YXRjaHxlbnwwfHwwfHx8MA%3D%3D',
     'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c2hvZXN8ZW58MHx8MHx8fDA%3D',
     'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D'
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        
        <section className="relative mx-8 mt-8 rounded-xl overflow-hidden animate-fade-in" style={{height: '520px'}}>
        <div className="absolute inset-0">
          {slides.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`slide-${i}`}
                loading="eager"
                onError={(e)=>{ e.currentTarget.style.objectFit = 'cover' }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
              />
          ))}
          <div className="absolute inset-0 bg-black/30 dark:bg-black/40" />
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-8 animate-slide-in-left">
            <div className="max-w-3xl text-white">
              <h2 className="text-5xl font-bold mb-4 drop-shadow-lg">Big Summer Sale!</h2>
              <p className="text-lg mb-6 drop-shadow">Discover amazing products at incredible prices. Up to 50% off selected items. Limited time only.</p>
              <div className="flex gap-4">
                <button onClick={() => onNavigate('products')} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">Shop Now</button>
                <button onClick={() => onNavigate('products')} className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">View Deals</button>
              </div>
            </div>
          </div>
        </div>

        
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} className={`w-3 h-3 rounded-full ${i===index ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      </section>

      
      <section className="px-8 py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 dark:bg-gray-900 animate-fade-in" style={{animationDelay: '0.2s'}}>
        <div className="mb-12">
          <h3 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-2">Featured Products</h3>
          <p className="text-gray-600 dark:text-gray-300">Handpicked items just for you</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((p, idx) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer group animate-scale-in" style={{animationDelay: `${idx * 0.1}s`}}>
              <div className="relative h-56 overflow-hidden bg-gray-100">
                <img 
                  src={p.image} 
                  alt={p.title} 
                  onClick={() => onNavigate('product:' + p.id)} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                />
                {p.stock > 0 && p.stock < 10 && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">Limited stock</div>
                )}
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-300 font-medium mb-2">{p.category}</p>
                <h4 
                  onClick={() => onNavigate('product:' + p.id)}
                  className="font-bold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition"
                >
                  {p.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{p.brand}</p>
                <div className="mb-4">
                  <StarRating rating={p.rating} count={p.reviews} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">₦{p.price.toLocaleString('en-NG')}</span>
                  </div>
                  <button 
                    onClick={() => onNavigate('product:' + p.id)} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-semibold"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      
      <section className="px-8 py-20 bg-white dark:bg-gray-900 animate-fade-in" style={{animationDelay: '0.4s'}}>
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Why Shop With Us?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center animate-slide-in-up">
            <div className="text-4xl mb-4">🚚</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Free Shipping</h4>
            <p className="text-gray-600 dark:text-gray-300">On orders over $50. Fast delivery to your doorstep.</p>
          </div>
          <div className="text-center animate-slide-in-up" style={{animationDelay: '0.1s'}}>
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Secure Payment</h4>
            <p className="text-gray-600 dark:text-gray-300">Your payment information is 100% safe and encrypted.</p>
          </div>
          <div className="text-center animate-slide-in-up" style={{animationDelay: '0.2s'}}>
            <div className="text-4xl mb-4">↩️</div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Easy Returns</h4>
            <p className="text-gray-600 dark:text-gray-300">30-day money-back guarantee on all products.</p>
          </div>
        </div>
      </section>

      
      <section className="px-8 py-16 bg-blue-600 dark:bg-blue-700 text-white rounded-xl mx-8 mb-8 animate-slide-in-up" style={{animationDelay: '0.5s'}}>
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">Ready to Find Your Next Favorite?</h3>
          <p className="text-blue-100 mb-6">Explore our complete collection of premium products.</p>
          <button 
            onClick={() => onNavigate('products')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow-lg"
          >
            Browse All Products
          </button>
        </div>
      </section>
    </div>
    </PageTransition>
  )
}
