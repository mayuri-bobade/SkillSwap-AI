import { FiX, FiShield } from 'react-icons/fi'

const colorMap = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
}

export default function SkillBadge({ skill, color = 'default', removable, onRemove, onClick, verified }) {
  const name = typeof skill === 'string' ? skill : skill?.name || skill?.skillName || ''
  const level = typeof skill === 'object' ? skill?.level : null

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${colorMap[color] || colorMap.default} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {name}
      {level && <span className="text-xs opacity-70">({level})</span>}
      {verified && (
        <FiShield className="w-3.5 h-3.5 text-green-500" title="AI Verified" />
      )}
      {removable && (
        <button onClick={(e) => { e.stopPropagation(); onRemove?.() }} className="ml-0.5 hover:opacity-70">
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  )
}
