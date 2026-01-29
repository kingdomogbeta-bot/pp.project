import { Star } from '../icons/LucideIcons'

export default function StarRating({ rating = 0, count = 0, size = 'sm' }) {
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const full = i < Math.floor(rating)
    const half = !full && i < rating
    const className = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
    const color = full ? 'text-yellow-400' : half ? 'text-yellow-300' : 'text-gray-300'
    return (
      <span key={i} className={className}>
        <Star className={color} />
      </span>
    )
  })

  return (
    <div className="flex items-center gap-2">
      <div className="flex">{stars}</div>
      {count > 0 && <span className="text-gray-600 dark:text-gray-400 text-sm">({count})</span>}
    </div>
  )
}
