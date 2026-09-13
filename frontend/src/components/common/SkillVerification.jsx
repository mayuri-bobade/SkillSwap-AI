import { useState } from 'react'
import Modal from './Modal'
import LoadingSpinner from './LoadingSpinner'
import { generateQuestions, submitAnswers } from '../../api/verification'
import { FiShield, FiCheck, FiX, FiLoader, FiArrowRight, FiAward } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function SkillVerification({ isOpen, onClose, skill, onVerified }) {
  const [step, setStep] = useState('start') // start, questions, loading, result
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [verificationId, setVerificationId] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await generateQuestions({
        skill_name: skill.name,
        level: skill.level || 'beginner',
      })
      setQuestions(res.data.questions)
      setVerificationId(res.data.verification_id)
      setAnswers(new Array(res.data.questions.length).fill(''))
      setStep('questions')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async () => {
    if (answers.some((a) => !a.trim())) {
      toast.error('Please answer all questions')
      return
    }

    setLoading(true)
    try {
      const res = await submitAnswers({
        verification_id: verificationId,
        answers: answers,
      })
      setResult(res.data)
      setStep('result')
      if (res.data.status === 'verified') {
        onVerified?.()
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to evaluate answers')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('start')
    setQuestions([])
    setAnswers([])
    setVerificationId(null)
    setResult(null)
    onClose()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <FiCheck className="w-4 h-4" /> AI Verified
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium">
            <FiShield className="w-4 h-4" /> Partially Verified
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
            <FiX className="w-4 h-4" /> Not Verified
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
            <FiShield className="w-4 h-4" /> Not Verified
          </span>
        )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Skill Verification" size="lg">
      {step === 'start' && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
              <FiShield className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verify Your Skill: {skill.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Take a quick AI assessment to verify your <span className="font-medium capitalize">{skill.level}</span> level in {skill.name}.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How it works:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">1.</span>
                AI generates 3 questions for your skill level
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">2.</span>
                Answer each question to the best of your ability
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">3.</span>
                AI evaluates your answers and assigns a score
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-0.5">4.</span>
                Your skill gets a verification badge on your profile
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button onClick={handleStart} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <FiArrowRight className="w-4 h-4" />
                  Start Assessment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'questions' && (
        <div className="space-y-4">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex items-center gap-3">
            <FiShield className="w-5 h-5 text-primary-500" />
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Answer all 3 questions to complete the assessment
            </p>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question}</p>
                  <span className="text-xs text-gray-400 capitalize">{q.type}</span>
                </div>
              </div>
              <textarea
                value={answers[i]}
                onChange={(e) => handleAnswerChange(i, e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="input min-h-[80px] ml-8"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button onClick={handleClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Submit Answers
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center mb-4">
              <FiAward className="w-10 h-10 text-primary-500" />
            </div>
            {getStatusBadge(result.status)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-primary-500">{result.score}%</p>
              <p className="text-sm text-gray-500 mt-1">Score</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">{result.verified_level}</p>
              <p className="text-sm text-gray-500 mt-1">Verified Level</p>
            </div>
          </div>

          {result.feedback && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Feedback:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.feedback}</p>
            </div>
          )}

          {result.question_assessments && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Question Breakdown:</p>
              {result.question_assessments.map((qa, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {qa.correct ? (
                    <FiCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiX className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-gray-600 dark:text-gray-400">{qa.brief}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleClose} className="btn-primary w-full">
            Done
          </button>
        </div>
      )}
    </Modal>
  )
}
