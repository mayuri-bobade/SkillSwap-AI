import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers } from '../api/users'
import { createSession } from '../api/sessions'
import Avatar from '../components/common/Avatar'
import SkillBadge from '../components/common/SkillBadge'
import Rating from '../components/common/Rating'
import EmptyState from '../components/common/EmptyState'
import CreateSessionModal from '../components/sessions/CreateSessionModal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { FiSearch, FiFilter, FiX, FiClock, FiTrash2 } from 'react-icons/fi'

const HISTORY_KEY = 'skillswap_search_history'

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [] } catch { return [] }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ category: '', level: '' })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [history, setHistory] = useState(getHistory)
  const [showHistory, setShowHistory] = useState(false)

  const addToHistory = (term) => {
    if (!term.trim()) return
    const updated = [term, ...history.filter(h => h !== term)].slice(0, 10)
    setHistory(updated)
    saveHistory(updated)
  }

  const removeFromHistory = (term) => {
    const updated = history.filter(h => h !== term)
    setHistory(updated)
    saveHistory(updated)
  }

  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const handleSearch = async () => {
    if (query.trim()) addToHistory(query.trim())
    setLoading(true)
    try {
      const res = await searchUsers({ skill: query, ...filters })
      setUsers(res.data.users || res.data || [])
    } catch (err) {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { if (query.length >= 2) handleSearch() }, 500)
    return () => clearTimeout(timer)
  }, [query, filters])

  const handleRequestSession = async (form) => {
    try {
      await createSession(form)
      toast.success('Session request sent!')
      setShowSessionModal(false)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Skills</h1>
        <p className="text-gray-500 dark:text-gray-400">Find people to learn from or teach</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Search by skill name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          />
          {showHistory && history.length > 0 && !query && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-500">Recent Searches</span>
                <button onMouseDown={(e) => { e.preventDefault(); clearHistory() }} className="text-xs text-red-500 hover:text-red-600">Clear all</button>
              </div>
              {history.map((term, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group">
                  <FiClock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span
                    className="flex-1 text-sm text-gray-700 dark:text-gray-300"
                    onMouseDown={() => { setQuery(term); setShowHistory(false) }}
                  >{term}</span>
                  <button
                    onMouseDown={(e) => { e.stopPropagation(); removeFromHistory(term) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
            showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300'
          }`}
        >
          <FiFilter className="w-4 h-4" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="card flex flex-wrap gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All Categories</option>
              <option value="technology">Technology</option>
              <option value="music">Music</option>
              <option value="language">Language</option>
              <option value="fitness">Fitness</option>
              <option value="cooking">Cooking</option>
              <option value="art">Art & Design</option>
              <option value="business">Business</option>
            </select>
          </div>
          <div>
            <label className="label">Experience Level</label>
            <select className="input" value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
              <option value="">Any Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <button onClick={() => setFilters({ category: '', level: '' })} className="btn-ghost self-end">
            <FiX className="w-4 h-4 mr-1" /> Clear
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="No results found"
          description={query ? 'Try a different search term or adjust your filters.' : 'Start typing to search for skills and users.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <Avatar src={u.avatar} name={u.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                  <Rating value={u.rating || 0} count={u.reviewCount || 0} size="sm" />
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teaches:</p>
                <div className="flex flex-wrap gap-1">
                  {(u.skillsTeach || []).slice(0, 3).map((s, i) => (
                    <SkillBadge key={i} skill={s} color="primary" />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/profile/${u._id}`)} className="btn-ghost flex-1 text-sm py-1.5">Profile</button>
                <button onClick={() => { setSelectedUser(u); setShowSessionModal(true) }} className="btn-primary flex-1 text-sm py-1.5">Request Session</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSessionModal && selectedUser && (
        <CreateSessionModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onSubmit={handleRequestSession}
          skills={selectedUser.skillsTeach || []}
          user={selectedUser}
        />
      )}
    </div>
  )
}
