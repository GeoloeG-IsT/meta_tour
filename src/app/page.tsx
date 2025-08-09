'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import TourFiltersBar from '@/components/filters/TourFiltersBar'
import { fetchPublishedTours } from '@/data/tours'
import { SORT_OPTIONS } from '@/constants/tours'
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
  const [sort, setSort] = useState<string>('newest')

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

  // Repository-backed fetch builder (range applied later)
  const buildQuery = () => fetchPublishedTours({ startDate, endDate, countries, difficulty, sort: mapSort(sort) }, undefined)

  function mapSort(value: string) {
    const found = SORT_OPTIONS.find((o) => o.value === value)
    return found ? { column: found.column, ascending: found.ascending } : { column: 'created_at', ascending: false }
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
        filters: { startDate, endDate, difficulty, countries: countriesLower, sort },
        pagination: { from, to, perPage, prevOffset: offset },
      })
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const { data, error } = await fetchPublishedTours({ startDate, endDate, countries, difficulty, sort: mapSort(sort) }, { from, to })
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
  }, [startDate, endDate, countries, difficulty, perPage, sort])

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
      // Optional: auto-choose sort to soonest start date if dates are present
      if (f.startDate || f.endDate) setSort('start_date_asc')
    } catch {
      // ignore
    } finally {
      setIsInferring(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">

      {/* Main Content */}
      <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters + Tours grid */}
        <div className="w-full max-w-7xl mx-auto">
          <TourFiltersBar
            value={{ query, filters: { startDate, endDate, countries, difficulty, perPage, sort } }}
            onChange={(next) => {
              if (next.query !== undefined) setQuery(next.query)
              if (next.filters) {
                if (next.filters.startDate !== undefined) setStartDate(next.filters.startDate)
                if (next.filters.endDate !== undefined) setEndDate(next.filters.endDate)
                if (next.filters.countries !== undefined) setCountries(next.filters.countries)
                if (next.filters.difficulty !== undefined) setDifficulty(next.filters.difficulty)
                if (next.filters.perPage !== undefined) setPerPage(next.filters.perPage)
                if (next.filters.sort !== undefined) setSort(next.filters.sort)
              }
            }}
            onSearch={() => runInference()}
            isSearching={isInferring}
            onClear={() => { setQuery(''); setStartDate(''); setEndDate(''); setCountries([]); setDifficulty(''); setPerPage(9); }}
          />

          {toursLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="card p-6 animate-pulse">
                    <div className="h-48 bg-secondary-300 rounded mb-4"></div>
                    <div className="h-6 bg-secondary-300 rounded mb-2"></div>
                    <div className="h-4 bg-secondary-300 rounded mb-2"></div>
                    <div className="h-4 bg-secondary-300 rounded w-1/2"></div>
          </div>
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