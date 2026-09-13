import { useState } from 'react'
import Modal from '../common/Modal'
import { FiCalendar, FiClock, FiDollarSign } from 'react-icons/fi'

export default function CreateSessionModal({ isOpen, onClose, onSubmit, user }) {
  const [form, setForm] = useState({
    skillName: '',
    date: '',
    time: '',
    duration: 60,
    notes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const scheduledAt = form.date && form.time ? `${form.date}T${form.time}` : ''
    onSubmit({ ...form, scheduledAt, userId: user?._id })
    setForm({ skillName: '', date: '', time: '', duration: 60, notes: '' })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request a Session" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Skill you want to learn</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. JavaScript, Guitar, Spanish"
            value={form.skillName}
            onChange={(e) => setForm({ ...form, skillName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label"><FiCalendar className="inline w-4 h-4 mr-1" />Date & Time</label>
          <div className="flex gap-2">
            <input
              type="date"
              className="input flex-1"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <input
              type="time"
              className="input flex-1"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="label"><FiClock className="inline w-4 h-4 mr-1" />Duration (minutes)</label>
          <select
            className="input"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="What would you like to learn?"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 flex items-center gap-2">
          <FiDollarSign className="w-5 h-5 text-primary-500" />
          <span className="text-sm text-primary-700 dark:text-primary-300">
            Cost: {Math.ceil(form.duration / 60)} token(s)
          </span>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" className="btn-primary flex-1">Request Session</button>
        </div>
      </form>
    </Modal>
  )
}
