'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function MyProfilePage() {
  const { user, loading, profile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      setEmail(user.email || '')
      setFullName(profile?.full_name || '')
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
      // Update users table (full_name)
      const { error: upErr } = await supabase.from('users').update({ full_name: fullName }).eq('id', user.id)
      if (upErr) throw upErr
      // Update auth email if changed
      if (email && email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email })
        if (authErr) throw authErr
      }
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-secondary-900 mb-6">My Profile</h1>

      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-secondary-900 mb-4">Change Password</h2>
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
  )
}


