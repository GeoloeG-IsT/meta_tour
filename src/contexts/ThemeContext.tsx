'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as ThemeMode | null) : null
    if (saved) applyTheme(saved)
    else applyTheme('system')
  }, [])

  const applyTheme = (mode: ThemeMode) => {
    setThemeState(mode)
    if (typeof window === 'undefined') return
    localStorage.setItem('theme', mode)
    const root = document.documentElement
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldDark = mode === 'dark' || (mode === 'system' && sysDark)
    root.classList.toggle('dark', shouldDark)
  }

  const value = useMemo(() => ({ theme, setTheme: applyTheme }), [theme])

  // react to system theme change when in system mode
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const saved = (localStorage.getItem('theme') as ThemeMode | null) || 'system'
      if (saved === 'system') applyTheme('system')
    }
    media.addEventListener?.('change', handler)
    return () => media.removeEventListener?.('change', handler)
  }, [])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}


