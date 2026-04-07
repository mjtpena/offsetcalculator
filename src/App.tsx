import { useStore } from './store/useStore'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Landing } from './pages/Landing'
import { Calculator } from './pages/Calculator'
import { Import } from './pages/Import'
import { Analysis } from './pages/Analysis'
import { Projection } from './pages/Projection'
import { Scenarios } from './pages/Scenarios'
import type { AppView } from './types'

function App() {
  const { currentView, setCurrentView, analysisResult } = useStore()

  const handleNavigate = (view: string) => {
    setCurrentView(view as AppView)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    <div className="min-h-screen flex flex-col bg-surface-alt">
      {currentView !== 'landing' && (
        <Header
          currentView={currentView}
          onNavigate={handleNavigate}
          hasAnalysis={!!analysisResult}
        />
      )}
      <main className="flex-1">
        {renderView()}
      </main>
      <Footer />
    </div>
  )
}

export default App
