// ThemeContext.jsx
// Provides the active theme to the whole app.
// Any component can call useTheme() to get or change the theme.

import { createContext, useContext, useState, useEffect } from 'react'
import { THEMES, DEFAULT_THEME } from './themes.js'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // Load saved theme from localStorage, fall back to default
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('devarcade_theme') ?? DEFAULT_THEME
  })

  // Whenever themeId changes, apply all CSS variables to <html>
  useEffect(() => {
    const theme = THEMES[themeId]
    if (!theme) return

    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
      // Only apply entries that start with '--' (CSS variables)
      if (key.startsWith('--')) {
        root.style.setProperty(key, value)
      }
    })

    // Persist choice
    localStorage.setItem('devarcade_theme', themeId)
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Hook — call this anywhere you need theme access
export function useTheme() {
  return useContext(ThemeContext)
}