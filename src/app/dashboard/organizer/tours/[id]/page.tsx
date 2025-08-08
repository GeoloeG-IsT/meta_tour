'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import ImageUploader from '@/components/ImageUploader'

type TourStatus = 'draft' | 'published' | 'archived'

export default function EditTourPage() {
  const [tourId, setTourId] = useState<string | null>(null)
  const { user, profile, loading } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [status, setStatus] = useState<TourStatus>('draft')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Array<{
    id: string
    status: 'pending' | 'confirmed' | 'cancelled'
    payment_status: 'unpaid' | 'paid' | 'partial'
    created_at: string
    participant: { id: string; full_name: string | null }
  }>>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean)
      setTourId(segments[segments.length - 1] || null)
    }
    if (!loading) {
      if (!user || profile?.role !== 'organizer') {
        if (typeof window !== 'undefined') {
          window.location.assign('/login')
        }
      } else {
        void loadTour()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile])

  const loadTour = async () => {
    if (!tourId) return
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('organizer_id, title, description, start_date, end_date, price, currency, max_participants, status')
        .eq('id', tourId)
        .single()

      if (error) throw error
      if (!data || data.organizer_id !== user!.id) {
        if (typeof window !== 'undefined') {
          window.location.assign('/dashboard/organizer/tours')
        }
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setStartDate(data.start_date)
      setEndDate(data.end_date)
      setPrice(data.price)
      setCurrency(data.currency)
      setMaxParticipants(data.max_participants)
      setStatus(data.status)
    } catch (err) {
      setError('Failed to load tour')
    }
  }

  const loadBookings = async () => {
    if (!tourId) return
    try {
      setIsLoadingBookings(true)
      const { data, error } = await supabase
        .from('bookings')
        .select(
          `id, status, payment_status, created_at,
           participant:users!bookings_participant_id_fkey ( id, full_name )`
        )
        .eq('tour_id', tourId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookings(
        (data as any[])?.map((b) => ({
          id: b.id,
          status: b.status,
          payment_status: b.payment_status,
          created_at: b.created_at,
          participant: {
            id: b.participant?.id,
            full_name: b.participant?.full_name ?? null,
          },
        })) || []
      )
    } catch (err) {
      // non-fatal; keep bookings empty
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tourId) return
    setError(null)
    if (!title || !startDate || !endDate || !price || !maxParticipants) {
      setError('Please fill in all required fields')
      return
    }
    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('tours')
        .update({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          price: Number(price),
          currency,
          max_participants: Number(maxParticipants),
          status,
        })
        .eq('id', tourId)

      if (error) throw error
    } catch (err) {
      setError('Failed to save tour')
      return
    } finally {
      setIsSaving(false)
    }

    if (typeof window !== 'undefined') {
      window.location.assign('/dashboard/organizer/tours')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) return
    try {
      if (!tourId) return
      const { error } = await supabase.from('tours').delete().eq('id', tourId)
      if (error) throw error
      if (typeof window !== 'undefined') {
        window.location.assign('/dashboard/organizer/tours')
      }
    } catch (err) {
      setError('Failed to delete tour')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Edit Tour</h1>
        <button onClick={handleDelete} className="btn-error">Delete</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="form-label">Title</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Price</label>
            <input type="number" min={0} step="0.01" className="form-input" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UAH">UAH</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Max Participants</label>
            <input type="number" min={1} className="form-input" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))} required />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as TourStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <a href="/dashboard/organizer/tours" className="btn-secondary">Cancel</a>
          <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Images</h2>
        {tourId && (
          <ImageUploader tourId={tourId} onUploadComplete={() => { /* no-op, user can refresh section */ }} />
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-900">Bookings</h2>
          <button className="btn-secondary" onClick={loadBookings} disabled={isLoadingBookings}>
            {isLoadingBookings ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {isLoadingBookings ? (
          <div className="text-secondary-600">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="text-secondary-700">No bookings yet.</div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2 text-sm text-secondary-900">{b.participant.full_name || b.participant.id}</td>
                    <td className="px-4 py-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-200 text-secondary-800">
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-secondary-600">{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


