import React from 'react'
import { TrendingUp, TrendingDown } from '../icons/LucideIcons'

export default function KpiCard({ title, value, subtitle, icon, trend, trendUp }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
          <div className="text-xl font-bold mt-2 whitespace-nowrap">{value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </div>
        {icon && <div className="text-gray-400 dark:text-gray-600 flex-shrink-0">{icon}</div>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
          {trendUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  )
}
