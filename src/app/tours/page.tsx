'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import TourCard from '@/components/TourCard'

interface Tour {
  id: string
  title: string
  start_date: string
  end_date: string
  price: number
  currency: string
  availability_status?: 'available' | 'sold_out'
  tour_images?: { image_url: string; alt_text?: string }[]
}

export default function MyBookedToursPage() {
  const { user, loading } = useAuth()
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
      // Join bookings -> tours and compute status client-side combining bookings and availability
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `tour:tours ( id, title, start_date, end_date, price, currency, availability_status, tour_images:tour_images!tour_images_tour_id_fkey ( image_url, alt_text ) )`
        )
        .eq('participant_id', user!.id)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

      if (error) throw error

      const toursList = (data as any[])
        .map((row) => {
          const t = row.tour
          if (!t) return null
          return {
            id: t.id,
            title: t.title,
            start_date: t.start_date,
            end_date: t.end_date,
            price: t.price,
            currency: t.currency,
            availability_status: t.availability_status,
            tour_images: t.tour_images,
          } as Tour
        })
        .filter((t): t is Tour => t !== null)

      setTours(toursList)
    } catch (err) {
      setError('Failed to load your tours')
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-secondary-900">My Tours</h1>
          <p className="text-secondary-600">Tours you have booked</p>
        </div>

        {error && <div className="text-error-700 mb-4">{error}</div>}

        {tours.length === 0 ? (
          <div className="text-secondary-700">You have not booked any tours yet.</div>
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


