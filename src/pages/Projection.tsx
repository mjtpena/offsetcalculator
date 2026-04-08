import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { buildScenarios } from '../lib/scenarios'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'

const formatAUD = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const PERIOD_OPTIONS = [6, 12, 24, 36]

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
}

interface ProjectionProps {
  onNavigate: (view: string) => void
}

export function Projection({ onNavigate }: ProjectionProps) {
  const {
    scenarios,
    setScenarios,
    cashflowPattern,
    projectionConfig,
    setProjectionConfig,
    loan,
    dailyBalances,
  } = useStore()

  const [lumpSumDate, setLumpSumDate] = useState('')
  const [lumpSumAmount, setLumpSumAmount] = useState('')
  const [lumpSumLabel, setLumpSumLabel] = useState('')
  const [rateChangeDate, setRateChangeDate] = useState('')
  const [rateChangeRate, setRateChangeRate] = useState('')

  const baseline = useMemo(
    () => scenarios.find((s) => s.isBaseline) ?? scenarios[0],
    [scenarios],
  )

  const projectionChartData = useMemo(() => {
    if (!baseline) return []
    return baseline.monthlyData.map((m) => ({
      date: m.date,
      label:
        MONTH_LABELS[new Date(m.date).getMonth()] +
        ' ' +
        String(new Date(m.date).getFullYear()).slice(2),
      projectedBalance: m.projectedBalance,
      cumulativeSaving: m.cumulativeSaving,
      loanBalance: m.loanBalance,
    }))
  }, [baseline])

  const spendingChartData = useMemo(() => {
    if (!cashflowPattern) return []
    return cashflowPattern.monthlySpendingByMonth.map((amount, i) => ({
      month: MONTH_LABELS[i],
      spending: amount,
    }))
  }, [cashflowPattern])

  // Summary stats from baseline scenario
  const projectedSavings12 = baseline?.totalSaving ?? 0
  const monthlySavings = cashflowPattern?.avgNetSavings ?? 0
  const payoffDate = baseline?.loanPayoffDate ?? '—'
  const monthsSaved = baseline?.vsBaseline?.monthsEarlier ?? 0

  const handleAddLumpSum = useCallback(() => {
    if (!lumpSumDate || !lumpSumAmount) return
    const existing = projectionConfig.lumpSumEvents ?? []
    setProjectionConfig({
      lumpSumEvents: [
        ...existing,
        { date: lumpSumDate, amount: Number(lumpSumAmount), label: lumpSumLabel || 'Lump Sum' },
      ],
    })
    setLumpSumDate('')
    setLumpSumAmount('')
    setLumpSumLabel('')
  }, [lumpSumDate, lumpSumAmount, lumpSumLabel, projectionConfig.lumpSumEvents, setProjectionConfig])

  const handleRemoveLumpSum = useCallback(
    (index: number) => {
      const existing = projectionConfig.lumpSumEvents ?? []
      setProjectionConfig({
        lumpSumEvents: existing.filter((_, i) => i !== index),
      })
    },
    [projectionConfig.lumpSumEvents, setProjectionConfig],
  )

  const handleAddRateChange = useCallback(() => {
    if (!rateChangeDate || !rateChangeRate) return
    const existing = projectionConfig.rateChangeEvents ?? []
    setProjectionConfig({
      rateChangeEvents: [
        ...existing,
        { date: rateChangeDate, newRate: Number(rateChangeRate) / 100 },
      ],
    })
    setRateChangeDate('')
    setRateChangeRate('')
  }, [rateChangeDate, rateChangeRate, projectionConfig.rateChangeEvents, setProjectionConfig])

  const handleRemoveRateChange = useCallback(
    (index: number) => {
      const existing = projectionConfig.rateChangeEvents ?? []
      setProjectionConfig({
        rateChangeEvents: existing.filter((_, i) => i !== index),
      })
    },
    [projectionConfig.rateChangeEvents, setProjectionConfig],
  )

  // Rebuild scenarios when projectionConfig changes
  useEffect(() => {
    if (!dailyBalances.length || !cashflowPattern) return
    const updatedScenarios = buildScenarios(dailyBalances, loan, cashflowPattern, projectionConfig)
    setScenarios(updatedScenarios)
  }, [projectionConfig, dailyBalances, loan, cashflowPattern, setScenarios])

  if (!scenarios.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="card max-w-lg mx-auto">
          <TrendingUp size={48} className="mx-auto text-text-muted mb-4" />
          <h2 className="section-title text-xl">No Projection Data</h2>
          <p className="text-text-secondary dark:text-slate-400 mt-2">
          </p>
          <button className="btn-primary mt-6" onClick={() => onNavigate('analysis')}>
            Go to Analysis
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-title">Forward Projection</h1>
        <p className="section-subtitle">
          Projected offset balance and savings over the next {projectionConfig.projectionMonths} months
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign size={18} className="text-success" />
            </div>
            <span className="stat-label !mt-0">Projected Savings</span>
          </div>
          <AnimatedNumber
            value={projectedSavings12}
            format={(v) => formatAUD(v)}
            className="text-3xl font-bold text-success"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary dark:text-primary-light" />
            </div>
            <span className="stat-label !mt-0">Monthly Savings Rate</span>
          </div>
          <AnimatedNumber
            value={monthlySavings}
            format={(v) => formatAUD(v)}
            className="stat-value"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Calendar size={18} className="text-secondary dark:text-secondary-light" />
            </div>
            <span className="stat-label !mt-0">Est. Payoff Date</span>
          </div>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{payoffDate}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-success" />
            </div>
            <span className="stat-label !mt-0">Months Saved</span>
          </div>
          <p className="text-3xl font-bold text-success">
            {monthsSaved > 0 ? `${monthsSaved} mo` : '—'}
          </p>
        </div>
      </div>

      {/* Projection Chart */}
      {projectionChartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Projected Offset Balance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionChartData}>
                <defs>
                  <linearGradient id="projBalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="balance"
                  tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="loan"
                  orientation="right"
                  tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as (typeof projectionChartData)[0]
                    return (
                      <div className="card !p-3 !shadow-lg text-sm">
                        <p className="font-semibold text-text-primary dark:text-white mb-1">{d.label}</p>
                        <p className="text-primary">Balance: {formatAUD(d.projectedBalance)}</p>
                        <p className="text-text-secondary dark:text-slate-400">Loan: {formatAUD(d.loanBalance)}</p>
                        <p className="text-success">Saved: {formatAUD(d.cumulativeSaving)}</p>
                      </div>
                    )
                  }}
                />
                <Legend />
                <Area
                  yAxisId="balance"
                  type="monotone"
                  dataKey="projectedBalance"
                  name="Offset Balance"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#projBalGradient)"
                />
                <Line
                  yAxisId="loan"
                  type="monotone"
                  dataKey="loanBalance"
                  name="Loan Balance"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cashflow Pattern */}
      {cashflowPattern && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Cashflow Pattern</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-700">
                <span className="text-text-secondary dark:text-slate-400">Salary</span>
                <span className="font-semibold text-text-primary dark:text-white">
                  {formatAUD(cashflowPattern.salaryAmount)}{' '}
                  <span className="text-sm text-text-muted">
                    ({FREQUENCY_LABELS[cashflowPattern.salaryFrequency]})
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-700">
                <span className="text-text-secondary dark:text-slate-400">Avg Monthly Income</span>
                <span className="font-semibold text-success">
                  {formatAUD(cashflowPattern.avgMonthlyIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border dark:border-slate-700">
                <span className="text-text-secondary dark:text-slate-400">Avg Monthly Expenses</span>
                <span className="font-semibold text-danger">
                  {formatAUD(cashflowPattern.avgMonthlyExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-text-secondary dark:text-slate-400">Net Savings</span>
                <span className="font-semibold text-primary">
                  {formatAUD(cashflowPattern.avgNetSavings)}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-2">Monthly Spending Pattern</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                      tickLine={false}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.[0]) return null
                        return (
                          <div className="card !p-3 !shadow-lg text-sm">
                            <p className="font-semibold text-text-primary dark:text-white">{label}</p>
                            <p className="text-primary">{formatAUD(payload[0].value as number)}</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="spending" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projection Controls */}
      <div className="card">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Projection Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Period */}
          <div>
            <label className="label">Projection Period</label>
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map((months) => (
                <button
                  key={months}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    projectionConfig.projectionMonths === months
                      ? 'bg-primary text-white'
                      : 'bg-surface-alt dark:bg-slate-700 text-text-secondary dark:text-slate-300 hover:bg-primary/10'
                  }`}
                  onClick={() => setProjectionConfig({ projectionMonths: months })}
                >
                  {months}mo
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Savings Override */}
          <div>
            <label className="label" htmlFor="monthlySavings">Monthly Savings Override</label>
            <input
              id="monthlySavings"
              type="number"
              className="input-field"
              placeholder={cashflowPattern ? String(Math.round(cashflowPattern.avgNetSavings)) : '0'}
              value={projectionConfig.monthlyNetSavings ?? ''}
              onChange={(e) =>
                setProjectionConfig({
                  monthlyNetSavings: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>

          {/* Salary Override */}
          <div>
            <label className="label" htmlFor="salaryOverride">Salary Override</label>
            <input
              id="salaryOverride"
              type="number"
              className="input-field"
              placeholder={cashflowPattern ? String(Math.round(cashflowPattern.salaryAmount)) : '0'}
              value={projectionConfig.salaryAmount ?? ''}
              onChange={(e) =>
                setProjectionConfig({
                  salaryAmount: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Lump Sum Events */}
        <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
          <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-3">Lump Sum Events</h3>
          {(projectionConfig.lumpSumEvents ?? []).map((ev, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 text-sm">
              <span className="text-text-secondary dark:text-slate-400">{ev.date}</span>
              <span className="font-medium text-text-primary dark:text-white">{formatAUD(ev.amount)}</span>
              <span className="text-text-muted">{ev.label}</span>
              <button
                onClick={() => handleRemoveLumpSum(i)}
                className="text-danger hover:text-red-700 ml-auto"
                aria-label="Remove lump sum event"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-2">
            <input
              type="date"
              className="input-field !w-auto"
              value={lumpSumDate}
              onChange={(e) => setLumpSumDate(e.target.value)}
            />
            <input
              type="number"
              className="input-field !w-32"
              placeholder="Amount"
              value={lumpSumAmount}
              onChange={(e) => setLumpSumAmount(e.target.value)}
            />
            <input
              type="text"
              className="input-field !w-40"
              placeholder="Label (optional)"
              value={lumpSumLabel}
              onChange={(e) => setLumpSumLabel(e.target.value)}
            />
            <button className="btn-secondary" onClick={handleAddLumpSum}>
              <Plus size={16} /> Add Lump Sum
            </button>
          </div>
        </div>

        {/* Rate Change Events */}
        <div className="mt-6 pt-6 border-t border-border dark:border-slate-700">
          <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-3">Rate Change Events</h3>
          {(projectionConfig.rateChangeEvents ?? []).map((ev, i) => (
            <div key={i} className="flex items-center gap-3 mb-2 text-sm">
              <span className="text-text-secondary dark:text-slate-400">{ev.date}</span>
              <span className="font-medium text-text-primary dark:text-white">{(ev.newRate * 100).toFixed(2)}%</span>
              <button
                onClick={() => handleRemoveRateChange(i)}
                className="text-danger hover:text-red-700 ml-auto"
                aria-label="Remove rate change event"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 mt-2">
            <input
              type="date"
              className="input-field !w-auto"
              value={rateChangeDate}
              onChange={(e) => setRateChangeDate(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              className="input-field !w-32"
              placeholder="Rate %"
              value={rateChangeRate}
              onChange={(e) => setRateChangeRate(e.target.value)}
            />
            <button className="btn-secondary" onClick={handleAddRateChange}>
              <Plus size={16} /> Add Rate Change
            </button>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-text-secondary dark:text-slate-400">
          {formatAUD(loan.currentBalance)} remaining
        </p>
        <button className="btn-primary" onClick={() => onNavigate('scenarios')}>
          Compare Scenarios
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
