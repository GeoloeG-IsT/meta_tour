'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import TourCard from '@/components/TourCard'

interface Tour {
  id: string
  title: string
  start_date: string
  end_date: string
  price: number
  currency: string
  tour_images?: {
    image_url: string
    alt_text?: string
  }[]
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTours() {
      try {
        const { data, error } = await supabase
          .from('tours')
          .select(`
            id,
            title,
            start_date,
            end_date,
            price,
            currency,
            tour_images (
              image_url,
              alt_text
            )
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })

        if (error) throw error

        setTours(data || [])
      } catch (err) {
        console.error('Error fetching tours:', err)
        setError('Failed to load tours. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchTours()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-8">Discover Amazing Tours</h1>
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
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">Oops!</h1>
            <p className="text-secondary-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-8">Discover Amazing Tours</h1>
        
        {tours.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-secondary-600 mb-4">No tours available</h2>
            <p className="text-secondary-500">Check back later for new exciting adventures!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}