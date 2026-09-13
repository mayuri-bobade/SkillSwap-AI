export default function Avatar({ src, name, size = 'md', online, className = '' }) {
  const sizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-20 h-20' }
  const textSize = { xs: 'text-xs', sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-2xl' }
  const initials = name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full gradient-primary flex items-center justify-center`}>
          <span className={`${textSize[size]} font-semibold text-white`}>{initials}</span>
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          online ? 'bg-accent-500' : 'bg-gray-400'
        }`} />
      )}
    </div>
  )
}
