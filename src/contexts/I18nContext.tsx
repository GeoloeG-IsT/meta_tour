'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Locale, detectBrowserLocale, supportedLocales } from '@/i18n/config'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('locale') as Locale | null) : null
    if (saved && (supportedLocales as readonly string[]).includes(saved)) {
      setLocaleState(saved)
    } else {
      setLocaleState(detectBrowserLocale())
    }
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    if (typeof window !== 'undefined') localStorage.setItem('locale', l)
  }

  const value = useMemo(() => ({ locale, setLocale }), [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}


