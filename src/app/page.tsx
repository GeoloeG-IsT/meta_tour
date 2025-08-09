'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TourCard from '@/components/TourCard'
import type { TourSummary } from '@/types/tour'

export default function Home() {
  const { user } = useAuth()
  
  // Tours list with filters
  type Tour = TourSummary

  const [tours, setTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [toursError, setToursError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [perPage, setPerPage] = useState(9)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [bookedIds, setBookedIds] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Load booked ids once per user
  useEffect(() => {
    async function loadBooked() {
      try {
        if (!user) { setBookedIds([]); return }
        const { data: myBookings } = await supabase
          .from('bookings')
          .select('tour_id')
          .eq('participant_id', user.id)
          .neq('status', 'cancelled')
        setBookedIds((myBookings || []).map((b: any) => b.tour_id))
      } catch {}
    }
    void loadBooked()
  }, [user])

  const buildQuery = () => {
    let qb = supabase
      .from('tours')
      .select(`
        id,
        organizer_id,
        organizer_name,
        title,
        start_date,
        end_date,
        price,
        currency,
        country,
        difficulty,
        availability_status,
        tour_images:tour_images!tour_images_tour_id_fkey (
          image_url,
          alt_text
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (query.trim()) qb = qb.ilike('title', `%${query}%`)
    if (startDate) qb = qb.gte('start_date', startDate)
    if (endDate) qb = qb.lte('end_date', endDate)
    if (country.trim()) qb = qb.ilike('country', `%${country}%`)
    if (difficulty) qb = qb.eq('difficulty', difficulty)
    return qb
  }

  const loadPage = async (reset: boolean) => {
    try {
      if (reset) {
        setToursLoading(true)
        setToursError(null)
        setOffset(0)
        setHasMore(true)
      } else {
        setIsLoadingMore(true)
      }
      const from = reset ? 0 : offset
      const to = from + perPage - 1
      const { data, error } = await buildQuery().range(from, to)
      if (error) throw error
      const newItems: Tour[] = ((data as any[]) || []).map((t) => ({
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
      setTours((prev) => (reset ? newItems : [...prev, ...newItems]))
      const received = newItems.length
      setOffset(from + received)
      setHasMore(received === perPage)
    } catch (err) {
      setToursError('Failed to load tours. Please try again later.')
    } finally {
      setToursLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, startDate, endDate, country, difficulty, perPage])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters + Tours grid */}
        <div className="w-full max-w-7xl mx-auto">
          <div className="card p-4 mb-6">
            {/* Top row: Search + Per Page + Filters toggle */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="flex-1">
                <input
                  className="form-input rounded-full"
                  placeholder="Search tours"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary-600">Per page</span>
                <select className="form-input" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} aria-label="Per page">
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={18}>18</option>
                </select>
              </div>
              <div className="md:ml-auto">
                <button className="btn-secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} aria-controls="filters-panel">
                  {filtersOpen ? 'Hide Filters' : 'Filters'}
                </button>
              </div>
            </div>

            {/* Dropdown filters */}
            {filtersOpen && (
              <div id="filters-panel" className="mt-4 border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Start After</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">End Before</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input className="form-input" placeholder="e.g., Nepal" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Difficulty</label>
                  <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="">Any</option>
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setQuery('');
                      setStartDate('');
                      setEndDate('');
                      setCountry('');
                      setDifficulty('');
                      setPerPage(9);
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
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
            <>
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
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button className="btn-secondary" onClick={() => void loadPage(false)} disabled={isLoadingMore}>
                    {isLoadingMore ? 'Loading…' : 'Load More'}
                  </button>
          </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}