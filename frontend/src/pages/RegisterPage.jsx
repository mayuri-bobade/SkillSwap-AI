import { Link } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'
import GoogleLogin from '../components/auth/GoogleLogin'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">Join Skill-Swap</h1>
          <p className="text-xl text-white/80 mb-8">Start exchanging skills with people around the world.</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-left">
            {['Free to join', 'No money needed', 'Learn anything', 'Teach everything'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-300" />
                <span className="text-white/90 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">SS</span>
              </div>
              <span className="text-2xl font-bold text-gradient">Skill-Swap</span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Join our community and start swapping skills.</p>
          </div>
          <div className="card">
            <RegisterForm />
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white dark:bg-gray-800 px-3 text-gray-500">or sign up with</span></div>
            </div>
            <GoogleLogin text="Sign up with Google" />
          </div>
        </div>
      </div>
    </div>
  )
}
