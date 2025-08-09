import { supabase } from '@/lib/supabase'

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}


