export const supportedLocales = ['en', 'fr', 'de', 'uk', 'ru', 'es', 'it'] as const
export type Locale = typeof supportedLocales[number]

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.toLowerCase() || 'en'
  const primary = lang.split('-')[0]
  return (supportedLocales as readonly string[]).includes(primary) ? (primary as Locale) : 'en'
}


