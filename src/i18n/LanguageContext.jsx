import { createContext, useContext, useEffect, useState } from 'react'
import { content } from '../content/index.js'

const LanguageContext = createContext(null)

function detectLang() {
  try {
    const saved = localStorage.getItem('vp.lang')
    if (saved === 'pt' || saved === 'en') return saved
  } catch { /* private mode */ }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectLang)

  useEffect(() => {
    try {
      localStorage.setItem('vp.lang', lang)
    } catch { /* private mode */ }
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: content[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
