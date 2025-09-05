import React from 'react'
import { Button } from './ui/button.jsx'
import { Moon, Sun } from 'lucide-react'
import { useThemeMode } from '../context/ThemeProvider.jsx'

export default function ThemeToggle() {
  const { mode, toggle } = useThemeMode()
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
      {mode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}


