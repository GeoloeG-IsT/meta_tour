'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Avatar from '@/components/Avatar'
import { useEffect, useRef, useState } from 'react'

export default function NavBar() {
  const { user, loading, signOut, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  return (
    <nav className="bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-secondary-100">
              SoulTrip
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {loading ? (
              <div className="animate-pulse bg-secondary-200 dark:bg-secondary-700 h-8 w-24 rounded" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-secondary-100 hover:text-gray-900 dark:hover:text-white"
                >
                  <Avatar url={profile?.avatar_url} alt={profile?.full_name || user.email || 'User'} size={32} />
                  <span>{profile?.full_name || user.email}</span>
                  <svg className={`w-4 h-4 text-gray-500 dark:text-secondary-300 transform transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                  role="menu"
                  className={`absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-md shadow-lg py-1 z-50 origin-top-right transform transition ease-out duration-150 ${
                    menuOpen ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
                  }`}
                >
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-secondary-100 hover:bg-gray-50 dark:hover:bg-secondary-700"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href={`/profile`}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-secondary-100 hover:bg-gray-50 dark:hover:bg-secondary-700"
                    onClick={() => setMenuOpen(false)}
                    role="menuitem"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); void signOut() }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-secondary-100 hover:bg-gray-50 dark:hover:bg-secondary-700"
                    role="menuitem"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/')}`} className="text-gray-700 dark:text-secondary-100 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


