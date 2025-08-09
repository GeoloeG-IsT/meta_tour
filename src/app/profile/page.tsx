'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'

export default function MyProfilePage() {
  const { user, loading, profile, reloadProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      setEmail(user.email || '')
      setFullName(profile?.full_name || '')
      setBio(profile?.bio || '')
    }
  }, [loading, user, profile])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    try {
      setSaving(true)
      // Update users table (full_name, bio)
      const { error: upErr } = await supabase.from('users').update({ full_name: fullName, bio }).eq('id', user.id)
      if (upErr) throw upErr
      // Update auth email if changed
      if (email && email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email })
        if (authErr) throw authErr
      }
      await reloadProfile()
      setMessage('Profile updated')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    try {
      setChangingPassword(true)
      const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword })
      if (pwErr) throw pwErr
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password updated')
    } catch (e: any) {
      setError(e?.message || 'Failed to update password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-secondary-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">My Profile</h1>

        {message && <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">{message}</div>}
        {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSave} className="space-y-6 card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="form-label">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-secondary-500 text-sm">No img</div>
                )}
              </div>
              <label className="btn-secondary">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file || !user) return
                    try {
                      setUploading(true)
                      const path = `${user.id}/${Date.now()}_${file.name}`
                      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: false })
                      if (upErr) throw upErr
                      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path)
                      const newUrl = publicUrl.publicUrl
                      const { error: updateErr } = await supabase.from('users').update({ avatar_url: newUrl }).eq('id', user.id)
                      if (updateErr) throw updateErr
                      await reloadProfile()
                      setMessage('Avatar updated')
                    } catch (e: any) {
                      setError(e?.message || 'Failed to upload avatar')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
                {uploading ? 'Uploading…' : 'Upload'}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="form-label">Bio</label>
          <textarea className="form-input min-h-[120px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself" />
        </div>

        <div>
          <label className="form-label">Theme</label>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {(['light','dark','system'] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                onClick={() => setTheme(mode)}
                className={`px-3 py-2 rounded border text-sm ${theme === mode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-secondary-800 dark:text-secondary-100 border-secondary-200'}`}
              >
                {mode.replace(/^./, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
        </form>

        <div className="mt-10 card p-6">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-secondary" disabled={changingPassword}>{changingPassword ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}


