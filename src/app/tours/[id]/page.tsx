'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import ParticipantsList from '@/components/participants/ParticipantsList'
import { formatDisplayDate, formatPrice } from '@/lib/format'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ensureBooking, hardCancelBooking, softCancelBooking } from '@/data/bookings'
import { fetchTourParticipants, fetchTourById, countBookingsForTour, fetchExistingBookingId } from '@/data/tours'
import { useAuth } from '@/contexts/AuthContext'
import type { TourDetail } from '@/types/tour'

type Tour = TourDetail

export default function TourDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { locale } = useI18n()

  const [tour, setTour] = useState<Tour | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingMessage, setBookingMessage] = useState<string | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [currentBookingsCount, setCurrentBookingsCount] = useState<number>(0)
  const [userBookingId, setUserBookingId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [participants, setParticipants] = useState<Array<{ id: string; full_name: string | null; avatar_url: string | null }>>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)

  const tourId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])

  useEffect(() => {
    async function fetchTour() {
      try {
        setIsLoading(true)
        setError(null)

      const { data, error } = await fetchTourById(tourId)

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
        const { count } = await countBookingsForTour(tourId)

        setCurrentBookingsCount(count || 0)

        // Check if current user already has a booking for this tour (non-cancelled)
        if (user) {
          const { data: existingBooking } = await fetchExistingBookingId(tourId, user.id)

          setUserBookingId(existingBooking?.id || null)
        } else {
          setUserBookingId(null)
        }

        // If organizer viewing own tour, load participants list
        if (user && user.id === (data as any).organizer_id) {
          try {
            setParticipantsLoading(true)
            const { data: rows, error: partErr } = await fetchTourParticipants(tourId)
            if (partErr) throw partErr
            const unique: Record<string, { id: string; full_name: string | null; avatar_url: string | null }> = {}
            ;(rows as any[] | null)?.forEach((r) => {
              const p = r.participant
              if (p && p.id) unique[p.id] = { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }
            })
            setParticipants(Object.values(unique))
          } catch (e) {
            // ignore; participants will remain empty
          } finally {
            setParticipantsLoading(false)
          }
        } else {
          setParticipants([])
        }
      } catch (err) {
        console.error(err)
        setError(t(locale, 'tour_load_failed'))
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
      const result = await ensureBooking(tour.id, user.id)
      if (result.error || !result.id) {
        setBookingMessage(t(locale, 'booking_create_failed') || 'Failed to create booking. Please try again.')
        return
      }
      setUserBookingId(result.id)
      setBookingMessage(result.kind === 'reactivated' ? 'Booking re-activated!' : 'Booking created! We will contact you with next steps.')
      setCurrentBookingsCount((n) => n + 1)
      try { router.refresh() } catch {}
    } catch (err) {
      setBookingMessage(t(locale, 'booking_unexpected_error') || 'Unexpected error during booking')
    } finally {
      setIsBooking(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!userBookingId || !user) return
    const confirmed = typeof window !== 'undefined' ? window.confirm(t(locale, 'booking_confirm_cancel')) : true
    if (!confirmed) return
    try {
      setIsCancelling(true)
      setBookingMessage(null)
      const { error } = await hardCancelBooking(userBookingId, user.id)
      if (error) throw error
      setUserBookingId(null)
      setCurrentBookingsCount((n) => Math.max(0, (n || 0) - 1))
      setBookingMessage(t(locale, 'booking_cancelled') || 'Your booking has been cancelled.')
    } catch (err) {
      try {
        const { error: updateError } = await softCancelBooking(userBookingId, user.id)
        if (!updateError) {
          setUserBookingId(null)
          setCurrentBookingsCount((n) => Math.max(0, (n || 0) - 1))
          setBookingMessage('Your booking has been cancelled.')
          return
        }
      } catch {}
      setBookingMessage(t(locale, 'booking_cancel_failed') || 'Failed to cancel booking. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateString: string) => formatDisplayDate(dateString, locale)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">{t(locale, 'common_loading')}</div>
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{error || t(locale, 'tour_not_found')}</h1>
          <Link href="/tours" className="text-indigo-600 hover:text-indigo-500">← {t(locale, 'back_to_all_tours')}</Link>
        </div>
      </div>
    )
  }

  const heroImage = tour.tour_images?.[0]

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="relative h-64 w-full bg-secondary-200 rounded-md overflow-hidden">
          {heroImage ? (
            <Image src={heroImage.image_url} alt={heroImage.alt_text || tour.title} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-secondary-600">{t(locale, 'no_image')}</div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
          <div className="flex-1">
            <div className="mb-2">
              <Link href="/tours" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; {t(locale, 'tour_my_tours_back')}</Link>
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
              <span className="text-secondary-600">{t(locale, 'tour_by')}</span>
              <Link href={`/profile/${tour.organizer_id}`} className="text-indigo-600 hover:text-indigo-500">
                {tour.organizer_name || t(locale, 'view_profile')}
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
                <h2 className="text-xl font-semibold text-secondary-900 mb-3">{t(locale, 'itinerary')}</h2>
                <pre className="bg-secondary-50 border border-secondary-200 rounded p-4 overflow-x-auto text-sm">
{JSON.stringify(tour.itinerary, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <aside className="w-full md:w-80 mt-8 md:mt-0">
            <div className="card p-6">
              <div className="text-3xl font-bold text-primary-600">{formatPrice(tour.price, tour.currency)}</div>
              <div className="text-sm text-secondary-600 mt-1">{t(locale, 'tour_per_person')}</div>
              <div className="mt-4 text-sm text-secondary-700">
                <span className="font-medium">{t(locale, 'capacity')}:</span>{' '}
                {currentBookingsCount}/{tour.max_participants} {isSoldOut && <span className="text-error-600 font-medium">({t(locale, 'tour_sold_out')})</span>}
              </div>

              {profile?.role === 'organizer' && user?.id === tour.organizer_id && (
                <div className="mt-4">
                  <Link href={`/dashboard/organizer/tours/${tour.id}`} className="btn-secondary">{t(locale, 'edit_tour')}</Link>
                </div>
              )}

              <div className="mt-6">
                {!user ? (
                  <button onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/tours/${tourId}`)}`)} className="btn-primary w-full">{t(locale, 'tour_sign_in_to_book')}</button>
                ) : profile?.role !== 'participant' ? (
                  <button disabled className="btn-secondary w-full">{t(locale, 'tour_only_participants')}</button>
                ) : userBookingId ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={() => router.push(`/bookings/${userBookingId}`)} className="btn-secondary flex-1">{t(locale, 'common_view_booking')}</button>
                    <button onClick={handleCancelBooking} disabled={isCancelling} className="btn-secondary flex-1">
                      {isCancelling ? 'Cancelling…' : t(locale, 'tour_cancel_booking')}
                    </button>
                  </div>
                ) : isSoldOut ? (
                  <button disabled className="btn-secondary w-full">{t(locale, 'tour_sold_out')}</button>
                ) : (
                  <button onClick={handleBook} disabled={isBooking} className="btn-primary w-full">
                    {isBooking ? t(locale, 'booking_booking') : t(locale, 'tour_book_now')}
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
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">{t(locale, 'tour_gallery')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tour.tour_images.slice(1).map((img, idx) => (
                <div key={idx} className="relative w-full h-40 bg-secondary-100">
                  <Image src={img.image_url} alt={img.alt_text || `Tour image ${idx + 1}`} fill className="object-cover rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {user?.id === tour.organizer_id && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Participants</h2>
            {participantsLoading ? (
              <div className="text-secondary-600 text-sm">{t(locale, 'participants_loading')}</div>
            ) : participants.length === 0 ? (
              <div className="text-secondary-600 text-sm">{t(locale, 'no_participants')}</div>
            ) : (
              <ParticipantsList participants={participants} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}


