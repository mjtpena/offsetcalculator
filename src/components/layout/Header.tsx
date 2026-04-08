import { BarChart3, Calculator, Upload, TrendingUp, GitCompare, Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import type { AppView } from '../../types'

interface HeaderProps {
  currentView: AppView
  onNavigate: (view: AppView) => void
  hasAnalysis: boolean
}

const navItems: Array<{ view: AppView; label: string; icon: React.ReactNode; requiresAnalysis?: boolean }> = [
  { view: 'calculator', label: 'Calculator', icon: <Calculator size={18} /> },
  { view: 'import', label: 'Import', icon: <Upload size={18} /> },
  { view: 'analysis', label: 'Analysis', icon: <BarChart3 size={18} />, requiresAnalysis: true },
  { view: 'projection', label: 'Projection', icon: <TrendingUp size={18} />, requiresAnalysis: true },
  { view: 'scenarios', label: 'Scenarios', icon: <GitCompare size={18} />, requiresAnalysis: true },
]

export function Header({ currentView, onNavigate, hasAnalysis }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { resolved, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-50 glass border-b border-border dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary dark:text-white">Offset<span className="text-primary dark:text-primary-light">IQ</span></span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const disabled = item.requiresAnalysis && !hasAnalysis
              return (
                <button
                  key={item.view}
                  onClick={() => !disabled && onNavigate(item.view)}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentView === item.view
                      ? 'bg-primary/10 text-primary dark:text-primary-light'
                      : disabled
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-text-secondary dark:text-slate-400 hover:text-text-primary dark:hover:text-white hover:bg-surface-alt dark:hover:bg-slate-800'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="ml-2 p-2 rounded-lg text-text-secondary dark:text-slate-400 hover:bg-surface-alt dark:hover:bg-slate-800 transition-all duration-200"
              aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-text-secondary dark:text-slate-400"
              aria-label={resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={24} className="dark:text-white" /> : <Menu size={24} className="dark:text-white" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden py-3 border-t border-border dark:border-slate-700">
            {navItems.map((item) => {
              const disabled = item.requiresAnalysis && !hasAnalysis
              return (
                <button
                  key={item.view}
                  onClick={() => { if (!disabled) { onNavigate(item.view); setMobileOpen(false) } }}
                  disabled={disabled}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                    currentView === item.view ? 'bg-primary/10 text-primary dark:text-primary-light' : disabled ? 'text-text-muted' : 'text-text-secondary dark:text-slate-400'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
