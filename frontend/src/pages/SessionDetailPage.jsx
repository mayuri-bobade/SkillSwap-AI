import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getSession, acceptSession, rejectSession, cancelSession, completeSession } from '../api/sessions'
import { createReview } from '../api/reviews'
import Avatar from '../components/common/Avatar'
import SkillBadge from '../components/common/SkillBadge'
import Rating from '../components/common/Rating'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Modal from '../components/common/Modal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { FiCalendar, FiClock, FiDollarSign, FiUser, FiArrowLeft, FiVideo, FiCheck, FiX, FiStar } from 'react-icons/fi'

export default function SessionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getSession(id)
        setSession(res.data.session || res.data)
      } catch (err) {
        toast.error('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [id])

  const handleAction = async (action) => {
    try {
      if (action === 'accept') await acceptSession(id)
      else if (action === 'reject') await rejectSession(id)
      else if (action === 'cancel') await cancelSession(id)
      else if (action === 'complete') await completeSession(id)
      toast.success(`Session ${action}ed`)
      const res = await getSession(id)
      setSession(res.data.session || res.data)
    } catch (err) {
      toast.error(`Failed to ${action} session`)
    }
    setConfirmAction(null)
  }

  const handleReview = async () => {
    try {
      await createReview({ sessionId: parseInt(id), rating: reviewForm.rating, comment: reviewForm.comment })
      toast.success('Review submitted!')
      setShowReviewModal(false)
      setReviewForm({ rating: 5, comment: '' })
      const res = await getSession(id)
      setSession(res.data.session || res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit review'
      toast.error(msg)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!session) return <div className="text-center py-20 text-gray-500 dark:text-gray-400">Session not found</div>

  const teacherId = session.teacher?._id || session.teacher
  const studentId = session.student?._id || session.student
  const isTeacher = teacherId === user?._id
  const isStudent = studentId === user?._id
  const otherUser = isTeacher ? session.student : session.teacher

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    accepted: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
    completed: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  }

  const durationMinutes = (session.duration || 1) * 60

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <FiArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Session Details</h1>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[session.status]}`}>
            {session.status}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Avatar src={otherUser?.avatar} name={otherUser?.name} size="lg" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{otherUser?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{isTeacher ? 'Student' : 'Teacher'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Skill</p>
            <SkillBadge skill={session.skill?.name || session.skillName} color="primary" />
          </div>
          <div className="p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tokens</p>
            <p className="font-semibold text-secondary-600 flex items-center gap-1">
              <FiDollarSign className="w-4 h-4" /> {session.duration || 1}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><FiCalendar className="w-4 h-4" /> Date & Time</p>
            <p className="font-medium">{session.scheduledAt ? format(new Date(session.scheduledAt), 'MMM d, yyyy h:mm a') : 'Not scheduled'}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><FiClock className="w-4 h-4" /> Duration</p>
            <p className="font-medium">{durationMinutes} minutes</p>
          </div>
        </div>

        {session.notes && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</p>
            <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">{session.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {session.status === 'pending' && isTeacher && (
            <>
              <button onClick={() => setConfirmAction('accept')} className="btn-accent flex items-center gap-2">
                <FiCheck className="w-4 h-4" /> Accept
              </button>
              <button onClick={() => setConfirmAction('reject')} className="btn-ghost text-red-500 hover:text-red-600 flex items-center gap-2">
                <FiX className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {session.status === 'accepted' && (
            <button
              onClick={() => {
                const link = session.meetingLink || `https://meet.jit.si/skillswap-${session._id}`
                window.open(link, '_blank')
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <FiVideo className="w-4 h-4" /> Join Video Call
            </button>
          )}
          {session.status === 'accepted' && (
            <>
              <button onClick={() => setConfirmAction('complete')} className="btn-accent flex items-center gap-2">
                <FiCheck className="w-4 h-4" /> Mark Complete
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 w-full">
                {session.teacherConfirmed && !session.studentConfirmed && 'Waiting for student to confirm...'}
                {!session.teacherConfirmed && session.studentConfirmed && 'Waiting for teacher to confirm...'}
                {!session.teacherConfirmed && !session.studentConfirmed && 'Both parties must confirm before leaving a review.'}
              </p>
            </>
          )}
          {(session.status === 'pending' || session.status === 'accepted') && (
            <button onClick={() => setConfirmAction('cancel')} className="btn-ghost text-red-500">Cancel Session</button>
          )}
          {session.status === 'completed' && (
            <button onClick={() => setShowReviewModal(true)} className="btn-accent flex items-center gap-2">
              <FiStar className="w-4 h-4" /> Leave Review
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => handleAction(confirmAction)}
        title={`${confirmAction?.charAt(0).toUpperCase() + confirmAction?.slice(1)} Session`}
        message={`Are you sure you want to ${confirmAction} this session?`}
        confirmText={confirmAction?.charAt(0).toUpperCase() + confirmAction?.slice(1)}
        danger={confirmAction === 'cancel' || confirmAction === 'reject'}
      />

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Leave a Review">
        <div className="space-y-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                  className={`text-2xl ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comment</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowReviewModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="button" onClick={handleReview} className="btn-primary flex-1">Submit Review</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
