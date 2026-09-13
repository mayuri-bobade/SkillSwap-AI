import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateLearningPath, recommendTeachers } from '../api/learningPaths'
import { createSession } from '../api/sessions'
import Avatar from '../components/common/Avatar'
import Rating from '../components/common/Rating'
import CreateSessionModal from '../components/sessions/CreateSessionModal'
import { FiSend, FiLoader, FiBook, FiZap, FiCode, FiDatabase, FiCpu, FiTarget, FiSearch, FiUser, FiAlertCircle, FiUsers, FiExternalLink, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

const suggestions = [
  { icon: FiCode, text: 'Learn React from beginner to advanced' },
  { icon: FiBook, text: 'Create a 30-day Python learning plan' },
  { icon: FiTarget, text: 'How to prepare for Data Analyst interview?' },
  { icon: FiZap, text: 'Suggest a MERN Stack learning path' },
  { icon: FiDatabase, text: 'SQL interview preparation roadmap' },
  { icon: FiCpu, text: 'Machine Learning roadmap from basics' },
  { icon: FiSearch, text: 'I have 2 months for placement prep. What should I learn?' },
]

function formatInline(line) {
  return line
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-primary-600 dark:text-primary-400">$1</code>')
}

function formatResponse(text) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let listItems = []
  let inList = false
  let listType = 'ul'

  const flushList = () => {
    if (listItems.length > 0) {
      const Tag = listType === 'ol' ? 'ol' : 'ul'
      const listClass = listType === 'ol'
        ? 'list-decimal list-inside space-y-1 my-2 text-gray-700 dark:text-gray-300'
        : 'list-disc list-inside space-y-1 my-2 text-gray-700 dark:text-gray-300'
      elements.push(
        <Tag key={`list-${elements.length}`} className={listClass}>
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </Tag>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    if (trimmed === '') {
      flushList()
      return
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-900 dark:text-white mt-5 mb-2">
          {trimmed.replace('### ', '')}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={i} className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">
          {trimmed.replace('## ', '')}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={i} className="text-xl font-bold text-gray-900 dark:text-white mt-6 mb-2">
          {trimmed.replace('# ', '')}
        </h1>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true
      listType = 'ul'
      listItems.push(trimmed.slice(2))
    } else if (/^\d+\.\s/.test(trimmed)) {
      inList = true
      listType = 'ol'
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    } else if (trimmed.startsWith('```')) {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={i} className="text-sm text-gray-700 dark:text-gray-300 my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      )
    }
  })

  flushList()
  return elements
}

function getRelevanceColor(relevance) {
  switch (relevance) {
    case 'high': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
}

export default function LearningPathPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [teachersLoading, setTeachersLoading] = useState(null)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (text) => {
    const question = (text || input).trim()
    if (!question || loading) return

    const userMessage = { role: 'user', content: question }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await generateLearningPath({ question })
      const answer = res.data.answer || res.data.data?.answer || ''
      setMessages((prev) => [...prev, { role: 'assistant', content: answer, teachers: null }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'error', content: error.response?.data?.detail || 'Sorry, I could not generate a response. Please try again.' },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleFindTeachers = async (msgIndex) => {
    const msg = messages[msgIndex]
    if (!msg || msg.teachers) return

    setTeachersLoading(msgIndex)
    try {
      const res = await recommendTeachers({ learning_path: msg.content })
      const data = res.data.data || res.data
      setMessages((prev) => {
        const updated = [...prev]
        updated[msgIndex] = {
          ...updated[msgIndex],
          teachers: data.teachers || [],
          skills_extracted: data.skills_extracted || [],
        }
        return updated
      })
    } catch (error) {
      toast.error('Failed to find teachers')
    } finally {
      setTeachersLoading(null)
    }
  }

  const handleRequestSession = async (form) => {
    try {
      await createSession(form)
      toast.success('Session request sent!')
      setShowSessionModal(false)
      setSelectedTeacher(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create session')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = (text) => {
    handleSend(text)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-4rem)]">
      {hasMessages && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Make Your Learning Path</h1>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                <FiZap className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">AI-Powered</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Make Your Learning Path
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
                Ask anything about your learning, skills, projects, career, or studies and get a personalized learning path.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s.text)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-3">
                {msg.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] bg-primary-500 text-white rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mt-1">
                      <FiZap className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                        {formatResponse(msg.content)}
                      </div>

                      <div className="mt-3 ml-1">
                        {teachersLoading === i ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400">
                            <FiLoader className="w-4 h-4 animate-spin text-primary-500" />
                            Finding matching teachers...
                          </div>
                        ) : msg.teachers ? (
                          <div className="space-y-4 mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                                <FiUsers className="w-4 h-4 text-primary-500" />
                                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                  Find SkillSwap Teachers
                                </span>
                              </div>
                            </div>

                            {msg.skills_extracted && msg.skills_extracted.length > 0 && (
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Skills extracted from your learning path:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.skills_extracted.map((skill, si) => (
                                    <span key={si} className="px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {msg.teachers.length === 0 ? (
                              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
                                <FiUser className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No matching SkillSwap teachers found for this learning path yet.
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Recommended Teachers
                                </p>
                                <div className="space-y-3">
                                  {msg.teachers.map((teacher) => (
                                    <div key={teacher.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                                      <div className="flex items-start gap-3">
                                        <Avatar src={teacher.avatar} name={teacher.name} size="md" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-gray-900 dark:text-white">{teacher.name}</p>
                                            {teacher.relevance && (
                                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRelevanceColor(teacher.relevance)}`}>
                                                {teacher.relevance === 'high' ? 'High Match' : teacher.relevance === 'medium' ? 'Medium Match' : 'Related'}
                                              </span>
                                            )}
                                          </div>
                                          <Rating value={teacher.rating || 0} count={teacher.total_ratings || 0} size="sm" />
                                          {teacher.bio && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{teacher.bio}</p>
                                          )}
                                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="capitalize">{teacher.experience}</span>
                                            {teacher.sessions_completed > 0 && (
                                              <span>{teacher.sessions_completed} session{teacher.sessions_completed !== 1 ? 's' : ''}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Teaches:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {(teacher.teach_skills || []).map((skill, si) => {
                                            const isMatched = (teacher.matched_skills || []).some(
                                              (ms) => ms.toLowerCase() === skill.toLowerCase()
                                            )
                                            return (
                                              <span
                                                key={si}
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                  isMatched
                                                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                }`}
                                              >
                                                {skill}
                                                {isMatched && <FiCheck className="inline w-3 h-3 ml-0.5" />}
                                              </span>
                                            )
                                          })}
                                        </div>
                                      </div>

                                      {teacher.matched_skills && teacher.matched_skills.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Relevant to your learning path:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {teacher.matched_skills.map((ms, si) => (
                                              <span key={si} className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-200 dark:border-green-800">
                                                {ms}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                          onClick={() => navigate(`/profile/${teacher.id}`)}
                                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                                        >
                                          <FiExternalLink className="w-3.5 h-3.5" />
                                          Profile
                                        </button>
                                        <button
                                          onClick={() => { setSelectedTeacher(teacher); setShowSessionModal(true) }}
                                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium text-white transition-colors"
                                        >
                                          <FiUser className="w-3.5 h-3.5" />
                                          Request Session
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleFindTeachers(i)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            <FiUsers className="w-4 h-4" />
                            Find SkillSwap Teachers
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {msg.role === 'error' && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-1">
                      <FiAlertCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-red-600 dark:text-red-400">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FiZap className="w-4 h-4 text-primary-500" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FiLoader className="w-4 h-4 text-primary-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Creating your learning path...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your learning..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm py-2 max-h-32"
              style={{ height: 'auto', minHeight: '2.5rem' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 p-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white rounded-xl transition-colors"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 text-center">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>

      {showSessionModal && selectedTeacher && (
        <CreateSessionModal
          isOpen={showSessionModal}
          onClose={() => { setShowSessionModal(false); setSelectedTeacher(null) }}
          onSubmit={handleRequestSession}
          user={selectedTeacher}
        />
      )}
    </div>
  )
}
