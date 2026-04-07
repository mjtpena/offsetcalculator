import { BarChart3, Calculator, Upload, TrendingUp, GitCompare, Menu, X } from 'lucide-react'
import { useState } from 'react'
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

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BarChart3 size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">Offset<span className="text-primary">IQ</span></span>
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
                      ? 'bg-primary/10 text-primary'
                      : disabled
                      ? 'text-text-muted cursor-not-allowed'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden py-3 border-t border-border">
            {navItems.map((item) => {
              const disabled = item.requiresAnalysis && !hasAnalysis
              return (
                <button
                  key={item.view}
                  onClick={() => { if (!disabled) { onNavigate(item.view); setMobileOpen(false) } }}
                  disabled={disabled}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                    currentView === item.view ? 'bg-primary/10 text-primary' : disabled ? 'text-text-muted' : 'text-text-secondary'
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
