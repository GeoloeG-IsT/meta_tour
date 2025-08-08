export type TourDifficulty = 'easy' | 'moderate' | 'challenging' | 'intense'
export type TourPublishStatus = 'draft' | 'published' | 'archived'
export type TourAvailabilityStatus = 'available' | 'sold_out'

export interface TourImage {
  image_url: string
  alt_text?: string | null
}

export interface TourSummary {
  id: string
  organizer_id?: string
  organizer_name?: string | null
  title: string
  start_date: string
  end_date: string
  price: number
  currency: string
  country?: string | null
  difficulty?: TourDifficulty | null
  availability_status?: TourAvailabilityStatus
  tour_images?: TourImage[]
}

export interface TourDetail extends TourSummary {
  description?: string | null
  itinerary?: any | null
  max_participants: number
  status: TourPublishStatus
}


