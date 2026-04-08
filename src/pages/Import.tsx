import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle, ArrowRight, Database, Play } from 'lucide-react'
import { useStore } from '../store/useStore'
import { parseStatement } from '../lib/parsers'
import { reconstructDailyBalances } from '../lib/balance'
import { calculateInterest } from '../lib/interest'
import { extractCashflowPattern } from '../lib/projection'
import { generateInsights } from '../lib/insights'
import { buildScenarios } from '../lib/scenarios'
import { generateDemoTransactions } from '../lib/demoData'
import { showToast } from '../lib/toast'
import type { Transaction, ParseWarning } from '../types'

interface ImportProps {
  onNavigate: (view: string) => void
}

type Step = 'loan' | 'upload' | 'processing'

export function Import({ onNavigate }: ImportProps) {
  const {
    loan,
    setLoan,
    setTransactions,
    setParseWarnings,
    setDetectedBank,
    setDailyBalances,
    setAnalysisResult,
    setInsights,
    setCashflowPattern,
    setScenarios,
  } = useStore()

  const [step, setStep] = useState<Step>('loan')
  const [parsedTransactions, setParsedTransactions] = useState<Transaction[]>([])
  const [warnings, setWarnings] = useState<ParseWarning[]>([])
  const [bankName, setBankName] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Loan form state
  const [loanForm, setLoanForm] = useState({
    lender: loan.lender,
    originalAmount: loan.originalAmount,
    currentBalance: loan.currentBalance,
    startDate: loan.startDate,
    termYears: loan.termYears,
    repaymentType: loan.repaymentType,
    annualRate: loan.annualRate * 100,
  })

  const handleLoanFormChange = (field: string, value: string | number) => {
    setLoanForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLoanSubmit = () => {
    setLoan({
      lender: loanForm.lender,
      originalAmount: loanForm.originalAmount,
      currentBalance: loanForm.currentBalance,
      startDate: loanForm.startDate,
      termYears: loanForm.termYears,
      repaymentType: loanForm.repaymentType as 'PI' | 'IO',
      annualRate: loanForm.annualRate / 100,
    })
    setStep('upload')
  }

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text()
    const result = parseStatement(text, file.name)
    setParsedTransactions(result.transactions)
    setWarnings(result.warnings)
    setBankName(result.detectedBank ?? null)
    setDateRange(result.dateRange)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleLoadDemo = () => {
    const demoTxns = generateDemoTransactions()
    setParsedTransactions(demoTxns)
    setWarnings([])
    setBankName('Demo Bank (Sample Data)')
    if (demoTxns.length > 0) {
      setDateRange({
        start: demoTxns[0].date,
        end: demoTxns[demoTxns.length - 1].date,
      })
    }
    showToast(`Loaded ${demoTxns.length} demo transactions`, 'success')
  }

  const handleRunAnalysis = async () => {
    setIsProcessing(true)
    setStep('processing')

    // Use a microtask to allow the UI to update before heavy computation
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const currentLoan = {
        ...loan,
        lender: loanForm.lender,
        originalAmount: loanForm.originalAmount,
        currentBalance: loanForm.currentBalance,
        startDate: loanForm.startDate,
        termYears: loanForm.termYears,
        repaymentType: loanForm.repaymentType as 'PI' | 'IO',
        annualRate: loanForm.annualRate / 100,
      }

      // 1. Store transactions
      setTransactions(parsedTransactions)
      setParseWarnings(warnings)
      setDetectedBank(bankName)

      // 2. Reconstruct daily balances
      const balances = reconstructDailyBalances(parsedTransactions)
      setDailyBalances(balances)

      // 3. Calculate interest
      const analysis = calculateInterest(balances, currentLoan)
      setAnalysisResult(analysis)

      // 4. Extract cashflow pattern
      const pattern = extractCashflowPattern(parsedTransactions)
      setCashflowPattern(pattern)

      // 5. Build scenarios using the store's projectionConfig
      const currentConfig = useStore.getState().projectionConfig
      const scenarios = buildScenarios(balances, currentLoan, pattern, currentConfig)
      setScenarios(scenarios)

      // 6. Generate insights
      const insights = generateInsights(balances, currentLoan, analysis, pattern)
      setInsights(insights)

      // 8. Navigate to analysis view
      showToast('Analysis complete! Redirecting…', 'success')
      onNavigate('analysis')
    } catch (err) {
      console.error('Analysis failed:', err)
      showToast('Analysis failed. Please check your data.', 'error')
      setIsProcessing(false)
      setStep('upload')
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)

  // Step 1: Loan Details
  if (step === 'loan') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
        <div>
          <h1 className="section-title">Loan Details</h1>
          <p className="section-subtitle">Enter your home loan details to calculate offset savings accurately.</p>
        </div>

        <div className="card space-y-5">
          <div>
            <label className="label">Lender</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Commonwealth Bank"
              value={loanForm.lender}
              onChange={e => handleLoanFormChange('lender', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Original Amount</label>
              <input
                type="number"
                className="input-field"
                value={loanForm.originalAmount}
                onChange={e => handleLoanFormChange('originalAmount', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">Current Balance</label>
              <input
                type="number"
                className="input-field"
                value={loanForm.currentBalance}
                onChange={e => handleLoanFormChange('currentBalance', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={loanForm.startDate}
                onChange={e => handleLoanFormChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Term (Years)</label>
              <select
                className="input-field"
                value={loanForm.termYears}
                onChange={e => handleLoanFormChange('termYears', parseInt(e.target.value))}
              >
                {Array.from({ length: 26 }, (_, i) => i + 5).map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Repayment Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="repaymentType"
                  value="PI"
                  checked={loanForm.repaymentType === 'PI'}
                  onChange={() => handleLoanFormChange('repaymentType', 'PI')}
                  className="text-primary"
                />
                <span className="text-text-primary dark:text-slate-200">Principal & Interest</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="repaymentType"
                  value="IO"
                  checked={loanForm.repaymentType === 'IO'}
                  onChange={() => handleLoanFormChange('repaymentType', 'IO')}
                  className="text-primary"
                />
                <span className="text-text-primary dark:text-slate-200">Interest Only</span>
              </label>
            </div>
          </div>

          <div>
            <label className="label">Annual Interest Rate (%)</label>
            <input
              type="number"
              className="input-field"
              step="0.01"
              value={loanForm.annualRate}
              onChange={e => handleLoanFormChange('annualRate', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button className="btn-primary" onClick={handleLoanSubmit}>
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Processing
  if (step === 'processing') {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="card text-center py-16 space-y-4">
          <div className="animate-spin mx-auto w-12 h-12 border-4 border-primary dark:border-primary-light border-t-transparent rounded-full" />
          <h2 className="text-xl font-semibold text-text-primary dark:text-white">Analysing your data…</h2>
          <p className="text-text-secondary dark:text-slate-400">Reconstructing balances, calculating interest, and building projections.</p>
        </div>
      </div>
    )
  }

  // Step 2: File Upload & Preview
  const openingBalance = parsedTransactions.length > 0 ? parsedTransactions[0].runningBalance : 0
  const closingBalance = parsedTransactions.length > 0 ? parsedTransactions[parsedTransactions.length - 1].runningBalance : 0
  const previewTxns = parsedTransactions.slice(0, 20)

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Import Statement</h1>
          <p className="section-subtitle">Upload your offset account bank statement or load demo data to explore.</p>
        </div>
        <button className="btn-secondary" onClick={() => setStep('loan')}>
          ← Edit Loan
        </button>
      </div>

      {/* Drag & drop zone */}
      <div
        className={`card border-2 border-dashed transition-all duration-200 text-center py-12 cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-border dark:border-slate-600 hover:border-primary/40'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-text-muted'}`} />
        <p className="text-lg font-medium text-text-primary dark:text-white">
          {isDragging ? 'Drop your file here' : 'Drag & drop your statement file'}
        </p>
        <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">
          or click to browse • Supports .csv
        </p>
      </div>

      {/* Load Demo Button */}
      <div className="text-center">
        <button className="btn-accent" onClick={handleLoadDemo}>
          <Database className="w-4 h-4" />
          Load Demo Data
        </button>
      </div>

      {/* Parse Results */}
      {parsedTransactions.length > 0 && (
        <>
          {/* Bank detection & summary */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-text-primary">Import Summary</h2>
              </div>
              {bankName && (
                <span className="badge-success flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {bankName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-alt dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-text-secondary dark:text-slate-400">Transactions</p>
                <p className="text-xl font-bold text-text-primary dark:text-white">{parsedTransactions.length}</p>
              </div>
              <div className="bg-surface-alt dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-text-secondary dark:text-slate-400">Date Range</p>
                <p className="text-sm font-medium text-text-primary dark:text-white">
                  {dateRange?.start} → {dateRange?.end}
                </p>
              </div>
              <div className="bg-surface-alt dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-text-secondary dark:text-slate-400">Opening Balance</p>
                <p className="text-xl font-bold text-text-primary dark:text-white">{formatCurrency(openingBalance)}</p>
              </div>
              <div className="bg-surface-alt dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-text-secondary dark:text-slate-400">Closing Balance</p>
                <p className="text-xl font-bold text-text-primary dark:text-white">{formatCurrency(closingBalance)}</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-text-primary">Warnings ({warnings.length})</h3>
              </div>
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={w.type === 'discontinuity' || w.type === 'format' ? 'badge-danger' : 'badge-warning'}>
                      {w.type}
                    </span>
                    <span className="text-sm text-text-secondary">{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Preview */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-text-primary dark:text-white">
              Transaction Preview {parsedTransactions.length > 20 && `(showing 20 of ${parsedTransactions.length})`}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-slate-700">
                    <th className="text-left py-2 pr-4 text-text-secondary dark:text-slate-400 font-medium">Date</th>
                    <th className="text-left py-2 pr-4 text-text-secondary dark:text-slate-400 font-medium">Description</th>
                    <th className="text-right py-2 pr-4 text-text-secondary dark:text-slate-400 font-medium">Amount</th>
                    <th className="text-right py-2 text-text-secondary dark:text-slate-400 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {previewTxns.map((txn, i) => (
                    <tr key={i} className="border-b border-border/50 dark:border-slate-700/50">
                      <td className="py-2 pr-4 text-text-primary dark:text-slate-200 whitespace-nowrap">{txn.date}</td>
                      <td className="py-2 pr-4 text-text-primary dark:text-slate-200 truncate max-w-[250px]">{txn.description}</td>
                      <td className={`py-2 pr-4 text-right whitespace-nowrap font-medium ${
                        txn.amount >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap text-text-secondary">
                        {formatCurrency(txn.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Run Analysis Button */}
          <div className="flex justify-center">
            <button
              className="btn-primary text-lg py-3 px-8"
              onClick={handleRunAnalysis}
              disabled={isProcessing}
            >
              <Play className="w-5 h-5" />
              Run Analysis
            </button>
          </div>
        </>
      )}
    </div>
  )
}
