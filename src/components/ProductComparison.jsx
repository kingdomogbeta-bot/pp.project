import React, { useEffect } from 'react'
import { X } from '../icons/LucideIcons'

export default function ProductComparison({ products = [], onClose }) {
  if (products.length === 0) return null

  // Get all unique specs from compared products
  const specs = ['brand', 'category', 'rating', 'price']
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev || '' }
  }, [])
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Products ({products.length})</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                  Specification
                </th>
                {products.map(product => (
                  <th key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center min-w-48">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{product.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">${product.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Product Images */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Image
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image')}
                      className="h-32 w-32 object-cover rounded mx-auto"
                    />
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Brand
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {product.brand || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Category */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Category
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {product.category || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Price
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${product.price}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Rating
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-yellow-400">★</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.rating || 'N/A'}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Description */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Description
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {product.description || 'No description available'}
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr>
                <td className="border border-gray-200 dark:border-gray-600 px-4 py-3 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 sticky left-0 z-10">
                  Availability
                </td>
                {products.map(product => (
                  <td key={product.id} className="border border-gray-200 dark:border-gray-600 px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock > 0
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {product.stock > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
