import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '../types'

export type Language = 'zh' | 'en'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
}

const LANGUAGE_KEY = 'jj_language'
const LanguageContext = createContext<LanguageContextValue | null>(null)

function initialLanguage(): Language {
  try {
    const requested = new URLSearchParams(window.location.search).get('lang')
    if (requested === 'en' || requested === 'zh') return requested
    return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'
  } catch {
    return 'zh'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage)

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = language === 'zh' ? '婉娘 · 锦江苏绣非遗体验' : 'Wanniang · Jinjiang Su Embroidery Experience'
    localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])

  const value = useMemo(() => ({ language, setLanguage }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

export function pick<T>(language: Language, zh: T, en: T) {
  return language === 'zh' ? zh : en
}

export function localizedUserName(user: Pick<User, 'name'>, _language: Language) {
  return user.name
}
