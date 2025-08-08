'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string | null
  role: 'participant' | 'organizer' | 'admin' | string
  created_at: string
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = useMemo(() => (Array.isArray(params.id) ? params.id[0] : params.id), [params.id])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, role, created_at')
          .eq('id', userId)
          .maybeSingle()
        if (error) throw error
        setProfile((data as any) || null)
      } catch (e) {
        setError('Profile not found')
      } finally {
        setIsLoading(false)
      }
    }
    if (userId) void loadProfile()
  }, [userId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><div>Loading profile...</div></div>
    )
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center"><div className="text-secondary-700">{error || 'Profile not found'}</div></div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-secondary-900">{profile.full_name || 'User'}</h1>
      <div className="mt-2 text-secondary-600">Role: {profile.role}</div>
      <div className="mt-1 text-secondary-600">Member since: {new Date(profile.created_at).toLocaleDateString()}</div>
    </div>
  )
}


