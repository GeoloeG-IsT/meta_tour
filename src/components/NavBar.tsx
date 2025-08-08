'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function NavBar() {
  const { user, loading, signOut, profile } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              SoulTrip
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-sm text-gray-700 hover:text-gray-900">
                  {profile?.full_name || user.email}
                </Link>
                <button
                  onClick={signOut}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
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


