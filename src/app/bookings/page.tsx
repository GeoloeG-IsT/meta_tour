'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { fetchMyBookings } from '@/data/bookings'
import BookingCard from '@/components/BookingCard'
import Button from '@/components/ui/Button'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

interface BookingRow {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'partial'
  created_at: string
  tour: { id: string; title: string; start_date: string; end_date: string }
}

export default function MyBookingsPage() {
  const { user, profile, loading } = useAuth()
  const { locale } = useI18n()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      void fetchBookings()
    }
  }, [loading, user])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await fetchMyBookings(user!.id)

      if (error) throw error

      setBookings(
        (data as any[])?.map((b) => ({
          id: b.id,
          status: b.status,
          payment_status: b.payment_status,
          created_at: b.created_at,
          tour: {
            id: b.tour?.id,
            title: b.tour?.title,
            start_date: b.tour?.start_date,
            end_date: b.tour?.end_date,
          },
        })) || []
      )
    } catch (err) {
      setError('Failed to load bookings')
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
    if (typeof window !== 'undefined') {
      window.location.assign('/login')
    }
    return null
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">{t(locale, 'bookings_title')}</h1>
        </div>

      {error && <div className="text-error-700 mb-4">{error}</div>}

      {bookings.length === 0 ? (
        <div className="text-secondary-700">{t(locale, 'bookings_empty')}</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}


