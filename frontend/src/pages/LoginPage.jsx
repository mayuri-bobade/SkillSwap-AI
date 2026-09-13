import { Link } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import GoogleLogin from '../components/auth/GoogleLogin'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>
          <p className="text-xl text-white/80 mb-8">Continue your skill exchange journey. Your next lesson is waiting.</p>
          <div className="flex justify-center gap-8">
            <div><p className="text-3xl font-bold">500+</p><p className="text-white/60 text-sm">Skills</p></div>
            <div><p className="text-3xl font-bold">10K+</p><p className="text-white/60 text-sm">Users</p></div>
            <div><p className="text-3xl font-bold">50K+</p><p className="text-white/60 text-sm">Sessions</p></div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">SS</span>
              </div>
              <span className="text-2xl font-bold text-gradient">Skill-Swap</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Welcome back! Enter your credentials to continue.</p>
          </div>
          <div className="card">
            <LoginForm />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-3 text-gray-500">or continue with</span></div>
            </div>
            <GoogleLogin />
          </div>
        </div>
      </div>
    </div>
  )
}
