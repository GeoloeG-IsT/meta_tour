'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ConfirmContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <svg
            className="mx-auto h-12 w-auto text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Confirm your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a confirmation link to your email address:
          </p>
          {email && (
            <p className="mt-1 font-medium text-indigo-600">{email}</p>
          )}
          <p className="mt-4 text-sm text-gray-600">
            Please click the link in the email to complete your registration.
          </p>
        </div>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive an email? Check your spam folder or{' '}
            <button className="font-medium text-indigo-600 hover:text-indigo-500">
              resend the confirmation link
            </button>
            .
          </p>
        </div>
        <div className="mt-8">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div>Loading…</div></div>}>
      <ConfirmContent />
    </Suspense>
  )
}