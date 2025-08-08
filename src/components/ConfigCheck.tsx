'use client'

import { useEffect, useState } from 'react'

interface ConfigStatus {
  hasUrl: boolean
  hasKey: boolean
  urlValid: boolean
  canConnect: boolean
  error?: string
}

export default function ConfigCheck() {
  const [status, setStatus] = useState<ConfigStatus | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const hasUrl = !!supabaseUrl
      const hasKey = !!supabaseKey
      const urlValid = hasUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project')

      let canConnect = false
      let error: string | undefined

      if (hasUrl && hasKey && urlValid) {
        try {
          // Try to make a simple request to check connectivity
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          })
          canConnect = response.status !== 404 // 404 means we can connect but endpoint doesn't exist (which is expected)
        } catch (err) {
          error = err instanceof Error ? err.message : 'Connection failed'
        }
      }

      setStatus({
        hasUrl,
        hasKey,
        urlValid,
        canConnect,
        error
      })
    } catch (err) {
      setStatus({
        hasUrl: false,
        hasKey: false,
        urlValid: false,
        canConnect: false,
        error: err instanceof Error ? err.message : 'Configuration check failed'
      })
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800 text-sm">Checking configuration...</span>
        </div>
      </div>
    )
  }

  if (!status) return null

  const allGood = status.hasUrl && status.hasKey && status.urlValid && status.canConnect

  if (allGood) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-800 text-sm font-medium">Supabase configuration is valid</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex items-start">
        <svg className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-800 text-sm font-medium">Supabase Configuration Issues</h3>
          <div className="mt-2 text-red-700 text-sm">
            <ul className="list-disc list-inside space-y-1">
              {!status.hasUrl && (
                <li>Missing NEXT_PUBLIC_SUPABASE_URL in .env.local</li>
              )}
              {!status.hasKey && (
                <li>Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local</li>
              )}
              {status.hasUrl && !status.urlValid && (
                <li>Invalid Supabase URL (should start with https:// and not contain placeholder text)</li>
              )}
              {status.hasUrl && status.hasKey && status.urlValid && !status.canConnect && (
                <li>Cannot connect to Supabase (check your project URL and key)</li>
              )}
              {status.error && (
                <li>Error: {status.error}</li>
              )}
            </ul>
          </div>
          <div className="mt-3">
            <p className="text-red-700 text-sm">
              Please check the <strong>SETUP.md</strong> file for detailed configuration instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}