'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function NewTourPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [country, setCountry] = useState('')
  const [difficulty, setDifficulty] = useState<'easy'|'moderate'|'challenging'|'intense'|''>('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!loading && (!user || profile?.role !== 'organizer')) {
    router.push('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title || !startDate || !endDate || !price || !maxParticipants) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      const { data, error } = await supabase
        .from('tours')
        .insert({
          organizer_id: user!.id,
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          price: Number(price),
          currency,
          max_participants: Number(maxParticipants),
          country: country || null,
          difficulty: difficulty || null,
          status,
        })
        .select('id')
        .single()

      if (error) throw error

      router.push(`/dashboard/organizer/tours/${data!.id}`)
    } catch (err) {
      setError('Failed to create tour')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">Create New Tour</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Country</label>
            <input className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Nepal" />
          </div>
          <div>
            <label className="form-label">Difficulty</label>
            <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="">Select difficulty</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
              <option value="intense">Intense</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/organizer/tours')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Tour'}</button>
        </div>
      </form>
    </div>
  )
}