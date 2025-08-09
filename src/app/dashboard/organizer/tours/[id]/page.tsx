'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'
import { updateTour, deleteTour } from '@/data/tours'
import ImageUploader from '@/components/ImageUploader'
import { fetchBookingsForTour } from '@/data/bookings'

type TourStatus = 'draft' | 'published' | 'archived'

export default function EditTourPage() {
  const router = useRouter()
  const [tourId, setTourId] = useState<string | null>(null)
  const { user, profile, loading } = useAuth()
  const { locale } = useI18n()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState<'easy'|'moderate'|'challenging'|'intense'|''>('')
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
        router.push('/login')
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
        .select('organizer_id, title, description, start_date, end_date, price, currency, max_participants, country, difficulty, status')
        .eq('id', tourId)
        .single()

      if (error) throw error
      if (!data || data.organizer_id !== user!.id) {
        router.push('/dashboard/organizer/tours')
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setStartDate(data.start_date)
      setEndDate(data.end_date)
      setPrice(data.price)
      setCurrency(data.currency)
      setMaxParticipants(data.max_participants)
      setCountry(data.country || '')
      setDifficulty((data.difficulty as any) || '')
      setStatus(data.status)
    } catch (err) {
      setError(t(locale, 'tour_load_failed') || 'Failed to load tour')
    }
  }

  const loadBookings = async () => {
    if (!tourId) return
    try {
      setIsLoadingBookings(true)
      const { data, error } = await fetchBookingsForTour(tourId)
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
      const { error } = await updateTour(tourId, {
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        price: Number(price),
        currency,
        max_participants: Number(maxParticipants),
        country: country || null,
        difficulty: (difficulty || null) as any,
        status: status as 'draft' | 'published' | 'archived',
      })

      if (error) throw error
    } catch (err) {
      setError(t(locale, 'tour_save_failed') || 'Failed to save tour')
      return
    } finally {
      setIsSaving(false)
    }

    router.push('/dashboard/organizer/tours')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) return
    try {
      if (!tourId) return
      const { error } = await deleteTour(tourId)
      if (error) throw error
      router.push('/dashboard/organizer/tours')
    } catch (err) {
      setError(t(locale, 'tour_delete_failed') || 'Failed to delete tour')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t(locale, 'org_edit_title')}</h1>
        <button onClick={handleDelete} className="btn-error">{t(locale, 'org_delete')}</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="form-label">{t(locale, 'org_field_title')}</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="form-label">{t(locale, 'org_field_description')}</label>
          <textarea className="form-input" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t(locale, 'org_field_start_date')}</label>
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">{t(locale, 'org_field_end_date')}</label>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t(locale, 'org_field_price')}</label>
            <input type="number" min={0} step="0.01" className="form-input" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
          </div>
          <div>
            <label className="form-label">{t(locale, 'org_field_currency')}</label>
            <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="UAH">UAH</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t(locale, 'org_field_max_participants')}</label>
            <input type="number" min={1} className="form-input" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))} required />
          </div>
          <div>
            <label className="form-label">{t(locale, 'org_field_status')}</label>
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as TourStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t(locale, 'org_field_country')}</label>
            <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Nepal" />
          </div>
          <div>
            <label className="form-label">{t(locale, 'org_field_difficulty')}</label>
            <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="">{t(locale, 'select_difficulty')}</option>
              <option value="easy">{t(locale, 'difficulty_easy')}</option>
              <option value="moderate">{t(locale, 'difficulty_moderate')}</option>
              <option value="challenging">{t(locale, 'difficulty_challenging')}</option>
              <option value="intense">{t(locale, 'difficulty_intense')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <a href="/dashboard/organizer/tours" className="btn-secondary">{t(locale, 'org_cancel')}</a>
          <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? t(locale, 'org_saving') : t(locale, 'org_save_changes')}</button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">{t(locale, 'org_images_title')}</h2>
        {tourId && (
          <ImageUploader tourId={tourId} onUploadComplete={() => { /* no-op, user can refresh section */ }} />
        )}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-secondary-900">{t(locale, 'org_bookings_title')}</h2>
          <button className="btn-secondary" onClick={loadBookings} disabled={isLoadingBookings}>
            {isLoadingBookings ? t(locale, 'org_bookings_refreshing') : t(locale, 'org_bookings_refresh')}
          </button>
        </div>
        {isLoadingBookings ? (
          <div className="text-secondary-600">{t(locale, 'org_bookings_loading')}</div>
        ) : bookings.length === 0 ? (
          <div className="text-secondary-700">{t(locale, 'org_bookings_empty')}</div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(locale, 'org_tbl_participant')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(locale, 'org_tbl_status')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(locale, 'org_tbl_payment')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(locale, 'org_tbl_created')}</th>
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


