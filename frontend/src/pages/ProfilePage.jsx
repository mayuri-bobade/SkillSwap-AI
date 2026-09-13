import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, updateProfile } from '../api/users'
import { addSkill, removeSkill, getMySkills } from '../api/skills'
import { getReviewsForUser, deleteReview } from '../api/reviews'
import { getUserVerifications } from '../api/verification'
import Avatar from '../components/common/Avatar'
import SkillBadge from '../components/common/SkillBadge'
import Rating from '../components/common/Rating'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import SkillVerification from '../components/common/SkillVerification'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiMapPin, FiCalendar, FiAward, FiTrash2, FiShield } from 'react-icons/fi'

export default function ProfilePage() {
  const { id } = useParams()
  const { user: currentUser, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [skillType, setSkillType] = useState('teach')
  const [skillForm, setSkillForm] = useState({ name: '', level: 'beginner', category: '' })
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' })
  const [verifications, setVerifications] = useState([])
  const [verifySkill, setVerifySkill] = useState(null)

  const isOwn = !id || id === currentUser?._id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const targetId = id || currentUser?._id
        if (!targetId) return
        const [profileRes, reviewsRes] = await Promise.all([
          getProfile(targetId),
          getReviewsForUser(targetId).catch(() => ({ data: { reviews: [] } })),
        ])
        setProfile(profileRes.data.user || profileRes.data)
        setReviews(reviewsRes.data.reviews || reviewsRes.data || [])

        const verificationsRes = await getUserVerifications(targetId).catch(() => ({ data: [] }))
        setVerifications(verificationsRes.data || [])
      } catch (err) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id, currentUser])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await updateProfile(editForm)
      setProfile({ ...profile, ...editForm })
      setEditing(false)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Failed to update profile')
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    try {
      await addSkill({ ...skillForm, type: skillType })
      const res = await getProfile(profile._id)
      setProfile(res.data.user || res.data)
      setShowAddSkill(false)
      setSkillForm({ name: '', level: 'beginner', category: '' })
      toast.success('Skill added')
    } catch (err) {
      toast.error('Failed to add skill')
    }
  }

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeSkill(skillId)
      const res = await getProfile(profile._id)
      setProfile(res.data.user || res.data)
      toast.success('Skill removed')
    } catch (err) {
      toast.error('Failed to remove skill')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(reviewId)
      setReviews(reviews.filter(r => r._id !== reviewId))
      toast.success('Review deleted')
    } catch (err) {
      toast.error('Failed to delete review')
    }
  }

  const getVerificationForSkill = (skillName) => {
    return verifications.find(
      (v) => v.skill_name.toLowerCase() === skillName.toLowerCase() && v.status === 'verified'
    )
  }

  const handleVerified = async () => {
    const targetId = id || currentUser?._id
    const verificationsRes = await getUserVerifications(targetId).catch(() => ({ data: [] }))
    setVerifications(verificationsRes.data || [])
    const profileRes = await getProfile(targetId)
    setProfile(profileRes.data.user || profileRes.data)
    setVerifySkill(null)
  }

  if (loading) return <LoadingSpinner />
  if (!profile) return <div className="text-center py-20 text-gray-500 dark:text-gray-400">User not found</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <Avatar src={profile.avatar} name={profile.name} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
            {profile.bio && <p className="text-gray-600 dark:text-gray-300 mt-2">{profile.bio}</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
              {profile.location && <span className="flex items-center gap-1"><FiMapPin className="w-4 h-4" />{profile.location}</span>}
              <span className="flex items-center gap-1"><FiCalendar className="w-4 h-4" />Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              <Rating value={profile.rating || 0} count={profile.reviewCount || 0} />
            </div>
          </div>
          {isOwn && (
            <button onClick={() => { setEditForm({ name: profile.name, bio: profile.bio || '', location: profile.location || '' }); setEditing(true) }} className="btn-outline flex items-center gap-2">
              <FiEdit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiAward className="w-5 h-5 text-accent-500" /> Skills I Teach
            </h2>
            {isOwn && <button onClick={() => { setSkillType('teach'); setShowAddSkill(true) }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><FiPlus className="w-5 h-5 text-gray-500" /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.skillsTeach || []).length === 0 && <p className="text-gray-400 text-sm">No skills added yet</p>}
            {(profile.skillsTeach || []).map((s) => {
              const verification = getVerificationForSkill(s.name)
              return (
                <div key={s._id || s.skill?._id} className="flex items-center gap-1">
                  <SkillBadge skill={s} color="primary" removable={isOwn} onRemove={() => handleRemoveSkill(s._id || s.skill?._id)} />
                  {verification ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs" title={`AI Verified - Score: ${verification.score}%`}>
                      <FiShield className="w-3 h-3" />
                    </span>
                  ) : isOwn ? (
                    <button
                      onClick={() => setVerifySkill(s)}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded text-xs transition-colors"
                      title="Verify this skill"
                    >
                      <FiShield className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiAward className="w-5 h-5 text-secondary-500" /> Skills I Want to Learn
            </h2>
            {isOwn && <button onClick={() => { setSkillType('learn'); setShowAddSkill(true) }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><FiPlus className="w-5 h-5 text-gray-500" /></button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {(profile.skillsLearn || []).length === 0 && <p className="text-gray-400 text-sm">No skills added yet</p>}
            {(profile.skillsLearn || []).map((s) => (
              <SkillBadge key={s._id || s.skill?._id} skill={s} color="secondary" removable={isOwn} onRemove={() => handleRemoveSkill(s._id || s.skill?._id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={r.reviewer?.avatar} name={r.reviewer?.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{r.reviewer?.name}</p>
                    <Rating value={r.rating} showValue={false} size="sm" />
                  </div>
                  {r.reviewer?._id === currentUser?._id || r.reviewer === currentUser?._id ? (
                    <button onClick={() => handleDeleteReview(r._id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[80px]" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Add Skill Modal */}
      <Modal isOpen={showAddSkill} onClose={() => setShowAddSkill(false)} title={`Add Skill to ${skillType === 'teach' ? 'Teach' : 'Learn'}`}>
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <label className="label">Skill Name</label>
            <input className="input" placeholder="e.g. JavaScript, Guitar, Spanish" value={skillForm.name} onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={skillForm.level} onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <input className="input" placeholder="e.g. Technology, Music, Language" value={skillForm.category} onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddSkill(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Add Skill</button>
          </div>
        </form>
      </Modal>

      {/* Skill Verification Modal */}
      {verifySkill && (
        <SkillVerification
          isOpen={!!verifySkill}
          onClose={() => setVerifySkill(null)}
          skill={verifySkill}
          onVerified={handleVerified}
        />
      )}
    </div>
  )
}
