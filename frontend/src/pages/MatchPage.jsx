import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { findMatches } from '../api/matching'
import { createSession } from '../api/sessions'
import Avatar from '../components/common/Avatar'
import SkillBadge from '../components/common/SkillBadge'
import Rating from '../components/common/Rating'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import CreateSessionModal from '../components/sessions/CreateSessionModal'
import toast from 'react-hot-toast'
import { FiTarget, FiUser, FiCalendar, FiBookOpen, FiStar, FiArrowRight, FiCheck, FiZap, FiMessageCircle } from 'react-icons/fi'

export default function MatchPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedSkill, setSelectedSkill] = useState('')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await findMatches()
        setMatches(res.data.matches || res.data || [])
      } catch (err) {
        toast.error('Failed to find matches')
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [])

  const handleRequestSession = async (form) => {
    try {
      await createSession({
        userId: selectedUser._id,
        skillName: form.skillName || selectedSkill,
        scheduledAt: form.scheduledAt,
        duration: form.duration,
        notes: form.notes,
      })
      toast.success('Session request sent!')
      setShowSessionModal(false)
      setSelectedUser(null)
      setSelectedSkill('')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send request')
    }
  }

  const openSessionModal = (match) => {
    setSelectedUser(match.user)
    setSelectedSkill(match.learnSkills?.[0]?.name || '')
    setShowSessionModal(true)
  }

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-accent-500'
    if (score >= 70) return 'text-secondary-500'
    return 'text-yellow-500'
  }

  const getMatchBg = (score) => {
    if (score >= 90) return 'bg-gradient-to-br from-emerald-400 to-emerald-600'
    if (score >= 70) return 'bg-gradient-to-br from-primary-400 to-primary-600'
    return 'bg-gradient-to-br from-amber-400 to-amber-600'
  }

  const getMatchBadge = (matchType) => {
    switch (matchType) {
      case 'mutual': return { text: 'Mutual Match', color: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 border border-primary-100 dark:border-primary-800/30' }
      case 'one_way_learn': return { text: 'Can Teach You', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' }
      case 'one_way_teach': return { text: 'Wants to Learn', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30' }
      default: return null
    }
  }

  const getReasonIcon = (type) => {
    switch (type) {
      case 'learn': return <FiBookOpen className="w-4 h-4 text-primary-500" />
      case 'teach': return <FiStar className="w-4 h-4 text-accent-500" />
      case 'mutual': return <FiZap className="w-4 h-4 text-yellow-500" />
      case 'availability': return <FiCalendar className="w-4 h-4 text-secondary-500" />
      default: return <FiCheck className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiTarget className="w-6 h-6 text-primary-500" /> AI Skill Matching
        </h1>
        <p className="text-gray-500">Smart matches based on what you teach and want to learn</p>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={FiTarget}
          title="No matches found"
          description="Add skills to your profile to find perfect exchange partners."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matches.map((match, i) => {
            const matchUser = match.user || match
            const score = match.score || 0
            const badge = getMatchBadge(match.matchType)
            const isExpanded = expandedCard === matchUser._id

            return (
              <div key={matchUser._id || i} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-900/50 transition-all duration-300 overflow-hidden ${match.matchType === 'mutual' ? 'ring-1 ring-primary-200 dark:ring-primary-800/50' : ''}`}>
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <Avatar src={matchUser.avatar} name={matchUser.name} size="lg" />
                      {match.matchType === 'mutual' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                          <FiZap className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{matchUser.name}</p>
                        {badge && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      <Rating value={matchUser.rating || 0} count={matchUser.reviewCount || 0} size="sm" />
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`w-14 h-14 rounded-xl ${getMatchBg(score)} flex flex-col items-center justify-center shadow-sm`}>
                        <p className="text-lg font-bold text-white">{score}%</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">match</p>
                    </div>
                  </div>

                  {/* Exchange Preview */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-700/20 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-700/30">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">You teach</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {match.learnSkills?.slice(0, 2).map((s, i) => (
                            <SkillBadge key={i} skill={s.name || s} color="primary" />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <FiArrowRight className="w-5 h-5 text-primary-400 dark:text-primary-500 shrink-0" />
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">You learn</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {match.teachSkills?.slice(0, 2).map((s, i) => (
                            <SkillBadge key={i} skill={s.name || s} color="accent" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Why This Match - Expandable */}
                {match.reasons?.length > 0 && (
                  <div className="px-5 mb-3">
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : matchUser._id)}
                      className="w-full flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                      <span className="font-medium">Why this match?</span>
                      <FiArrowRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="mt-2 space-y-2 animate-slide-up">
                        {match.reasons.map((reason, ri) => (
                          <div key={ri} className="flex items-start gap-2 text-sm">
                            {getReasonIcon(reason.type)}
                            <span className="text-gray-700 dark:text-gray-300">{reason.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700/50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/profile/${matchUser._id}`)}
                      className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 transition-all duration-200 shadow-sm"
                    >
                      <FiUser className="w-4 h-4" /> Profile
                    </button>
                    <button
                      onClick={() => navigate(`/chat?userId=${matchUser._id}`)}
                      className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 transition-all duration-200 shadow-sm"
                    >
                      <FiMessageCircle className="w-4 h-4" /> Message
                    </button>
                    <button
                      onClick={() => openSessionModal(match)}
                      className="flex-1 text-sm py-2 flex items-center justify-center gap-1.5 px-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <FiCalendar className="w-4 h-4" /> Request
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showSessionModal && selectedUser && (
        <CreateSessionModal
          isOpen={showSessionModal}
          onClose={() => { setShowSessionModal(false); setSelectedUser(null); setSelectedSkill('') }}
          onSubmit={handleRequestSession}
          user={selectedUser}
        />
      )}
    </div>
  )
}
