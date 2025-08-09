import { supabase } from '@/lib/supabase'

export async function fetchMyBookings(userId: string) {
  return supabase
    .from('bookings')
    .select(`id, status, payment_status, created_at, tour:tours ( id, title, start_date, end_date )`)
    .eq('participant_id', userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
}

export async function fetchMyBookedTourIds(userId: string) {
  return supabase
    .from('bookings')
    .select('tour_id')
    .eq('participant_id', userId)
    .neq('status', 'cancelled')
}

export async function fetchMyBookedTours(userId: string) {
  return supabase
    .from('bookings')
    .select(
      `tour:tours ( id, organizer_id, organizer_name, title, start_date, end_date, price, currency, availability_status, country, difficulty, tour_images:tour_images!tour_images_tour_id_fkey ( image_url, alt_text ) )`
    )
    .eq('participant_id', userId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
}

export async function fetchBookingById(bookingId: string) {
  return supabase
    .from('bookings')
    .select(
      `id, status, payment_status, created_at,
       tour:tours ( id, title, start_date, end_date, price, currency )`
    )
    .eq('id', bookingId)
    .maybeSingle()
}

export async function ensureBooking(tourId: string, userId: string) {
  // Try to insert; if duplicate, attempt to reactivate a cancelled booking
  const insertRes = await supabase
    .from('bookings')
    .insert({ tour_id: tourId, participant_id: userId, status: 'pending', payment_status: 'unpaid' })
    .select('id')
    .single()

  if (!insertRes.error) {
    return { kind: 'created' as const, id: insertRes.data?.id as string, error: null }
  }

  const duplicate = insertRes.error.code === '23505' || (typeof insertRes.error.message === 'string' && insertRes.error.message.includes('duplicate'))
  if (!duplicate) {
    return { kind: 'error' as const, id: null, error: insertRes.error }
  }

  const reactivate = await supabase
    .from('bookings')
    .update({ status: 'pending', payment_status: 'unpaid' })
    .eq('tour_id', tourId)
    .eq('participant_id', userId)
    .eq('status', 'cancelled')
    .select('id')
    .maybeSingle()

  if (reactivate.error || !reactivate.data) {
    return { kind: 'error' as const, id: null, error: reactivate.error || insertRes.error }
  }

  return { kind: 'reactivated' as const, id: reactivate.data.id as string, error: null }
}

export async function hardCancelBooking(bookingId: string, userId: string) {
  return supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .eq('participant_id', userId)
    .select()
    .single()
}

export async function softCancelBooking(bookingId: string, userId: string) {
  return supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('participant_id', userId)
    .neq('status', 'cancelled')
    .select()
    .single()
}

export async function fetchBookingsForTour(tourId: string) {
  return supabase
    .from('bookings')
    .select(
      `id, status, payment_status, created_at,
       participant:users!bookings_participant_id_fkey ( id, full_name )`
    )
    .eq('tour_id', tourId)
    .order('created_at', { ascending: false })
}


