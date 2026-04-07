import { create } from 'zustand'
import type {
  LoanProfile,
  Transaction,
  DailyBalance,
  AnalysisResult,
  Insight,
  ScenarioProjection,
  CashflowPattern,
  ProjectionConfig,
  ParseWarning,
  AppView,
} from '../types'

interface AppState {
  // Navigation
  currentView: AppView
  setCurrentView: (view: AppView) => void

  // Loan details
  loan: LoanProfile
  setLoan: (loan: Partial<LoanProfile>) => void

  // Import state
  transactions: Transaction[]
  setTransactions: (txns: Transaction[]) => void
  parseWarnings: ParseWarning[]
  setParseWarnings: (warnings: ParseWarning[]) => void
  detectedBank: string | null
  setDetectedBank: (bank: string | null) => void

  // Analysis
  dailyBalances: DailyBalance[]
  setDailyBalances: (balances: DailyBalance[]) => void
  analysisResult: AnalysisResult | null
  setAnalysisResult: (result: AnalysisResult | null) => void
  insights: Insight[]
  setInsights: (insights: Insight[]) => void

  // Projection
  cashflowPattern: CashflowPattern | null
  setCashflowPattern: (pattern: CashflowPattern | null) => void
  projectionConfig: ProjectionConfig
  setProjectionConfig: (config: Partial<ProjectionConfig>) => void
  scenarios: ScenarioProjection[]
  setScenarios: (scenarios: ScenarioProjection[]) => void

  // Calculator (manual mode)
  calcLoanAmount: number
  setCalcLoanAmount: (v: number) => void
  calcInterestRate: number
  setCalcInterestRate: (v: number) => void
  calcLoanTerm: number
  setCalcLoanTerm: (v: number) => void
  calcOffsetBalance: number
  setCalcOffsetBalance: (v: number) => void

  // Reset
  resetAnalysis: () => void
}

const defaultLoan: LoanProfile = {
  lender: '',
  originalAmount: 600000,
  currentBalance: 550000,
  startDate: new Date(new Date().getFullYear() - 3, 0, 1).toISOString().split('T')[0],
  termYears: 30,
  repaymentType: 'PI',
  rateHistory: [],
  annualRate: 0.0625,
}

const defaultProjectionConfig: ProjectionConfig = {
  projectionMonths: 12,
  salaryFrequency: 'monthly',
}

export const useStore = create<AppState>((set) => ({
  currentView: 'landing',
  setCurrentView: (view) => set({ currentView: view }),

  loan: defaultLoan,
  setLoan: (loan) => set((state) => ({ loan: { ...state.loan, ...loan } })),

  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  parseWarnings: [],
  setParseWarnings: (parseWarnings) => set({ parseWarnings }),
  detectedBank: null,
  setDetectedBank: (detectedBank) => set({ detectedBank }),

  dailyBalances: [],
  setDailyBalances: (dailyBalances) => set({ dailyBalances }),
  analysisResult: null,
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  insights: [],
  setInsights: (insights) => set({ insights }),

  cashflowPattern: null,
  setCashflowPattern: (cashflowPattern) => set({ cashflowPattern }),
  projectionConfig: defaultProjectionConfig,
  setProjectionConfig: (config) =>
    set((state) => ({ projectionConfig: { ...state.projectionConfig, ...config } })),
  scenarios: [],
  setScenarios: (scenarios) => set({ scenarios }),

  calcLoanAmount: 600000,
  setCalcLoanAmount: (calcLoanAmount) => set({ calcLoanAmount }),
  calcInterestRate: 6.25,
  setCalcInterestRate: (calcInterestRate) => set({ calcInterestRate }),
  calcLoanTerm: 30,
  setCalcLoanTerm: (calcLoanTerm) => set({ calcLoanTerm }),
  calcOffsetBalance: 50000,
  setCalcOffsetBalance: (calcOffsetBalance) => set({ calcOffsetBalance }),

  resetAnalysis: () =>
    set({
      transactions: [],
      parseWarnings: [],
      detectedBank: null,
      dailyBalances: [],
      analysisResult: null,
      insights: [],
      cashflowPattern: null,
      scenarios: [],
    }),
}))
