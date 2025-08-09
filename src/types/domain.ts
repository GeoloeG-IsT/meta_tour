export type UserRole = 'participant' | 'organizer' | 'admin'

export type TourDifficulty = 'easy' | 'moderate' | 'challenging' | 'intense'
export type TourAvailabilityStatus = 'available' | 'sold_out'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'partial'

export interface EntityId {
  id: string
}


