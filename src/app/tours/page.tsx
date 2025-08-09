'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { fetchMyBookedTours } from '@/data/bookings'
import TourCard from '@/components/TourCard'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'
import type { TourSummary } from '@/types/tour'

type Tour = TourSummary

export default function MyBookedToursPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { locale } = useI18n()
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) {
      void fetchMyTours()
    }
  }, [loading, user])

  const fetchMyTours = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await fetchMyBookedTours(user!.id)

      if (error) throw error

      const toursList = (data as any[])
        .map((row) => {
          const t = row.tour
          if (!t) return null
          return {
            id: t.id,
            organizer_id: t.organizer_id,
            organizer_name: t.organizer_name,
            title: t.title,
            start_date: t.start_date,
            end_date: t.end_date,
            price: t.price,
            currency: t.currency,
            availability_status: t.availability_status,
            country: t.country,
            difficulty: t.difficulty,
            tour_images: t.tour_images,
          } as Tour
        })
        .filter((t): t is Tour => t !== null)

      setTours(toursList)
    } catch (err) {
      setError(t(locale, 'my_tours_load_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t(locale, 'my_tours_title')}</h1>
        <p className="text-secondary-600">{t(locale, 'my_tours_subtitle')}</p>
      </div>

        {error && <div className="text-error-700 mb-4">{error}</div>}

        {tours.length === 0 ? (
          <div className="text-secondary-700">{t(locale, 'my_tours_empty')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                status={tour.availability_status === 'sold_out' ? 'sold_out' : 'available'}
                isBooked={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}


