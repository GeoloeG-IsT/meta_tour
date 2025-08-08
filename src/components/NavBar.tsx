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
              <div className="relative">
                <details className="group">
                  <summary className="list-none cursor-pointer flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                    <span>{profile?.full_name || user.email}</span>
                    <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                    <Link href={`/profile/${user.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                    <button onClick={signOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Sign Out</button>
                  </div>
                </details>
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


