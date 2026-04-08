import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  DollarSign,
  Clock,
  TrendingDown,
  Percent,
  Calculator as CalculatorIcon,
} from 'lucide-react'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'

const fmt = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const fmtFull = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderInputProps) {
  const fillPercent = ((value - min) / (max - min)) * 100
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <label className="label mb-0">{label}</label>
        <span className="text-sm font-semibold text-primary dark:text-primary-light">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg cursor-pointer"
        style={{ '--slider-fill': `${fillPercent}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-xs text-text-muted mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

interface MonthData {
  month: number
  balanceNoOffset: number
  balanceWithOffset: number
  interestNoOffset: number
  interestWithOffset: number
}

interface SimResult {
  monthlyRepayment: number
  totalInterestNoOffset: number
  totalInterestWithOffset: number
  totalSaved: number
  monthsWithoutOffset: number
  monthsWithOffset: number
  timeSavedMonths: number
  effectiveRate: number
  monthlyData: MonthData[]
  annualInterest: { year: number; withoutOffset: number; withOffset: number }[]
}

function simulate(
  loanAmount: number,
  annualRate: number,
  loanTermYears: number,
  offsetBalance: number,
  monthlyContribution: number
): SimResult {
  const r = annualRate / 100 / 12
  const n = loanTermYears * 12

  // Standard P&I repayment
  const monthlyRepayment =
    r > 0
      ? (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      : loanAmount / n

  const monthlyData: MonthData[] = []
  const annualInterestMap = new Map<
    number,
    { withoutOffset: number; withOffset: number }
  >()

  // Without offset
  let balNo = loanAmount
  let totalIntNo = 0
  let monthsNo = 0

  // With offset
  let balWith = loanAmount
  let totalIntWith = 0
  let monthsWith = 0
  let curOffset = offsetBalance

  const maxMonths = n + 120 // safety cap

  for (let m = 1; m <= maxMonths; m++) {
    const noFinished = balNo <= 0
    const withFinished = balWith <= 0
    if (noFinished && withFinished) break

    // Without offset
    let intNo = 0
    if (!noFinished) {
      intNo = balNo * r
      const principalNo = monthlyRepayment - intNo
      balNo = Math.max(0, balNo - principalNo)
      totalIntNo += intNo
      monthsNo = m
    }

    // With offset
    let intWith = 0
    if (!withFinished) {
      const effectivePrincipal = Math.max(0, balWith - curOffset)
      intWith = effectivePrincipal * r
      const principalWith = monthlyRepayment - intWith
      balWith = Math.max(0, balWith - principalWith)
      totalIntWith += intWith
      monthsWith = m
      curOffset += monthlyContribution
    }

    // Record yearly interest
    const year = Math.ceil(m / 12)
    const existing = annualInterestMap.get(year) || {
      withoutOffset: 0,
      withOffset: 0,
    }
    existing.withoutOffset += intNo
    existing.withOffset += intWith
    annualInterestMap.set(year, existing)

    // Sample monthly data (every month for small loans, sampled for large)
    if (m <= 12 || m % 3 === 0 || noFinished || withFinished) {
      monthlyData.push({
        month: m,
        balanceNoOffset: Math.round(balNo),
        balanceWithOffset: Math.round(balWith),
        interestNoOffset: Math.round(intNo),
        interestWithOffset: Math.round(intWith),
      })
    }
  }

  const timeSavedMonths = Math.max(0, monthsNo - monthsWith)

  // Effective rate: what rate on the full loan would produce the same interest as with offset
  const effectiveRate =
    loanAmount > 0
      ? (totalIntWith / totalIntNo) * annualRate
      : 0

  const annualInterest = Array.from(annualInterestMap.entries())
    .slice(0, 10)
    .map(([year, data]) => ({
      year,
      withoutOffset: Math.round(data.withoutOffset),
      withOffset: Math.round(data.withOffset),
    }))

  return {
    monthlyRepayment,
    totalInterestNoOffset: totalIntNo,
    totalInterestWithOffset: totalIntWith,
    totalSaved: totalIntNo - totalIntWith,
    monthsWithoutOffset: monthsNo,
    monthsWithOffset: monthsWith,
    timeSavedMonths,
    effectiveRate,
    monthlyData,
    annualInterest,
  }
}

function formatTimeSaved(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem} months`
  if (rem === 0) return `${years} year${years !== 1 ? 's' : ''}`
  return `${years}y ${rem}m`
}

const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--tooltip-bg, #ffffff)',
    border: '1px solid var(--tooltip-border, #e2e8f0)',
    borderRadius: '8px',
    fontSize: '13px',
  },
}

export function Calculator() {
  const [loanAmount, setLoanAmount] = useState(600_000)
  const [interestRate, setInterestRate] = useState(6.25)
  const [loanTerm, setLoanTerm] = useState(30)
  const [offsetBalance, setOffsetBalance] = useState(50_000)
  const [monthlyContribution, setMonthlyContribution] = useState(500)

  const result = useMemo(
    () =>
      simulate(
        loanAmount,
        interestRate,
        loanTerm,
        offsetBalance,
        monthlyContribution
      ),
    [loanAmount, interestRate, loanTerm, offsetBalance, monthlyContribution]
  )

  // Convert monthly data months to years for chart readability
  const balanceChartData = useMemo(
    () =>
      result.monthlyData.map((d) => ({
        year: +(d.month / 12).toFixed(1),
        'Without Offset': d.balanceNoOffset,
        'With Offset': d.balanceWithOffset,
      })),
    [result.monthlyData]
  )

  const monthlySavings = useMemo(() => {
    if (result.monthlyData.length < 2) return 0
    const first = result.monthlyData[0]
    return first.interestNoOffset - first.interestWithOffset
  }, [result.monthlyData])

  // Detect dark mode for chart colors
  const isDark = document.documentElement.classList.contains('dark')
  const gridColor = isDark ? '#334155' : '#e2e8f0'
  const tickColor = isDark ? '#94a3b8' : '#475569'

  return (
    <div className="min-h-screen bg-surface-alt dark:bg-[#0b1120]">
      {/* Header */}
      <div className="gradient-primary py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <CalculatorIcon className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">
              Offset Calculator
            </h1>
          </div>
          <p className="text-white/80 text-lg">
            See how your offset account reduces interest and shortens your loan
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-success/10">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <div>
              <AnimatedNumber
                value={result.totalSaved}
                format={(v) => fmt.format(v)}
                className="stat-value text-2xl !text-success"
              />
              <p className="stat-label">Total Interest Saved</p>
            </div>
          </div>
          <div className="card flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Clock className="w-6 h-6 text-primary dark:text-primary-light" />
            </div>
            <div>
              <p className="stat-value text-2xl">
                {formatTimeSaved(result.timeSavedMonths)}
              </p>
              <p className="stat-label">Time Saved</p>
            </div>
          </div>
          <div className="card flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-secondary/10">
              <TrendingDown className="w-6 h-6 text-secondary dark:text-secondary-light" />
            </div>
            <div>
              <AnimatedNumber
                value={monthlySavings}
                format={(v) => fmtFull.format(v)}
                className="stat-value text-2xl"
              />
              <p className="stat-label">Monthly Interest Savings</p>
            </div>
          </div>
          <div className="card flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-accent/10">
              <Percent className="w-6 h-6 text-accent" />
            </div>
            <div>
              <AnimatedNumber
                value={result.effectiveRate}
                format={(v) => `${v.toFixed(2)}%`}
                className="stat-value text-2xl"
              />
              <p className="stat-label">Effective Interest Rate</p>
            </div>
          </div>
        </div>

        {/* Main Content: Inputs + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left: Inputs */}
          <div className="lg:col-span-4">
            <div className="card sticky top-20">
              <h2 className="section-title text-xl mb-6">Loan Details</h2>

              <SliderInput
                label="Loan Amount"
                value={loanAmount}
                min={200_000}
                max={2_000_000}
                step={10_000}
                format={(v) => fmt.format(v)}
                onChange={setLoanAmount}
              />

              <SliderInput
                label="Interest Rate"
                value={interestRate}
                min={2}
                max={10}
                step={0.05}
                format={(v) => `${v.toFixed(2)}%`}
                onChange={setInterestRate}
              />

              <SliderInput
                label="Loan Term"
                value={loanTerm}
                min={5}
                max={30}
                step={1}
                format={(v) =>
                  `${v} year${v !== 1 ? 's' : ''}`
                }
                onChange={setLoanTerm}
              />

              <hr className="my-5 border-border dark:border-slate-700" />
              <h2 className="section-title text-xl mb-4">Offset Account</h2>

              <SliderInput
                label="Offset Balance"
                value={offsetBalance}
                min={0}
                max={500_000}
                step={5_000}
                format={(v) => fmt.format(v)}
                onChange={setOffsetBalance}
              />

              <SliderInput
                label="Monthly Contribution"
                value={monthlyContribution}
                min={0}
                max={5_000}
                step={50}
                format={(v) => fmt.format(v)}
                onChange={setMonthlyContribution}
              />
            </div>
          </div>

          {/* Right: Results and Charts */}
          <div className="lg:col-span-8 space-y-6">
            {/* Repayment Summary */}
            <div className="card">
              <h2 className="section-title text-xl mb-4">
                Repayment Summary
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-surface-alt dark:bg-slate-800/50">
                  <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">
                    Monthly Repayment
                  </p>
                  <p className="text-xl font-bold text-text-primary dark:text-white">
                    {fmtFull.format(result.monthlyRepayment)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-surface-alt dark:bg-slate-800/50">
                  <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">
                    Total Interest (No Offset)
                  </p>
                  <p className="text-xl font-bold text-danger">
                    {fmt.format(result.totalInterestNoOffset)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-surface-alt dark:bg-slate-800/50">
                  <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">
                    Total Interest (With Offset)
                  </p>
                  <p className="text-xl font-bold text-success">
                    {fmt.format(result.totalInterestWithOffset)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
                  <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">
                    Loan Paid Off In
                  </p>
                  <p className="text-xl font-bold text-primary dark:text-primary-light">
                    {formatTimeSaved(result.monthsWithOffset)}{' '}
                    <span className="text-sm font-normal text-text-muted">
                      (vs {formatTimeSaved(result.monthsWithoutOffset)})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Area Chart: Loan Balance Over Time */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
                  Loan Balance Over Time
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="year"
                        label={{
                          value: 'Years',
                          position: 'insideBottomRight',
                          offset: -5,
                          style: { fontSize: 12, fill: tickColor },
                        }}
                        tick={{ fontSize: 12, fill: tickColor }}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                        tick={{ fontSize: 12, fill: tickColor }}
                      />
                      <Tooltip
                        {...chartTooltipStyle}
                        formatter={(value: unknown) => fmt.format(value as number)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="Without Offset"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="With Offset"
                        stroke="#0f766e"
                        fill="#0f766e"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Annual Interest Comparison */}
              <div className="card">
                <h3 className="text-lg font-semibold text-text-primary dark:text-white mb-4">
                  Annual Interest (First 10 Years)
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.annualInterest}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis
                        dataKey="year"
                        label={{
                          value: 'Year',
                          position: 'insideBottomRight',
                          offset: -5,
                          style: { fontSize: 12, fill: tickColor },
                        }}
                        tick={{ fontSize: 12, fill: tickColor }}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          `$${(v / 1000).toFixed(0)}k`
                        }
                        tick={{ fontSize: 12, fill: tickColor }}
                      />
                      <Tooltip
                        {...chartTooltipStyle}
                        formatter={(value: unknown) => fmt.format(value as number)}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar
                        dataKey="withoutOffset"
                        name="Without Offset"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="withOffset"
                        name="With Offset"
                        fill="#0f766e"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
