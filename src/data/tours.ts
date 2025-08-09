import { supabase } from '@/lib/supabase'

export type TourFilters = {
  startDate?: string
  endDate?: string
  countries?: string[]
  difficulty?: string
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
    .order('created_at', { ascending: false })

  if (filters.startDate) qb = qb.gte('start_date', filters.startDate)
  if (filters.endDate) qb = qb.lte('end_date', filters.endDate)
  if (filters.countries && filters.countries.length > 0) qb = qb.in('country', filters.countries.map((c) => c.toLowerCase()))
  if (filters.difficulty) qb = qb.eq('difficulty', filters.difficulty)

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


