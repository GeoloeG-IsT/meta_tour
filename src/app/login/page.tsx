'use client'

import { Suspense, useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ConfigCheck from '@/components/ConfigCheck'
import { useI18n } from '@/contexts/I18nContext'
import { t } from '@/i18n'

function LoginContent() {
  const { locale } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const { signIn, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const redirectTo = useMemo(() => {
    const raw = searchParams.get('redirect') || '/'
    // prevent open redirect: only allow internal paths
    return raw.startsWith('/') ? raw : '/'
  }, [searchParams])

  useEffect(() => {
    // Check for success message from signup
    const messageParam = searchParams.get('message')
    if (messageParam) {
      setMessage(messageParam)
    }

    // Redirect if already logged in
    if (user) {
      router.push(redirectTo)
    }
  }, [user, router, searchParams, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    if (!email || !password) {
      setError(t(locale, 'login_fill_all'))
      setIsLoading(false)
      return
    }

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message || 'Invalid email or password')
      } else {
        // Redirect to intended page or home on successful login
        router.push(redirectTo)
      }
    } catch (err) {
      setError(t(locale, 'login_unexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t(locale, 'login_title')}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t(locale, 'login_subtitle')}</p>
        </div>
        
        <ConfigCheck />
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t(locale, 'login_email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t(locale, 'login_password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t(locale, 'common_loading') : t(locale, 'login_sign_in')}
            </button>
          </div>

          <div className="text-center">
              <span className="text-sm text-gray-600">
                {t(locale, 'login_no_account')}{' '}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">{t(locale, 'login_create_here')}</Link>
              </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Loading…</div></div>}>
      <LoginContent />
    </Suspense>
  )
}