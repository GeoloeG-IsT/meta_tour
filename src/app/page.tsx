'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()


  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">SoulTrip</h1>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.email}
                  </span>
                  <Link
                    href="/dashboard"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={useAuth().signOut}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:translate-y-1/4 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              Welcome to SoulTrip
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Discover and book transformative spiritual journeys around the world.
              Connect with like-minded seekers and embark on your sacred adventure.
            </p>
            {!user && (
              <div className="flex justify-center space-x-4">
                <Link
                  href="/signup"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/login"
                  className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-3 rounded-lg text-lg font-medium border border-gray-300 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-4 lg:text-left gap-6">
          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              Discover Tours
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-gray-600">
              Browse transformative spiritual journeys around the world.
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              Create Tours
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-gray-600">
              Share your sacred journey with fellow pilgrims.
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              Community
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-gray-600">
              Connect with like-minded spiritual seekers.
            </p>
          </div>

          <div className="group rounded-lg border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              Your Journey
            </h2>
            <p className="m-0 max-w-[30ch] text-sm text-gray-600">
              Track your bookings and spiritual progress.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}