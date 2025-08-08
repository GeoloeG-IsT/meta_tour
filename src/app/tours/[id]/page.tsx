'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TourImage {
  image_url: string
  alt_text?: string | null
}

interface Tour {
  id: string
  organizer_id: string
  organizer_name?: string | null
  title: string
  description: string | null
  itinerary: any | null
  start_date: string
  end_date: string
  price: number
  currency: string
  max_participants: number
  status: 'draft' | 'published' | 'archived'
  country?: string | null
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'intense' | null
  tour_images?: TourImage[]
}

export default function TourDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const [tour, setTour] = useState<Tour | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [currentBookingsCount, setCurrentBookingsCount] = useState<number>(0)
  const [userBookingId, setUserBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const tourId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])

  useEffect(() => {
    async function fetchTour() {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('tours')
          .select(
            `id, organizer_id, organizer_name, title, description, itinerary, start_date, end_date, price, currency, max_participants, status, country, difficulty,
             tour_images:tour_images!tour_images_tour_id_fkey ( image_url, alt_text )`
          )
          .eq('id', tourId)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          setError('Tour not found')
          return
        }

        // Only allow viewing published tours or the organizer can preview their own draft
        if (
          data.status !== 'published' &&
          (!user || user.id !== data.organizer_id)
        ) {
          setError('This tour is not available')
          return
        }

        setTour(data as Tour)

        // Fetch current bookings count (exclude cancelled)
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tour_id', tourId)
          .neq('status', 'cancelled')

        setCurrentBookingsCount(count || 0)

        // Check if current user already has a booking for this tour (non-cancelled)
        if (user) {
          const { data: existingBooking } = await supabase
            .from('bookings')
            .select('id')
            .eq('tour_id', tourId)
            .eq('participant_id', user.id)
            .neq('status', 'cancelled')
            .maybeSingle()

          setUserBookingId(existingBooking?.id || null)
        } else {
          setUserBookingId(null)
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load tour')
      } finally {
        setIsLoading(false)
      }
    }

    if (tourId) {
      fetchTour()
    }
  }, [tourId, user])

  const isSoldOut = useMemo(() => {
    if (!tour) return false
    return currentBookingsCount >= tour.max_participants
  }, [currentBookingsCount, tour])

  const handleBook = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/tours/${tourId}`)}`)
      return
    }
    if (!profile) return
    if (profile.role !== 'participant') {
      setBookingMessage('Only participants can book tours')
      return
    }
    if (!tour) return
    if (isSoldOut) {
      setBookingMessage('This tour is sold out')
      return
    }

    try {
      setIsBooking(true)
      setBookingMessage(null)

      // Try to insert booking; unique constraint prevents duplicates
      const { data: inserted, error } = await supabase.from('bookings').insert({
        tour_id: tour.id,
        participant_id: user.id,
        status: 'pending',
        payment_status: 'unpaid',
      }).select('id').single()

      if (error) {
        // If a previous cancelled booking exists, re-activate it
        if (error.code === '23505' || (typeof error.message === 'string' && error.message.includes('duplicate'))) {
          const { data: reactivated, error: reactivateError } = await supabase
            .from('bookings')
            .update({ status: 'pending', payment_status: 'unpaid' })
            .eq('tour_id', tour.id)
            .eq('participant_id', user.id)
            .eq('status', 'cancelled')
            .select('id')
            .maybeSingle()

          if (reactivateError || !reactivated) {
            setBookingMessage('Failed to create booking. Please try again.')
            return
          }

          setUserBookingId(reactivated.id)
          setBookingMessage('Booking re-activated!')
          setCurrentBookingsCount((n) => n + 1)
          try { router.refresh() } catch {}
          return
        }

        setBookingMessage('Failed to create booking. Please try again.')
        return
      }

      if (inserted?.id) {
        setUserBookingId(inserted.id)
      }
      setBookingMessage('Booking created! We will contact you with next steps.')
      setCurrentBookingsCount((n) => n + 1)
      try { router.refresh() } catch {}
    } catch (err) {
      setBookingMessage('Unexpected error during booking')
    } finally {
      setIsBooking(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!userBookingId || !user) return
    const confirmed = typeof window !== 'undefined' ? window.confirm('Are you sure you want to cancel your booking?') : true
    if (!confirmed) return
    try {
      setIsCancelling(true)
      setBookingMessage(null)
      console.log('Cancelling booking', userBookingId, user.id)
      console.log('Booking', userBookingId)
      console.log('User', user.id)
      console.log('Tour', tour?.id)
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', userBookingId)
        .eq('participant_id', user.id)
        .select()
        .single()
      if (error) throw error
      setUserBookingId(null)
      setCurrentBookingsCount((n) => Math.max(0, (n || 0) - 1))
      setBookingMessage('Your booking has been cancelled.')
    } catch (err) {
      // Fallback: try soft-cancel if hard delete fails due to RLS or 406 Not Acceptable (no select)
      try {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', userBookingId)
          .eq('participant_id', user.id)
          .neq('status', 'cancelled')
          .select()
          .single()
        if (!updateError) {
          setUserBookingId(null)
          setCurrentBookingsCount((n) => Math.max(0, (n || 0) - 1))
          setBookingMessage('Your booking has been cancelled.')
          return
        }
      } catch {}
      setBookingMessage('Failed to cancel booking. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading tour...</div>
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{error || 'Tour not found'}</h1>
          <Link href="/tours" className="text-indigo-600 hover:text-indigo-500">← Back to all tours</Link>
        </div>
      </div>
    )
  }

  const heroImage = tour.tour_images?.[0]

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="relative h-64 w-full bg-secondary-200 rounded-md overflow-hidden">
          {heroImage ? (
            <Image src={heroImage.image_url} alt={heroImage.alt_text || tour.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-secondary-600">No image</div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
          <div className="flex-1">
            <div className="mb-2">
              <Link href="/tours" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; My tours</Link>
            </div>
            <h1 className="text-3xl font-bold text-secondary-900">{tour.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {tour.country && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-100 text-secondary-800">
                  {tour.country}
                </span>
              )}
              {tour.difficulty && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary-100 text-secondary-800 capitalize">
                  {tour.difficulty}
                </span>
              )}
              <span className="text-secondary-500">•</span>
              <span className="text-secondary-600">By</span>
              <Link href={`/profile/${tour.organizer_id}`} className="text-indigo-600 hover:text-indigo-500">
                {tour.organizer_name || 'Organizer profile'}
              </Link>
            </div>
            <p className="text-secondary-600 mt-2">
              {formatDate(tour.start_date)} – {formatDate(tour.end_date)}
            </p>

            {tour.description && (
              <div className="prose prose-sm sm:prose max-w-none mt-6 text-secondary-800 whitespace-pre-line">
                {tour.description}
              </div>
            )}

            {tour.itinerary && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">Itinerary</h2>
                <pre className="bg-secondary-50 border border-secondary-200 rounded p-4 overflow-x-auto text-sm">
{JSON.stringify(tour.itinerary, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <aside className="w-full md:w-80 mt-8 md:mt-0">
            <div className="card p-6">
              <div className="text-3xl font-bold text-primary-600">{formatPrice(tour.price, tour.currency)}</div>
              <div className="text-sm text-secondary-600 mt-1">per person</div>
              <div className="mt-4 text-sm text-secondary-700">
                <span className="font-medium">Capacity:</span>{' '}
                {currentBookingsCount}/{tour.max_participants} {isSoldOut && <span className="text-error-600 font-medium">(Sold out)</span>}
              </div>

              {profile?.role === 'organizer' && user?.id === tour.organizer_id && (
                <div className="mt-4">
                  <Link href={`/dashboard/organizer/tours/${tour.id}`} className="btn-secondary">Edit Tour</Link>
                </div>
              )}

              <div className="mt-6">
                {!user ? (
                  <button onClick={() => router.push('/login')} className="btn-primary w-full">Sign in to Book</button>
                ) : profile?.role !== 'participant' ? (
                  <button disabled className="btn-secondary w-full">Only participants can book</button>
                ) : userBookingId ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={() => router.push(`/bookings/${userBookingId}`)} className="btn-secondary flex-1">View Booking</button>
                    <button onClick={handleCancelBooking} disabled={isCancelling} className="btn-secondary flex-1">
                      {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
                    </button>
                  </div>
                ) : isSoldOut ? (
                  <button disabled className="btn-secondary w-full">Sold Out</button>
                ) : (
                  <button onClick={handleBook} disabled={isBooking} className="btn-primary w-full">
                    {isBooking ? 'Booking...' : 'Book Now'}
                  </button>
                )}
              </div>

              {bookingMessage && (
                <div className="mt-4 text-sm text-secondary-700">{bookingMessage}</div>
              )}
            </div>
          </aside>
        </div>

        {tour.tour_images && tour.tour_images.length > 1 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tour.tour_images.slice(1).map((img, idx) => (
                <div key={idx} className="relative w-full h-40 bg-secondary-100">
                  <Image src={img.image_url} alt={img.alt_text || `Tour image ${idx + 1}`} fill className="object-cover rounded" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


