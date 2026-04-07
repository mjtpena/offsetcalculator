import type { DailyBalance, LoanProfile, CashflowPattern, ProjectionConfig, ScenarioProjection, ProjectionMonth } from '../types'
import { projectForward } from './projection'

export function buildScenarios(
  dailyBalances: DailyBalance[],
  loan: LoanProfile,
  pattern: CashflowPattern,
  config: ProjectionConfig
): ScenarioProjection[] {
  // 1. Current Trajectory (baseline)
  const baselineData = projectForward(dailyBalances, loan, pattern, config)
  const baseline: ScenarioProjection = {
    id: 'current-trajectory',
    label: 'Current Trajectory',
    isBaseline: true,
    monthlyData: baselineData,
    totalSaving: baselineData.length > 0 ? baselineData[baselineData.length - 1].cumulativeSaving : 0,
    loanPayoffDate: estimatePayoffDate(baselineData, loan),
    color: '#0f766e',
  }

  // 2. Salary Parked in Offset — assumes full salary stays in offset for ~2 weeks each pay cycle
  const salaryParkedPattern: CashflowPattern = {
    ...pattern,
    avgNetSavings: Math.round(pattern.avgNetSavings + pattern.salaryAmount * 0.3),
  }
  const salaryParkedData = projectForward(dailyBalances, loan, salaryParkedPattern, config)
  const salaryParked: ScenarioProjection = {
    id: 'salary-parked',
    label: 'Salary Parked in Offset',
    isBaseline: false,
    monthlyData: salaryParkedData,
    totalSaving: salaryParkedData.length > 0 ? salaryParkedData[salaryParkedData.length - 1].cumulativeSaving : 0,
    loanPayoffDate: estimatePayoffDate(salaryParkedData, loan),
    color: '#3b82f6',
    vsBaseline: computeVsBaseline(baselineData, salaryParkedData, baseline.loanPayoffDate),
  }

  // 3. Tax Return Lump Sum ($5,000 annually in July)
  const lumpSumEvents: Array<{ date: string; amount: number; label: string }> = []
  const now = new Date()
  for (let y = 0; y <= Math.ceil(config.projectionMonths / 12); y++) {
    const year = now.getFullYear() + y
    const julyDate = `${year}-07-01`
    lumpSumEvents.push({ date: julyDate, amount: 5000, label: `Tax Return ${year}` })
  }
  const taxReturnConfig: ProjectionConfig = {
    ...config,
    lumpSumEvents: [...(config.lumpSumEvents || []), ...lumpSumEvents],
  }
  const taxReturnData = projectForward(dailyBalances, loan, pattern, taxReturnConfig)
  const taxReturn: ScenarioProjection = {
    id: 'tax-return',
    label: 'Tax Return Lump Sum',
    isBaseline: false,
    monthlyData: taxReturnData,
    totalSaving: taxReturnData.length > 0 ? taxReturnData[taxReturnData.length - 1].cumulativeSaving : 0,
    loanPayoffDate: estimatePayoffDate(taxReturnData, loan),
    color: '#f59e0b',
    vsBaseline: computeVsBaseline(baselineData, taxReturnData, baseline.loanPayoffDate),
  }

  // 4. Rate Rise +0.50% — shows increased savings from offset at higher rate
  const rateRiseLoan: LoanProfile = {
    ...loan,
    annualRate: loan.annualRate + 0.5,
  }
  const rateRiseData = projectForward(dailyBalances, rateRiseLoan, pattern, config)
  const rateRise: ScenarioProjection = {
    id: 'rate-rise',
    label: 'Rate Rise +0.50%',
    isBaseline: false,
    monthlyData: rateRiseData,
    totalSaving: rateRiseData.length > 0 ? rateRiseData[rateRiseData.length - 1].cumulativeSaving : 0,
    loanPayoffDate: estimatePayoffDate(rateRiseData, loan),
    color: '#ef4444',
    vsBaseline: computeVsBaseline(baselineData, rateRiseData, baseline.loanPayoffDate),
  }

  return [baseline, salaryParked, taxReturn, rateRise]
}

function estimatePayoffDate(data: ProjectionMonth[], loan: LoanProfile): string {
  // Find the month where loan balance reaches 0
  for (const month of data) {
    if (month.loanBalance <= 0) {
      return month.date
    }
  }

  // Extrapolate if not paid off within projection
  if (data.length < 2) {
    const years = loan.termYears
    const payoff = new Date()
    payoff.setFullYear(payoff.getFullYear() + years)
    return payoff.toISOString().split('T')[0]
  }

  const lastTwo = data.slice(-2)
  const monthlyReduction = lastTwo[0].loanBalance - lastTwo[1].loanBalance
  if (monthlyReduction <= 0) {
    const payoff = new Date()
    payoff.setFullYear(payoff.getFullYear() + loan.termYears)
    return payoff.toISOString().split('T')[0]
  }

  const remainingMonths = Math.ceil(lastTwo[1].loanBalance / monthlyReduction)
  const lastDate = new Date(data[data.length - 1].date)
  lastDate.setMonth(lastDate.getMonth() + remainingMonths)
  return lastDate.toISOString().split('T')[0]
}

function computeVsBaseline(
  baselineData: ProjectionMonth[],
  scenarioData: ProjectionMonth[],
  baselinePayoff: string
): { savingDifference: number; monthsEarlier: number } {
  const baselineSaving = baselineData.length > 0 ? baselineData[baselineData.length - 1].cumulativeSaving : 0
  const scenarioSaving = scenarioData.length > 0 ? scenarioData[scenarioData.length - 1].cumulativeSaving : 0
  const savingDifference = Math.round((scenarioSaving - baselineSaving) * 100) / 100

  const scenarioPayoff = estimatePayoffFromData(scenarioData)
  const basePayoffDate = new Date(baselinePayoff)
  const scenPayoffDate = new Date(scenarioPayoff)

  const monthsEarlier = Math.round(
    (basePayoffDate.getTime() - scenPayoffDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )

  return { savingDifference, monthsEarlier }
}

function estimatePayoffFromData(data: ProjectionMonth[]): string {
  for (const month of data) {
    if (month.loanBalance <= 0) return month.date
  }

  if (data.length < 2) return new Date(Date.now() + 30 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const lastTwo = data.slice(-2)
  const reduction = lastTwo[0].loanBalance - lastTwo[1].loanBalance
  if (reduction <= 0) return new Date(Date.now() + 30 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const remaining = Math.ceil(lastTwo[1].loanBalance / reduction)
  const lastDate = new Date(data[data.length - 1].date)
  lastDate.setMonth(lastDate.getMonth() + remaining)
  return lastDate.toISOString().split('T')[0]
}
