'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface TourListItem {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  start_date: string
  end_date: string
  created_at: string
}

export default function OrganizerToursListPage() {
  const { user, profile, loading } = useAuth()
  const [tours, setTours] = useState<TourListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== 'organizer') {
        if (typeof window !== 'undefined') {
          window.location.assign('/login')
        }
      } else {
        void fetchTours()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile])

  const fetchTours = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('tours')
        .select('id, title, status, start_date, end_date, created_at')
        .eq('organizer_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTours(data || [])
    } catch (err) {
      setError('Failed to load tours')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">My Tours</h1>
        <a href="/dashboard/organizer/tours/new" className="btn-primary">New Tour</a>
      </div>

      {isLoading ? (
        <div className="text-secondary-600">Loading...</div>
      ) : error ? (
        <div className="text-error-700">{error}</div>
      ) : tours.length === 0 ? (
        <div className="text-secondary-700">No tours yet. Create your first tour.</div>
      ) : (
        <div className="space-y-4">
          {tours.map((t) => (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-secondary-900">{t.title}</div>
                <div className="text-sm text-secondary-600">
                  {new Date(t.start_date).toLocaleDateString()} – {new Date(t.end_date).toLocaleDateString()}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800">
                    {t.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={`/tours/${t.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">View</a>
                <a href={`/dashboard/organizer/tours/${t.id}`} className="text-secondary-700 hover:text-secondary-900 text-sm">Edit</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}