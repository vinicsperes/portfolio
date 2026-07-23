import { Analytics } from '@vercel/analytics/react'
import { Hero } from './components/Hero.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'

export default function App() {
  return (
    <LanguageProvider>
      <Hero />
      <Analytics />
    </LanguageProvider>
  )
}
