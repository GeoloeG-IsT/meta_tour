'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const { locale } = useI18n()

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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-secondary-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-secondary-300">{t(locale, 'common_loading')}</p>
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
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-secondary-800 overflow-hidden shadow rounded-lg border border-secondary-200 dark:border-secondary-700">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40">
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
                <h2 className="mt-4 text-2xl font-bold text-secondary-900 dark:text-secondary-100">{t(locale, 'dashboard_welcome')}</h2>
                <p className="mt-2 text-secondary-600 dark:text-secondary-300">{
                  profile.role === 'organizer' ? t(locale, 'role_organizer') : profile.role === 'participant' ? t(locale, 'role_participant') : t(locale, 'role_admin')
                }</p>
              </div>

              {/* Role-specific content */}
              <div className="mt-8 border-t border-secondary-200 dark:border-secondary-700 pt-8">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">{t(locale, 'dashboard_quick_actions')}</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {profile.role === 'organizer' ? (
                    <>
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-indigo-900 dark:text-indigo-300">{t(locale, 'action_create_tour')}</h4>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300/80 mt-1">
                          Start organizing your next spiritual journey
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/organizer/tours/new')}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          {t(locale, 'action_create_tour')} →
                        </button>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 dark:text-green-300">{t(locale, 'action_manage_tours')}</h4>
                        <p className="text-sm text-green-700 dark:text-green-300/80 mt-1">
                          View and edit your existing tours
                        </p>
                        <button
                          onClick={() => router.push('/dashboard/organizer/tours')}
                          className="mt-2 text-sm text-green-600 hover:text-green-500 font-medium"
                        >
                          {t(locale, 'action_manage_tours')} →
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-300">{t(locale, 'action_my_bookings')}</h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300/80 mt-1">{t(locale, 'dashboard_my_bookings_desc')}</p>
                        <button
                          onClick={() => router.push('/bookings')}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                        >
                          {t(locale, 'common_open')} →
                        </button>
                      </div>
                      <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-teal-900 dark:text-teal-300">{t(locale, 'action_my_tours')}</h4>
                        <p className="text-sm text-teal-700 dark:text-teal-300/80 mt-1">{t(locale, 'dashboard_my_tours_desc')}</p>
                        <button
                          onClick={() => router.push('/tours')}
                          className="mt-2 text-sm text-teal-600 hover:text-teal-500 font-medium"
                        >
                          {t(locale, 'common_open')} →
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