import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
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
  TrendingDown,
  DollarSign,
  Percent,
  Lightbulb,
  Clock,
  AlertTriangle,
  Target,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import type { Insight } from '../types'

const formatAUD = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

const insightConfig: Record<Insight['type'], { icon: typeof Lightbulb; color: string; bg: string }> = {
  efficiency: { icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
  timing: { icon: Clock, color: 'text-secondary', bg: 'bg-secondary/10' },
  opportunity: { icon: Lightbulb, color: 'text-amber-600', bg: 'bg-amber-50' },
  milestone: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
  risk: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10' },
}

interface AnalysisProps {
  onNavigate: (view: string) => void
}

export function Analysis({ onNavigate }: AnalysisProps) {
  const { analysisResult, dailyBalances, insights, loan, transactions } = useStore()

  const dailyChartData = useMemo(() => {
    if (!dailyBalances.length) return []
    // Sample to max ~180 points for performance
    const step = Math.max(1, Math.floor(dailyBalances.length / 180))
    return dailyBalances
      .filter((_, i) => i % step === 0 || i === dailyBalances.length - 1)
      .map((d) => ({
        date: d.date,
        balance: d.balance,
        isInterpolated: d.isInterpolated,
        label: formatDate(d.date),
      }))
  }, [dailyBalances])

  const monthlyChartData = useMemo(() => {
    if (!analysisResult) return []
    return analysisResult.monthlyBreakdown.map((m) => ({
      month: formatDate(m.month),
      interestCharged: m.interestCharged,
      interestSaved: m.interestSaved,
      avgBalance: m.avgOffsetBalance,
    }))
  }, [analysisResult])

  if (!analysisResult) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="card max-w-lg mx-auto">
          <TrendingDown size={48} className="mx-auto text-text-muted mb-4" />
          <h2 className="section-title text-xl">No Analysis Available</h2>
          <p className="text-text-secondary mt-2">
            Import your transaction data first to see analysis results.
          </p>
          <button className="btn-primary mt-6" onClick={() => onNavigate('import')}>
            Import Transactions
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  const { totalSaved, totalInterestPaid, totalInterestWithoutOffset, efficiencyScore } = analysisResult

  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tickColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-title">Interest Analysis</h1>
        <p className="section-subtitle">
          How your offset account has saved you money on{' '}
          {loan.lender ? `your ${loan.lender} loan` : 'your home loan'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign size={18} className="text-success" />
            </div>
            <span className="stat-label !mt-0">Total Interest Saved</span>
          </div>
          <AnimatedNumber
            value={totalSaved}
            format={(v) => formatAUD(v)}
            className="text-3xl font-bold text-success"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingDown size={18} className="text-primary dark:text-primary-light" />
            </div>
            <span className="stat-label !mt-0">Interest With Offset</span>
          </div>
          <AnimatedNumber
            value={totalInterestPaid}
            format={(v) => formatAUD(v)}
            className="stat-value"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <TrendingUp size={18} className="text-text-secondary dark:text-slate-400" />
            </div>
            <span className="stat-label !mt-0">Interest Without Offset</span>
          </div>
          <AnimatedNumber
            value={totalInterestWithoutOffset}
            format={(v) => formatAUD(v)}
            className="text-3xl font-bold text-text-secondary dark:text-slate-400"
          />
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Percent size={18} className="text-primary dark:text-primary-light" />
            </div>
            <span className="stat-label !mt-0">Efficiency Score</span>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedNumber
              value={efficiencyScore * 100}
              format={(v) => `${v.toFixed(1)}%`}
              className="stat-value"
            />
            <span
              className={
                efficiencyScore >= 0.7
                  ? 'badge-success'
                  : efficiencyScore >= 0.4
                  ? 'badge-warning'
                  : 'badge-danger'
              }
            >
              {efficiencyScore >= 0.7 ? 'Excellent' : efficiencyScore >= 0.4 ? 'Good' : 'Low'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Balance Chart */}
      {dailyChartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Daily Offset Balance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null
                    const d = payload[0].payload as (typeof dailyChartData)[0]
                    return (
                      <div className="card !p-3 !shadow-lg text-sm">
                        <p className="font-semibold text-text-primary">{d.date}</p>
                        <p className="text-primary font-medium">{formatAUD(d.balance)}</p>
                        {d.isInterpolated && (
                          <p className="text-text-muted text-xs">Interpolated</p>
                        )}
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Interest Comparison */}
      {monthlyChartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Monthly Interest Comparison</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="card !p-3 !shadow-lg text-sm">
                        <p className="font-semibold text-text-primary mb-1">{label}</p>
                        {payload.map((entry) => (
                          <p key={entry.dataKey as string} style={{ color: entry.color }}>
                            {entry.name}: {formatAUD(entry.value as number)}
                          </p>
                        ))}
                      </div>
                    )
                  }}
                />
                <Legend />
                <Bar dataKey="interestCharged" name="Interest Charged" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interestSaved" name="Interest Saved" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Offset Balance Trend */}
      {monthlyChartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Monthly Offset Balance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: tickColor }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.[0]) return null
                    return (
                      <div className="card !p-3 !shadow-lg text-sm">
                        <p className="font-semibold text-text-primary">{label}</p>
                        <p className="text-primary font-medium">
                          Avg Balance: {formatAUD(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgBalance"
                  name="Avg Offset Balance"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={{ fill: '#0f766e', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight) => {
              const config = insightConfig[insight.type]
              const Icon = config.icon
              return (
                <div key={insight.id} className="card-hover">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={20} className={config.color} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary dark:text-white">{insight.headline}</h3>
                      <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">{insight.detail}</p>
                      {insight.annualSavingImpact != null && (
                        <p className="text-sm font-medium text-success mt-2">
                          Annual impact: {formatAUD(insight.annualSavingImpact)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Calendar size={16} />
          <span>
            {analysisResult.periodStart} — {analysisResult.periodEnd} ·{' '}
            {transactions.length} transactions analyzed
          </span>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('projection')}>
          View Projections
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
