// Core domain types for SoulTrip platform

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  organization_id?: string
  created_at: string
  updated_at: string
}

export type UserRole = 'organizer' | 'participant' | 'admin' | 'partner'

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  website?: string
  owner_id: string
  subscription_tier: SubscriptionTier
  created_at: string
  updated_at: string
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

export interface Tour {
  id: string
  organization_id: string
  title: string
  slug: string
  description: string
  short_description: string
  featured_image_url?: string
  gallery_urls: string[]
  
  // Logistics
  start_date: string
  end_date: string
  location: string
  coordinates?: { lat: number; lng: number }
  max_participants: number
  min_participants: number
  current_participants: number
  
  // Pricing
  base_price: number
  currency: string
  early_bird_price?: number
  early_bird_deadline?: string
  
  // Tour details
  difficulty_level: DifficultyLevel
  categories: TourCategory[]
  itinerary: TourDay[]
  inclusions: string[]
  exclusions: string[]
  requirements: string[]
  
  // Status
  status: TourStatus
  published_at?: string
  created_at: string
  updated_at: string
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type TourCategory = 'spiritual' | 'wellness' | 'adventure' | 'cultural' | 'educational' | 'retreat'
export type TourStatus = 'draft' | 'published' | 'full' | 'cancelled' | 'completed'

export interface TourDay {
  day: number
  title: string
  description: string
  activities: Activity[]
  accommodation?: string
  meals: string[]
}

export interface Activity {
  time: string
  title: string
  description: string
  duration: string
  location?: string
}

export interface Booking {
  id: string
  tour_id: string
  participant_id: string
  organization_id: string
  
  // Booking details
  status: BookingStatus
  booking_date: string
  participants_count: number
  room_preference?: string
  dietary_requirements?: string[]
  special_requests?: string
  
  // Payment
  total_amount: number
  currency: string
  payment_status: PaymentStatus
  payment_method?: string
  installments?: PaymentInstallment[]
  
  created_at: string
  updated_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'

export interface PaymentInstallment {
  amount: number
  due_date: string
  status: PaymentStatus
  payment_intent_id?: string
}

export interface Community {
  id: string
  tour_id: string
  organization_id: string
  name: string
  description?: string
  type: CommunityType
  privacy: CommunityPrivacy
  member_count: number
  created_at: string
}

export type CommunityType = 'pre_tour' | 'during_tour' | 'post_tour' | 'general'
export type CommunityPrivacy = 'public' | 'private' | 'invite_only'

export interface UserProfile {
  id: string
  user_id: string
  bio?: string
  interests: string[]
  travel_experience: TravelExperience
  spiritual_practices: string[]
  dietary_preferences: string[]
  emergency_contact: EmergencyContact
  achievements: Achievement[]
  created_at: string
  updated_at: string
}

export type TravelExperience = 'beginner' | 'some_experience' | 'experienced' | 'expert'

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
  email?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned_at: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Form types
export interface TourFormData {
  title: string
  description: string
  short_description: string
  start_date: string
  end_date: string
  location: string
  max_participants: number
  base_price: number
  currency: string
  difficulty_level: DifficultyLevel
  categories: TourCategory[]
  inclusions: string[]
  exclusions: string[]
  requirements: string[]
}

export interface BookingFormData {
  participants_count: number
  room_preference?: string
  dietary_requirements: string[]
  special_requests?: string
  emergency_contact: EmergencyContact
}