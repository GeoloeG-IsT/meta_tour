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


