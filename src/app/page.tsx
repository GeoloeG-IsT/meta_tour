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
  const [difficulty, setDifficulty] = useState('')
  const [countries, setCountries] = useState<string[]>([])
  const [perPage, setPerPage] = useState(9)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [bookedIds, setBookedIds] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isInferring, setIsInferring] = useState(false)

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

    if (startDate) qb = qb.gte('start_date', startDate)
    if (endDate) qb = qb.lte('end_date', endDate)
    if (countries.length > 0) qb = qb.in('country', countries.map((c) => c.toLowerCase()))
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
      const countriesLower = countries.map((c) => c.toLowerCase())
      console.log('[Tours] Fetch start', {
        when: new Date().toISOString(),
        reset,
        filters: { startDate, endDate, difficulty, countries: countriesLower },
        pagination: { from, to, perPage, prevOffset: offset },
      })
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const { data, error } = await buildQuery().range(from, to)
      const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[Tours] Fetch end', {
        when: new Date().toISOString(),
        durationMs: Math.round((t1 - t0) as number),
      })
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
      console.log('[Tours] Page results', { received, totalNow: (reset ? newItems.length : newItems.length + tours.length), hasMore: received === perPage })
    } catch (err) {
      console.error('[Tours] Fetch error', err)
      setToursError('Failed to load tours. Please try again later.')
    } finally {
      setToursLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, countries, difficulty, perPage])

  const runInference = async () => {
    if (!query.trim()) return
    try {
      setIsInferring(true)
      const res = await fetch('/api/infer-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error('Inference failed')
      const payload = await res.json()
      const f = payload?.filters || {}
      if (f.startDate !== undefined) setStartDate(f.startDate || '')
      if (f.endDate !== undefined) setEndDate(f.endDate || '')
      if (Array.isArray(f.countries)) setCountries(f.countries)
      if (f.difficulty !== undefined) setDifficulty(f.difficulty || '')
      if (f.startDate || f.endDate || (Array.isArray(f.countries) && f.countries.length > 0) || f.difficulty) setFiltersOpen(true)
    } catch {
      // ignore
    } finally {
      setIsInferring(false)
    }
  }

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
                  placeholder="Search tours with a prompt..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void runInference() } }}
                  aria-label="Search"
                />
              </div>
              <div>
                <button
                  className="btn-primary"
                  disabled={isInferring || !query.trim()}
                  onClick={() => void runInference()}
                >
                  {isInferring ? 'Analyzing…' : 'Search'}
                </button>
              </div>
              <div className="md:ml-auto">
                <button
                  className="btn-secondary p-2 h-10 w-10 flex items-center justify-center"
                  onClick={() => setFiltersOpen((v) => !v)}
                  aria-expanded={filtersOpen}
                  aria-controls="filters-panel"
                  aria-label="Toggle filters"
                  title={filtersOpen ? 'Hide filters' : 'Show filters'}
                >
                  {filtersOpen ? (
                    // Chevron up
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 0 1 1.06 0l6 6a.75.75 0 1 1-1.06 1.06L12 9.31l-5.47 5.47a.75.75 0 0 1-1.06-1.06l6-6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    // Chevron down
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-6-6a.75.75 0 1 1 1.06-1.06L12 14.69l5.47-5.47a.75.75 0 0 1 1.06 1.06l-6 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Dropdown filters */}
            {filtersOpen && (
              <div id="filters-panel" className="mt-4 border-t pt-4 grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="form-label">Per Page</label>
                  <select className="form-input" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} aria-label="Per page">
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={18}>18</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start After</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">End Before</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Countries</label>
                  {countries.length === 0 ? (
                    <div className="text-sm text-secondary-600">Use the search prompt to infer countries (e.g., &quot;in Asia&quot;)</div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {countries.map((c) => (
                        <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {c}
                          <button
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={() => setCountries((prev) => prev.filter((x) => x !== c))}
                            aria-label={`Remove ${c}`}
                          >
                            ×
                          </button>
                  </span>
                      ))}
                    </div>
                  )}
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
                <div className="flex items-end justify-end">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setQuery('');
                      setStartDate('');
                      setEndDate('');
                      setCountries([]);
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