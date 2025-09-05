import React from 'react'

const ThemeContext = React.createContext({ mode: 'light', toggle: () => {} })

export function ThemeProvider({ children }) {
  const [mode, setMode] = React.useState(() => localStorage.getItem('themeMode') || 'light')

  React.useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('themeMode', mode)
  }, [mode])

  const toggle = React.useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = React.useMemo(() => ({ mode, toggle }), [mode, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeMode() {
  return React.useContext(ThemeContext)
}


