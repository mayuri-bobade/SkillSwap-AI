import { FiStar } from 'react-icons/fi'

export default function Rating({ value = 0, count, size = 'md', showValue = true }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' }
  const fullStars = Math.floor(value)

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          if (i <= fullStars) return <FiStar key={i} className={`${sizes[size]} text-yellow-400 fill-yellow-400`} />
          return <FiStar key={i} className={`${sizes[size]} text-gray-300 dark:text-gray-600`} />
        })}
      </div>
      {showValue && <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-gray-500">({count})</span>}
    </div>
  )
}
