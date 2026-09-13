import { FiDollarSign } from 'react-icons/fi'

export default function TokenDisplay({ amount, size = 'md', showIcon = true }) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold text-primary-600 dark:text-primary-400 ${sizes[size]}`}>
      {showIcon && <FiDollarSign className="w-4 h-4" />}
      {amount}
    </span>
  )
}
