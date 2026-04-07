export interface LoanProfile {
  lender: string
  originalAmount: number
  currentBalance: number
  startDate: string
  termYears: number
  repaymentType: 'PI' | 'IO'
  rateHistory: RateEvent[]
  annualRate: number
}

export interface RateEvent {
  effectiveDate: string
  annualRate: number
}

export interface Transaction {
  date: string
  description: string
  amount: number // positive = credit, negative = debit
  runningBalance: number
  category?: string
  isRecurring?: boolean
}

export interface DailyBalance {
  date: string
  balance: number
  isInterpolated: boolean
}

export interface ParseResult {
  transactions: Transaction[]
  warnings: ParseWarning[]
  detectedBank?: string
  dateRange: { start: string; end: string }
}

export interface ParseWarning {
  type: 'gap' | 'duplicate' | 'discontinuity' | 'format'
  message: string
  line?: number
}

export interface MonthlyResult {
  month: string
  avgOffsetBalance: number
  interestCharged: number
  interestSaved: number
  loanBalance: number
}

export interface AnalysisResult {
  periodStart: string
  periodEnd: string
  totalInterestPaid: number
  totalInterestWithoutOffset: number
  totalSaved: number
  efficiencyScore: number
  monthlyBreakdown: MonthlyResult[]
}

export interface Insight {
  id: string
  type: 'efficiency' | 'timing' | 'opportunity' | 'milestone' | 'risk'
  headline: string
  detail: string
  annualSavingImpact?: number
}

export interface ProjectionMonth {
  date: string
  projectedBalance: number
  cumulativeSaving: number
  loanBalance: number
  interestSaved: number
}

export interface ScenarioProjection {
  id: string
  label: string
  isBaseline: boolean
  monthlyData: ProjectionMonth[]
  totalSaving: number
  loanPayoffDate: string
  color: string
  vsBaseline?: {
    savingDifference: number
    monthsEarlier: number
  }
}

export interface CashflowPattern {
  avgMonthlyIncome: number
  avgMonthlyExpenses: number
  avgNetSavings: number
  salaryFrequency: 'weekly' | 'fortnightly' | 'monthly'
  salaryAmount: number
  monthlySpendingByMonth: number[] // 12 entries, Jan=0
}

export interface ProjectionConfig {
  projectionMonths: number
  salaryAmount?: number
  salaryFrequency?: 'weekly' | 'fortnightly' | 'monthly'
  monthlyNetSavings?: number
  lumpSumEvents?: Array<{ date: string; amount: number; label: string }>
  rateChangeEvents?: Array<{ date: string; newRate: number }>
}

export type AppView = 'landing' | 'calculator' | 'import' | 'analysis' | 'projection' | 'scenarios'
