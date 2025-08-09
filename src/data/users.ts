import { supabase } from '@/lib/supabase'

export async function fetchUserProfile(userId: string) {
  return supabase.from('users').select('*').eq('id', userId).single()
}

export async function updateUserProfile(userId: string, payload: { full_name?: string; bio?: string; avatar_url?: string }) {
  return supabase.from('users').update(payload).eq('id', userId)
}


