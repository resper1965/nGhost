import { useState, useCallback, useEffect } from 'react'
import en from '@/locales/en.json'
import ptBR from '@/locales/pt-BR.json'
import es from '@/locales/es.json'

type Locale = 'en' | 'pt-BR' | 'es'
type Translations = typeof en

const translations: Record<Locale, Translations> = {
  'en': en,
  'pt-BR': ptBR,
  'es': es
}

const localeNames: Record<Locale, string> = {
  'en': 'English',
  'pt-BR': 'Português',
  'es': 'Español'
}

const LOCALE_KEY = 'nghost-locale'

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let result: unknown = obj
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return path // Return path if not found
    }
  }
  
  return typeof result === 'string' ? result : path
}

/**
 * Hook for internationalization
 */
export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCALE_KEY) as Locale
      if (saved && translations[saved]) {
        return saved
      }
      
      // Detect browser language
      const browserLang = navigator.language
      if (browserLang.startsWith('pt')) return 'pt-BR'
      if (browserLang.startsWith('es')) return 'es'
    }
    return 'pt-BR' // Default
  })

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_KEY, newLocale)
      document.documentElement.lang = newLocale
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key)
    
    // Replace params
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(`{${paramKey}}`, paramValue)
      }
    }
    
    return text
  }, [locale])

  return {
    locale,
    setLocale,
    t,
    localeNames,
    availableLocales: Object.keys(translations) as Locale[]
  }
}

export type { Locale, Translations }
export { localeNames }
