import { motion } from 'framer-motion'

export default function StatsCard({ icon: Icon, title, value, change, color = 'primary', delay = 0 }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400',
    secondary: 'bg-secondary-50 text-secondary-500 dark:bg-secondary-900/30 dark:text-secondary-400',
    accent: 'bg-accent-50 text-accent-500 dark:bg-accent-900/30 dark:text-accent-400',
    yellow: 'bg-yellow-50 text-yellow-500 dark:bg-yellow-900/30 dark:text-yellow-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card flex items-start gap-4"
    >
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-accent-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
    </motion.div>
  )
}
