import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { GitCompare, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { ScenarioProjection } from '../types'

const formatAUD = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  return `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
}

export function Scenarios() {
  const { scenarios } = useStore()

  // Build unified chart data: one entry per month across all scenarios
  const chartData = useMemo(() => {
    if (!scenarios.length) return []
    const maxLen = Math.max(...scenarios.map((s) => s.monthlyData.length))
    const data: Array<Record<string, number | string>> = []
    for (let i = 0; i < maxLen; i++) {
      const entry: Record<string, number | string> = {}
      for (const s of scenarios) {
        const m = s.monthlyData[i]
        if (m) {
          entry.date = m.date
          entry.label = formatDateLabel(m.date)
          entry[s.id] = m.projectedBalance
        }
      }
      if (entry.date) data.push(entry)
    }
    return data
  }, [scenarios])

  // Year-based savings lookup helper
  const getYearSaving = (scenario: ScenarioProjection, years: number) => {
    const monthIndex = years * 12 - 1
    if (monthIndex < 0 || monthIndex >= scenario.monthlyData.length) return null
    return scenario.monthlyData[monthIndex].cumulativeSaving
  }

  if (!scenarios.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="card max-w-lg mx-auto">
          <GitCompare size={48} className="mx-auto text-text-muted mb-4" />
          <h2 className="section-title text-xl">No Scenarios Available</h2>
          <p className="text-text-secondary dark:text-slate-400 mt-2">
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="section-title">Scenario Comparison</h1>
        <p className="section-subtitle">
          Compare different strategies side by side to find the optimal approach
        </p>
      </div>

      {/* Multi-scenario Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Projected Offset Balance</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const label = payload[0]?.payload?.label
                    return (
                      <div className="card !p-3 !shadow-lg text-sm">
                        <p className="font-semibold text-text-primary dark:text-white mb-1">{label}</p>
                        {payload.map((entry) => {
                          const scenario = scenarios.find((s) => s.id === entry.dataKey)
                          return (
                            <p key={entry.dataKey as string} style={{ color: entry.color }}>
                              {scenario?.label ?? String(entry.dataKey)}: {formatAUD(entry.value as number)}
                            </p>
                          )
                        })}
                      </div>
                    )
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    const scenario = scenarios.find((s) => s.id === value)
                    return scenario?.label ?? value
                  }}
                />
                {scenarios.map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.id}
                    name={s.id}
                    stroke={s.color}
                    strokeWidth={s.isBaseline ? 3 : 2}
                    strokeDasharray={s.isBaseline ? undefined : '6 3'}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <div key={s.id} className="card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <h3 className="font-semibold text-text-primary dark:text-white truncate">{s.label}</h3>
              {s.isBaseline && <span className="badge-success ml-auto shrink-0">Baseline</span>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign size={14} /> Total Saving
                </span>
                <span className="font-semibold text-success">{formatAUD(s.totalSaving)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar size={14} /> Payoff Date
                </span>
                <span className="font-semibold text-text-primary dark:text-white">{s.loanPayoffDate}</span>
              </div>
              {s.vsBaseline && !s.isBaseline && (
                <>
                  <div className="pt-2 border-t border-border dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm text-text-secondary dark:text-slate-400">vs Baseline</span>
                    <span
                      className={`font-semibold ${
                        s.vsBaseline.savingDifference >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {s.vsBaseline.savingDifference >= 0 ? '+' : ''}
                      {formatAUD(s.vsBaseline.savingDifference)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary dark:text-slate-400 flex items-center gap-1.5">
                      <TrendingUp size={14} /> Months Earlier
                    </span>
                    <span className="font-semibold text-primary">
                      {s.vsBaseline.monthsEarlier > 0
                        ? `${s.vsBaseline.monthsEarlier} months`
                        : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="card overflow-x-auto">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-4">Detailed Comparison</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border dark:border-slate-700">
              <th className="text-left py-3 pr-4 text-text-secondary dark:text-slate-400 font-medium">Metric</th>
              {scenarios.map((s) => (
                <th key={s.id} className="text-right py-3 px-4 font-medium" style={{ color: s.color }}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-slate-700">
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Total Saving</td>
              {scenarios.map((s) => (
                <td key={s.id} className="py-3 px-4 text-right font-semibold text-text-primary dark:text-white">
                  {formatAUD(s.totalSaving)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Monthly Avg Saving</td>
              {scenarios.map((s) => (
                <td key={s.id} className="py-3 px-4 text-right font-semibold text-text-primary dark:text-white">
                  {s.monthlyData.length > 0
                    ? formatAUD(s.totalSaving / s.monthlyData.length)
                    : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Payoff Date</td>
              {scenarios.map((s) => (
                <td key={s.id} className="py-3 px-4 text-right font-semibold text-text-primary dark:text-white">
                  {s.loanPayoffDate}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Months Earlier</td>
              {scenarios.map((s) => (
                <td key={s.id} className="py-3 px-4 text-right font-semibold text-primary">
                  {s.vsBaseline ? `${s.vsBaseline.monthsEarlier}` : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Year 1 Saving</td>
              {scenarios.map((s) => {
                const val = getYearSaving(s, 1)
                return (
                  <td key={s.id} className="py-3 px-4 text-right font-semibold text-text-primary dark:text-white">
                    {val != null ? formatAUD(val) : '—'}
                  </td>
                )
              })}
            </tr>
            <tr>
              <td className="py-3 pr-4 text-text-secondary dark:text-slate-400">Year 5 Saving</td>
              {scenarios.map((s) => {
                const val = getYearSaving(s, 5)
                return (
                  <td key={s.id} className="py-3 px-4 text-right font-semibold text-text-primary dark:text-white">
                    {val != null ? formatAUD(val) : '—'}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="card bg-surface-alt dark:bg-slate-800/50">
        <p className="text-xs text-text-muted dark:text-slate-500 leading-relaxed">
          This analysis is prepared using OffsetIQ and is intended for general information and educational
          purposes only. It does not constitute financial advice, a recommendation, or an offer to engage
          in any transaction. The projections and scenarios shown are based on assumptions that may not
          reflect actual future outcomes. Interest calculations are approximations and may differ from
          your lender's methodology. Always consult a qualified financial adviser or mortgage broker
          before making financial decisions. Past performance and historical data do not guarantee future
          results.
        </p>
      </div>
    </div>
  )
}
