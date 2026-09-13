import { Link } from 'react-router-dom'
import { FiGithub, FiTwitter, FiMail } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">SS</span>
              </div>
              <span className="text-xl font-bold text-white">Skill-Swap</span>
            </div>
            <p className="text-sm">Exchange skills through time credits. Learn from others, teach what you know.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Platform</h4>
            <div className="space-y-2">
              <Link to="/search" className="block text-sm hover:text-white transition-colors">Browse Skills</Link>
              <Link to="/match" className="block text-sm hover:text-white transition-colors">Find Matches</Link>
              <Link to="/wallet" className="block text-sm hover:text-white transition-colors">How Tokens Work</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm hover:text-white transition-colors">About Us</a>
              <a href="#" className="block text-sm hover:text-white transition-colors">Blog</a>
              <a href="#" className="block text-sm hover:text-white transition-colors">Careers</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm hover:text-white transition-colors">Help Center</a>
              <a href="#" className="block text-sm hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-sm hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">&copy; 2026 Skill-Swap. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors"><FiGithub className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><FiTwitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-white transition-colors"><FiMail className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
