import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-ink-500 to-ink-700 rounded-lg flex items-center justify-center shadow-lg shadow-ink-900/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <span className="font-display text-xl text-white group-hover:text-ink-300 transition-colors">
              DocSign
            </span>
          </Link>

          {/* Nav links */}
          {user && (
            <div className="hidden sm:flex items-center gap-1">
              {[
                { path: '/dashboard', label: 'Dashboard' },
                { path: '/upload', label: 'Upload' },
              ].map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-ink-900/50 text-ink-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* User menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ink-500 to-ink-700 flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm text-slate-300 group-hover:text-white transition-colors">
                  {user.name}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 card shadow-xl py-1 animate-fade-up">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">Sign in</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
