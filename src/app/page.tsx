'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TourCard from '@/components/TourCard'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  
  // Tours list with filters
  interface Tour {
    id: string
    title: string
    start_date: string
    end_date: string
    price: number
    currency: string
    availability_status?: 'available' | 'sold_out'
    tour_images?: { image_url: string; alt_text?: string }[]
  }

  const [tours, setTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [toursError, setToursError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [bookedIds, setBookedIds] = useState<string[]>([])


  useEffect(() => {
    async function fetchTours() {
      try {
        setToursLoading(true)
        setToursError(null)
        const { data, error } = await supabase
          .from('tours')
          .select(`
            id,
            title,
            start_date,
            end_date,
            price,
            currency,
            availability_status,
            tour_images:tour_images!tour_images_tour_id_fkey (
              image_url,
              alt_text
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (error) throw error

        let baseTours = (data as any[]) || []

        // Fetch user's booked tour IDs to compute "booked" status
        let bookedTourIds = new Set<string>()
        if (user) {
          const { data: myBookings } = await supabase
            .from('bookings')
            .select('tour_id')
            .eq('participant_id', user.id)
            .neq('status', 'cancelled')

          if (myBookings) {
            bookedTourIds = new Set(myBookings.map((b: any) => b.tour_id))
          }
        }
        setBookedIds(Array.from(bookedTourIds))

        let items: Tour[] = baseTours.map((t: any) => {
          const computed: Tour = {
            id: t.id,
            title: t.title,
            start_date: t.start_date,
            end_date: t.end_date,
            price: t.price,
            currency: t.currency,
            availability_status: t.availability_status,
            tour_images: t.tour_images,
          }
          return computed
        })
        if (query.trim()) {
          const q = query.toLowerCase()
          items = items.filter((t) => t.title.toLowerCase().includes(q))
        }
        if (startDate) {
          items = items.filter((t) => new Date(t.start_date) >= new Date(startDate))
        }
        if (endDate) {
          items = items.filter((t) => new Date(t.end_date) <= new Date(endDate))
        }
        setTours(items)
      } catch (err) {
        setToursError('Failed to load tours. Please try again later.')
      } finally {
        setToursLoading(false)
      }
    }
    fetchTours()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, startDate, endDate, user])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters + Tours grid */}
        <div className="w-full max-w-7xl mx-auto">
          <div className="card p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Search</label>
                <input className="form-input" placeholder="Search by title" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Start After</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">End Before</label>
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="flex items-end">
                <button className="btn-secondary w-full" onClick={() => { setQuery(''); setStartDate(''); setEndDate(''); }}>Clear Filters</button>
          </div>
        </div>
          </div>

          {toursLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-48 bg-secondary-300 rounded mb-4"></div>
                  <div className="h-6 bg-secondary-300 rounded mb-2"></div>
                  <div className="h-4 bg-secondary-300 rounded mb-2"></div>
                  <div className="h-4 bg-secondary-300 rounded w-1/2"></div>
          </div>
              ))}
          </div>
          ) : toursError ? (
            <div className="text-center text-secondary-600">{toursError}</div>
          ) : tours.length === 0 ? (
            <div className="text-center text-secondary-600">No tours available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                status={tour.availability_status}
                isBooked={user ? bookedIds.includes(tour.id) : false}
              />
              ))}
          </div>
          )}
        </div>
      </main>
    </div>
  )
}