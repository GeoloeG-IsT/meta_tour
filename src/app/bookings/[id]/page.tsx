'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { fetchBookingById } from '@/data/bookings'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

interface BookingDetails {
  id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'partial'
  created_at: string
  tour: {
    id: string
    title: string
    start_date: string
    end_date: string
    price: number
    currency: string
  }
}

export default function ViewBookingPage() {
  const params = useParams<{ id: string }>()
  const bookingId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])
  const router = useRouter()
  const { user, loading } = useAuth()
  const { locale } = useI18n()

  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    async function fetchBooking() {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await fetchBookingById(bookingId)

        if (error) throw error

        if (!data) {
          setError(t(locale, 'booking_not_found') || 'Booking not found')
          return
        }

        setBooking(data as unknown as BookingDetails)
      } catch (err) {
        setError(t(locale, 'booking_load_failed') || 'Failed to load booking')
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) fetchBooking()
  }, [bookingId])

  const handleStripeCheckout = async () => {
    if (!booking) return
    setIsCreatingCheckout(true)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: Math.round(booking.tour.price * 100),
          currency: booking.tour.currency || 'USD',
          tourTitle: booking.tour.title,
          successUrl: `${window.location.origin}/bookings/${booking.id}?payment=success`,
          cancelUrl: `${window.location.origin}/bookings/${booking.id}?payment=cancelled`,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create checkout session')
      }
      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (e) {
      setError(t(locale, 'booking_payment_start_failed') || 'Could not start payment. Please try again later.')
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>{t(locale, 'common_loading')}</div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-secondary-700">{error || t(locale, 'booking_not_found')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-2">
        <Link href="/bookings" className="text-sm text-indigo-600 hover:text-indigo-500">&larr; {t(locale, 'bookings_title')}</Link>
      </div>
      <h1 className="text-2xl font-bold text-secondary-900 mb-2">{t(locale, 'booking_details') || 'Booking Details'}</h1>
      <p className="text-secondary-600 mb-6">{t(locale, 'booking_for') || 'For:'} {booking.tour.title}</p>

      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-secondary-500">{t(locale, 'booking_status') || 'Status'}</div>
            <div className="text-secondary-900 font-medium">{booking.status}</div>
          </div>
          <div>
            <div className="text-secondary-500">{t(locale, 'booking_payment') || 'Payment'}</div>
            <div className="text-secondary-900 font-medium">{booking.payment_status}</div>
          </div>
          <div>
            <div className="text-secondary-500">{t(locale, 'booking_start') || 'Start'}</div>
            <div className="text-secondary-900">{new Date(booking.tour.start_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-secondary-500">{t(locale, 'booking_end') || 'End'}</div>
            <div className="text-secondary-900">{new Date(booking.tour.end_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-secondary-500">{t(locale, 'booking_amount') || 'Amount'}</div>
            <div className="text-secondary-900 font-medium">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.tour.currency || 'USD' }).format(booking.tour.price)}
            </div>
          </div>
        </div>

        {booking.payment_status !== 'paid' && booking.status !== 'cancelled' && (
          <div className="mt-6 flex gap-3">
            <button onClick={handleStripeCheckout} disabled={isCreatingCheckout} className="btn-primary">
              {isCreatingCheckout ? t(locale, 'redirecting') || 'Redirecting…' : t(locale, 'pay_with_stripe') || 'Pay with Stripe'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


