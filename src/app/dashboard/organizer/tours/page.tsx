'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'
import { fetchOrganizerTours } from '@/data/tours'

interface TourListItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  start_date: string
  end_date: string
  created_at: string
}

export default function OrganizerToursListPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const { locale } = useI18n()
  const [tours, setTours] = useState<TourListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== 'organizer') {
        router.push('/login')
      } else {
        void fetchTours()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile])

  const fetchTours = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await fetchOrganizerTours(user!.id)

      if (error) throw error
      setTours(data || [])
    } catch (err) {
      setError(t(locale, 'org_tours_error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t(locale, 'org_tours_title')}</h1>
        <a href="/dashboard/organizer/tours/new" className="btn-primary">{t(locale, 'org_tours_new')}</a>
      </div>

      {isLoading ? (
        <div className="text-secondary-600">{t(locale, 'org_tours_loading')}</div>
      ) : error ? (
        <div className="text-error-700">{t(locale, 'org_tours_error')}</div>
      ) : tours.length === 0 ? (
        <div className="text-secondary-700">{t(locale, 'org_tours_empty')}</div>
      ) : (
        <div className="space-y-4">
          {tours.map((tour) => (
            <div key={tour.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-secondary-900">{tour.title}</div>
                <div className="text-sm text-secondary-600">
                  {new Date(tour.start_date).toLocaleDateString()} – {new Date(tour.end_date).toLocaleDateString()}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800">
                    {tour.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={`/tours/${tour.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">{t(locale, 'common_view_tour')}</a>
                <a href={`/dashboard/organizer/tours/${tour.id}`} className="text-secondary-700 hover:text-secondary-900 text-sm">{t(locale, 'edit_tour')}</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}