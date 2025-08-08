'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'participant' | 'organizer' | 'admin'
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: 'participant' | 'organizer') => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AuthContext: useEffect triggered')

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: getSession', session)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: onAuthStateChange', event, session)
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      if (!session?.user) {
        setLoading(false)
      }
    })

    return () => {
      console.log('AuthContext: unsubscribing from auth changes')
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('AuthContext: fetchUserProfile', userId)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('AuthContext: Error fetching user profile:', error)
        setProfile(null) // Clear profile on error
      } else {
        console.log('AuthContext: Profile data:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('AuthContext: Error fetching user profile:', error)
      setProfile(null) // Clear profile on error
    } finally {
      console.log('AuthContext: fetchUserProfile finished')
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'participant' | 'organizer') => {
    try {
      setLoading(true)
      
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            role: role
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      // Handle network errors or configuration issues
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return { error: { message: 'Unable to connect to the server. Please check your internet connection and try again.' } }
        }
        if (error.message.includes('Supabase')) {
          return { error: { message: 'Configuration error. Please contact support.' } }
        }
      }
      return { error: { message: 'An unexpected error occurred. Please try again.' } }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        
        // Handle specific error cases with user-friendly messages
        if (error.message === 'Email not confirmed') {
          return { error: { message: 'Please check your email and click the confirmation link before signing in.' } }
        }
        if (error.message === 'Invalid login credentials') {
          return { error: { message: 'Invalid email or password. Please check your credentials and try again.' } }
        }
      }
      
      return { error }
    } catch (error) {
      console.error('Unexpected sign in error:', error)
      // Handle network errors or configuration issues
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return { error: { message: 'Unable to connect to the server. Please check your internet connection and try again.' } }
        }
        if (error.message.includes('Supabase')) {
          return { error: { message: 'Configuration error. Please contact support.' } }
        }
      }
      return { error: { message: 'An unexpected error occurred. Please try again.' } }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      // Refresh the page to reflect the signed-out state
      window.location.reload()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}