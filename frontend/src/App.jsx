import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ChatProvider } from './context/ChatContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import MatchPage from './pages/MatchPage'
import SessionsPage from './pages/SessionsPage'
import WalletPage from './pages/WalletPage'
import ChatPage from './pages/ChatPage'
import SessionDetailPage from './pages/SessionDetailPage'
import NotificationsPage from './pages/NotificationsPage'
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'
import LearningPathPage from './pages/LearningPathPage'

function GoogleCallback() {
  const { googleLogin } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const hash = location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        googleLogin(accessToken)
      }
    }
  }, [location, googleLogin])

  return <div className="min-h-screen flex items-center justify-center">Loading...</div>
}

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/match" element={<MatchPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/learning-path" element={<LearningPathPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}
