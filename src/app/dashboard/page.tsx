'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('DashboardPage: useEffect triggered', { user, profile, loading })
    // Redirect to login if not authenticated
    if (!loading && !user) {
      console.log('DashboardPage: Redirecting to /login')
      router.push('/login')
    }
  }, [user, profile, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user || !profile) {
    return null
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'You can create and manage spiritual tours for others to join.'
      case 'participant':
        return 'You can discover and book transformative spiritual journeys.'
      case 'admin':
        return 'You have full administrative access to the platform.'
      default:
        return 'Welcome to SoulTrip!'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                  <svg
                    className="h-6 w-6 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Welcome to your dashboard!
                </h2>
                <p className="mt-2 text-gray-600">
                  {getRoleDescription(profile.role)}
                </p>
              </div>

              {/* Role-specific content */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profile.role === 'organizer' ? (
                    <>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-medium text-indigo-900">Create a Tour</h4>
                        <p className="text-sm text-indigo-700 mt-1">
                          Start organizing your next spiritual journey
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/organizer/tours/new')}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Create Tour →
                        </button>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900">Manage Tours</h4>
                        <p className="text-sm text-green-700 mt-1">
                          View and edit your existing tours
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/organizer/tours')}
                          className="mt-2 text-sm text-green-600 hover:text-green-500 font-medium"
                        >
                          View Tours →
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900">My Bookings</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          View your upcoming and past journeys
                        </p>
                        <button
                          onClick={() => router.push('/bookings')}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                          Open →
                        </button>
                      </div>
                      <div className="bg-teal-50 p-4 rounded-lg">
                        <h4 className="font-medium text-teal-900">My Tours</h4>
                        <p className="text-sm text-teal-700 mt-1">
                          See tours you have booked
                        </p>
                        <button
                          onClick={() => router.push('/tours')}
                          className="mt-2 text-sm text-teal-600 hover:text-teal-500 font-medium"
                        >
                          Open →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}