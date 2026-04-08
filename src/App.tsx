import { useState, useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Landing } from './pages/Landing'
import { Calculator } from './pages/Calculator'
import { Import } from './pages/Import'
import { Analysis } from './pages/Analysis'
import { Projection } from './pages/Projection'
import { Scenarios } from './pages/Scenarios'
import { ToastContainer } from './components/ui/Toast'
import type { AppView } from './types'

function App() {
  const { currentView, setCurrentView, analysisResult } = useStore()
  const [viewKey, setViewKey] = useState(0)
  const mainRef = useRef<HTMLElement>(null)

  const handleNavigate = (view: string) => {
    setCurrentView(view as AppView)
    setViewKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Re-trigger animation on view change
  useEffect(() => {
    const main = mainRef.current
    if (!main) return
    main.classList.remove('view-enter')
    // Force reflow
    void main.offsetHeight
    main.classList.add('view-enter')
  }, [viewKey])

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} />
      case 'calculator':
        return <Calculator />
      case 'import':
        return <Import onNavigate={handleNavigate} />
      case 'analysis':
        return <Analysis onNavigate={handleNavigate} />
      case 'projection':
        return <Projection onNavigate={handleNavigate} />
      case 'scenarios':
        return <Scenarios />
      default:
        return <Landing onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-alt dark:bg-[#0b1120]">
      {currentView !== 'landing' && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          hasAnalysis={!!analysisResult}
        />
      )}
      <main id="main-content" ref={mainRef} className="flex-1 view-enter">
        {renderView()}
      </main>
      <Footer />
      <ToastContainer />
    </div>
  )
}

export default App
