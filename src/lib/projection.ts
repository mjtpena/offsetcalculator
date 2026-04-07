import { parseISO, addMonths, format, getMonth, differenceInCalendarDays } from 'date-fns';
import type {
  Transaction, DailyBalance, LoanProfile,
  CashflowPattern, ProjectionConfig, ProjectionMonth,
} from '../types';

// ─── Cashflow pattern extraction ────────────────────────────────

function detectSalaryFrequency(
  incomes: { date: string; amount: number }[],
): { frequency: 'weekly' | 'fortnightly' | 'monthly'; amount: number } {
  if (incomes.length < 2) {
    return { frequency: 'monthly', amount: incomes[0]?.amount ?? 0 };
  }

  // Sort by date
  const sorted = [...incomes].sort((a, b) => a.date.localeCompare(b.date));

  // Compute gaps between income events
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(differenceInCalendarDays(parseISO(sorted[i].date), parseISO(sorted[i - 1].date)));
  }

  const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;

  // Classify and compute amount
  if (avgGap <= 9) {
    // Weekly
    const avgAmount = sorted.reduce((s, i) => s + i.amount, 0) / sorted.length;
    return { frequency: 'weekly', amount: Math.round(avgAmount * 100) / 100 };
  } else if (avgGap <= 18) {
    // Fortnightly
    const avgAmount = sorted.reduce((s, i) => s + i.amount, 0) / sorted.length;
    return { frequency: 'fortnightly', amount: Math.round(avgAmount * 100) / 100 };
  } else {
    // Monthly
    const avgAmount = sorted.reduce((s, i) => s + i.amount, 0) / sorted.length;
    return { frequency: 'monthly', amount: Math.round(avgAmount * 100) / 100 };
  }
}

export function extractCashflowPattern(transactions: Transaction[]): CashflowPattern {
  if (transactions.length === 0) {
    return {
      avgMonthlyIncome: 0, avgMonthlyExpenses: 0, avgNetSavings: 0,
      salaryFrequency: 'monthly', salaryAmount: 0,
      monthlySpendingByMonth: new Array(12).fill(0),
    };
  }

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Separate income vs expenses
  const incomes: { date: string; amount: number }[] = [];
  const expenses: { date: string; amount: number }[] = [];

  for (const txn of sorted) {
    if (txn.amount > 0) {
      incomes.push({ date: txn.date, amount: txn.amount });
    } else {
      expenses.push({ date: txn.date, amount: Math.abs(txn.amount) });
    }
  }

  // Group by month for averages
  const monthlyIncome = new Map<string, number>();
  const monthlyExpense = new Map<string, number>();
  const monthlySpending = new Array(12).fill(0);
  const monthCounts = new Array(12).fill(0);

  for (const inc of incomes) {
    const key = inc.date.slice(0, 7);
    monthlyIncome.set(key, (monthlyIncome.get(key) ?? 0) + inc.amount);
  }
  for (const exp of expenses) {
    const key = exp.date.slice(0, 7);
    monthlyExpense.set(key, (monthlyExpense.get(key) ?? 0) + exp.amount);
    const m = getMonth(parseISO(exp.date));
    monthlySpending[m] += exp.amount;
    monthCounts[m] += 1;
  }

  const numMonths = new Set([...monthlyIncome.keys(), ...monthlyExpense.keys()]).size || 1;

  const totalIncome = [...monthlyIncome.values()].reduce((s, v) => s + v, 0);
  const totalExpense = [...monthlyExpense.values()].reduce((s, v) => s + v, 0);
  const avgMonthlyIncome = totalIncome / numMonths;
  const avgMonthlyExpenses = totalExpense / numMonths;

  // Detect large recurring income as salary
  const largeIncomes = incomes.filter(i => i.amount > avgMonthlyIncome * 0.3);
  const salary = detectSalaryFrequency(largeIncomes.length > 0 ? largeIncomes : incomes);

  // Normalise monthly spending (average per calendar month across years)
  const yearsSpan = numMonths / 12 || 1;
  const normalisedSpending = monthlySpending.map((total, i) => {
    const count = monthCounts[i] > 0 ? yearsSpan : 1;
    return total / count;
  });

  // Normalise so they sum to avgMonthlyExpenses * 12
  const spendingSum = normalisedSpending.reduce((s, v) => s + v, 0);
  const scaleFactor = spendingSum > 0 ? (avgMonthlyExpenses * 12) / spendingSum : 1;
  const scaledSpending = normalisedSpending.map(v => Math.round(v * scaleFactor * 100) / 100);

  return {
    avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
    avgMonthlyExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
    avgNetSavings: Math.round((avgMonthlyIncome - avgMonthlyExpenses) * 100) / 100,
    salaryFrequency: salary.frequency,
    salaryAmount: salary.amount,
    monthlySpendingByMonth: scaledSpending,
  };
}

// ─── Forward projection ─────────────────────────────────────────

export function projectForward(
  dailyBalances: DailyBalance[],
  loan: LoanProfile,
  pattern: CashflowPattern,
  config: ProjectionConfig,
): ProjectionMonth[] {
  if (dailyBalances.length === 0) return [];

  // Start from the last known balance
  const lastDay = dailyBalances[dailyBalances.length - 1];
  let currentBalance = lastDay.balance;
  let loanBalance = loan.currentBalance;
  let currentRate = loan.annualRate;
  let cumulativeSaving = 0;

  const startDate = parseISO(lastDay.date);
  const results: ProjectionMonth[] = [];

  // Determine monthly net inflow
  const netSavings = config.monthlyNetSavings ?? pattern.avgNetSavings;

  // Precompute lump sum lookup
  const lumpSumByMonth = new Map<string, number>();
  if (config.lumpSumEvents) {
    for (const ev of config.lumpSumEvents) {
      const key = ev.date.slice(0, 7);
      lumpSumByMonth.set(key, (lumpSumByMonth.get(key) ?? 0) + ev.amount);
    }
  }

  // Precompute rate change lookup
  const rateChanges = new Map<string, number>();
  if (config.rateChangeEvents) {
    for (const ev of config.rateChangeEvents) {
      rateChanges.set(ev.date.slice(0, 7), ev.newRate);
    }
  }

  // P&I monthly payment (recalculated when rate changes)
  function calcMonthlyPayment(balance: number, rate: number, remainingMonths: number): number {
    if (loan.repaymentType === 'IO') return balance * (rate / 100 / 12);
    const mr = rate / 100 / 12;
    if (mr === 0) return remainingMonths > 0 ? balance / remainingMonths : 0;
    return balance * (mr * Math.pow(1 + mr, remainingMonths)) / (Math.pow(1 + mr, remainingMonths) - 1);
  }

  const totalMonths = loan.termYears * 12;
  const elapsedMonths = Math.round(
    differenceInCalendarDays(startDate, parseISO(loan.startDate)) / 30.44,
  );

  for (let m = 1; m <= config.projectionMonths; m++) {
    const projDate = addMonths(startDate, m);
    const monthKey = format(projDate, 'yyyy-MM');
    const calMonth = getMonth(projDate); // 0-11

    // Apply rate change
    if (rateChanges.has(monthKey)) {
      currentRate = rateChanges.get(monthKey)!;
    }

    // Seasonality factor from cashflow pattern
    const avgExpense = pattern.avgMonthlyExpenses || 1;
    const seasonalExpense = pattern.monthlySpendingByMonth[calMonth] || avgExpense;
    const seasonalAdjustment = seasonalExpense - avgExpense;

    // Monthly net change in offset balance
    const monthlyNet = netSavings - seasonalAdjustment;

    // Apply lump sums
    const lumpSum = lumpSumByMonth.get(monthKey) ?? 0;

    currentBalance = Math.max(0, currentBalance + monthlyNet + lumpSum);

    // Loan interest for this month
    const monthlyRate = currentRate / 100 / 12;
    const loanInterest = loanBalance * monthlyRate;

    // Interest with offset
    const effectiveLoanBalance = Math.max(0, loanBalance - currentBalance);
    const interestWithOffset = effectiveLoanBalance * monthlyRate;

    const monthlySaving = loanInterest - interestWithOffset;
    cumulativeSaving += monthlySaving;

    // Update loan balance
    const remainingMonths = Math.max(1, totalMonths - elapsedMonths - m);
    const monthlyPayment = calcMonthlyPayment(loanBalance, currentRate, remainingMonths);
    const principalRepaid = monthlyPayment - loanInterest;
    if (loan.repaymentType === 'PI') {
      loanBalance = Math.max(0, loanBalance - principalRepaid);
    }

    results.push({
      date: format(projDate, 'yyyy-MM-dd'),
      projectedBalance: Math.round(currentBalance * 100) / 100,
      cumulativeSaving: Math.round(cumulativeSaving * 100) / 100,
      loanBalance: Math.round(loanBalance * 100) / 100,
      interestSaved: Math.round(monthlySaving * 100) / 100,
    });
  }

  return results;
}
