export default function Skeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`${width} ${height} bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
  )
}

export function SkeletonImage({ className = 'w-full h-56' }) {
  return (
    <div className={`${className} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
  )
}

export function SkeletonProductCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <SkeletonImage />
      <div className="p-6 space-y-3">
        <Skeleton width="w-1/2" height="h-3" />
        <Skeleton width="w-3/4" height="h-4" />
        <Skeleton width="w-full" height="h-3" />
        <Skeleton width="w-1/3" height="h-4" />
      </div>
    </div>
  )
}
