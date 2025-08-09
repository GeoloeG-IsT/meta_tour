import { supabase } from '@/lib/supabase'
import type { TourSummary } from '@/types/tour'

export type TourFilters = {
  startDate?: string
  endDate?: string
  countries?: string[]
  difficulty?: string
  sort?: { column: string; ascending: boolean } | null
}

export type Range = { from: number; to: number }

export async function fetchPublishedTours(filters: TourFilters, range?: Range) {
  let qb = supabase
    .from('tours')
    .select(
      `id, organizer_id, organizer_name, title, start_date, end_date, price, currency, country, difficulty, availability_status,
       tour_images:tour_images!tour_images_tour_id_fkey ( image_url, alt_text )`
    )
    .eq('status', 'published')

  if (filters.startDate) qb = qb.gte('start_date', filters.startDate)
  if (filters.endDate) qb = qb.lte('end_date', filters.endDate)
  if (filters.countries && filters.countries.length > 0) qb = qb.in('country', filters.countries.map((c) => c.toLowerCase()))
  if (filters.difficulty) qb = qb.eq('difficulty', filters.difficulty)
  if (filters.sort) qb = qb.order(filters.sort.column as any, { ascending: filters.sort.ascending })
  else qb = qb.order('created_at' as any, { ascending: false })

  const result = range ? await qb.range(range.from, range.to) : await qb
  return result
}

export async function fetchTourParticipants(tourId: string) {
  return supabase
    .from('bookings')
    .select(`participant:users!bookings_participant_id_fkey ( id, full_name, avatar_url )`)
    .eq('tour_id', tourId)
    .neq('status', 'cancelled')
}

export async function fetchTourById(tourId: string) {
  return supabase
    .from('tours')
    .select(
      `id, organizer_id, organizer_name, title, description, itinerary, start_date, end_date, price, currency, max_participants, status, country, difficulty,
       tour_images:tour_images!tour_images_tour_id_fkey ( image_url, alt_text )`
    )
    .eq('id', tourId)
    .maybeSingle()
}

export async function countBookingsForTour(tourId: string) {
  return supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('tour_id', tourId)
    .neq('status', 'cancelled')
}

export async function fetchExistingBookingId(tourId: string, userId: string) {
  return supabase
    .from('bookings')
    .select('id')
    .eq('tour_id', tourId)
    .eq('participant_id', userId)
    .neq('status', 'cancelled')
    .maybeSingle()
}

export function mapTours(data: any[]): TourSummary[] {
  return (data || []).map((t: any) => ({
    id: t.id,
    organizer_id: t.organizer_id,
    organizer_name: t.organizer_name,
    title: t.title,
    start_date: t.start_date,
    end_date: t.end_date,
    price: t.price,
    currency: t.currency,
    country: t.country,
    difficulty: t.difficulty,
    availability_status: t.availability_status,
    tour_images: t.tour_images,
  }))
}

export type TourInsertPayload = {
  organizer_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  price: number
  currency: string
  max_participants: number
  country?: string | null
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'intense' | null
  status: 'draft' | 'published' | 'archived'
}

export async function createTour(payload: TourInsertPayload) {
  return supabase
    .from('tours')
    .insert(payload)
    .select('id')
    .single()
}

export type TourUpdatePayload = Partial<Omit<TourInsertPayload, 'organizer_id'>> & { status?: 'draft' | 'published' | 'archived' }

export async function updateTour(tourId: string, payload: TourUpdatePayload) {
  return supabase
    .from('tours')
    .update(payload)
    .eq('id', tourId)
}

export async function deleteTour(tourId: string) {
  return supabase.from('tours').delete().eq('id', tourId)
}

export async function fetchOrganizerTours(organizerId: string) {
  return supabase
    .from('tours')
    .select('id, title, status, start_date, end_date, created_at')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
}


