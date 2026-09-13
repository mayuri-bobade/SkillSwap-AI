import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiZap, FiUsers, FiVideo, FiMessageCircle, FiClock, FiStar, FiCheckCircle } from 'react-icons/fi'
import Footer from '../components/layout/Footer'

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [visible, target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function LandingPage() {
  const features = [
    { icon: FiZap, title: 'Time Tokens', description: 'Earn tokens by teaching, spend them learning. A fair economy for your skills.' },
    { icon: FiUsers, title: 'Smart Matching', description: 'Our algorithm finds the perfect skill swap partners based on what you teach and want to learn.' },
    { icon: FiVideo, title: 'Video Sessions', description: 'Built-in video calling for seamless remote learning experiences.' },
    { icon: FiMessageCircle, title: 'Real-time Chat', description: 'Connect with your skill partners instantly through our messaging system.' },
  ]

  const steps = [
    { number: '01', title: 'Create Your Profile', description: 'List the skills you can teach and the ones you want to learn.' },
    { number: '02', title: 'Find Your Match', description: 'Our system matches you with complementary skill partners.' },
    { number: '03', title: 'Exchange & Learn', description: 'Schedule sessions, learn new skills, and earn tokens.' },
  ]

  const testimonials = [
    { name: 'Sarah Chen', role: 'Web Developer', text: 'I traded my React knowledge for guitar lessons. Best decision ever!', rating: 5 },
    { name: 'Marcus Johnson', role: 'Music Teacher', text: 'This platform helped me learn Spanish while teaching piano. Amazing community!', rating: 5 },
    { name: 'Elena Rodriguez', role: 'UX Designer', text: 'The token system makes it so fair. I love how it all works.', rating: 5 },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-32 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <FiClock className="w-4 h-4 text-accent-300" />
              <span className="text-sm text-white/90">Your time is the ultimate currency</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Skill-Swap<br />
              <span className="text-accent-300">Exchange Skills,</span><br />
              Not Money
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
              A time-credit based platform where you teach what you know and learn what you love. 
              No money needed — just your skills and time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center gap-2 text-lg">
                Get Started Free <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="text-white border-2 border-white/30 font-semibold py-3 px-8 rounded-xl hover:bg-white/10 transition-all duration-200 text-lg">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Skill-Swap?</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Everything you need to exchange skills with others in our community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Three simple steps to start exchanging skills.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="card text-center">
                  <span className="text-5xl font-bold text-primary-500/20">{s.number}</span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-2 mb-3">{s.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{s.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <FiArrowRight className="w-6 h-6 text-primary-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 gradient-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 10000, suffix: '+', label: 'Active Users' },
              { value: 50000, suffix: '+', label: 'Sessions Completed' },
              { value: 500, suffix: '+', label: 'Skills Available' },
              { value: 98, suffix: '%', label: 'Satisfaction Rate' },
            ].map((s) => (
              <div key={s.label} className="text-white">
                <p className="text-4xl md:text-5xl font-bold mb-2">
                  <AnimatedCounter target={s.value} />{s.suffix}
                </p>
                <p className="text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card"
              >
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, j) => <FiStar key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">"{t.text}"</p>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Ready to Start Swapping Skills?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">Join thousands of learners and teachers exchanging skills through time credits.</p>
          <Link to="/register" className="btn-primary text-lg py-3 px-10 inline-flex items-center gap-2">
            <FiCheckCircle className="w-5 h-5" /> Create Free Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
