import { parseISO, differenceInCalendarDays, addMonths, format } from 'date-fns';
import type { DailyBalance, LoanProfile, AnalysisResult, MonthlyResult } from '../types';

function getRateForDate(loan: LoanProfile, dateStr: string): number {
  if (!loan.rateHistory || loan.rateHistory.length === 0) return loan.annualRate;

  // rateHistory sorted ascending by date; find the latest rate effective on or before dateStr
  let rate = loan.annualRate;
  for (const event of loan.rateHistory) {
    if (event.effectiveDate <= dateStr) {
      rate = event.annualRate;
    }
  }
  return rate;
}

/**
 * Back-calculate the approximate loan balance on a given date using P&I amortisation.
 * For IO loans, the balance stays constant.
 */
function estimateLoanBalance(loan: LoanProfile, dateStr: string): number {
  if (loan.repaymentType === 'IO') {
    return loan.currentBalance;
  }

  const startDate = parseISO(loan.startDate);
  const targetDate = parseISO(dateStr);
  const totalMonths = loan.termYears * 12;

  // Calculate monthly payment using original amount and initial rate
  const monthlyRate = loan.annualRate / 100 / 12;
  if (monthlyRate === 0) {
    // Zero interest — simple straight-line
    const elapsed = differenceInCalendarDays(targetDate, startDate) / 30.44;
    return Math.max(0, loan.originalAmount - (loan.originalAmount / totalMonths) * elapsed);
  }

  const monthlyPayment = loan.originalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  // Step month-by-month from start
  let balance = loan.originalAmount;
  let current = startDate;

  while (current < targetDate && balance > 0) {
    const nextMonth = addMonths(current, 1);
    const currentDateStr = format(current, 'yyyy-MM-dd');
    const rate = getRateForDate(loan, currentDateStr);
    const mr = rate / 100 / 12;

    const interestPortion = balance * mr;
    const principalPortion = monthlyPayment - interestPortion;
    balance = Math.max(0, balance - principalPortion);

    if (nextMonth >= targetDate) break;
    current = nextMonth;
  }

  return balance;
}

export function calculateInterest(
  dailyBalances: DailyBalance[],
  loan: LoanProfile,
): AnalysisResult {
  if (dailyBalances.length === 0) {
    return {
      periodStart: '', periodEnd: '',
      totalInterestPaid: 0, totalInterestWithoutOffset: 0, totalSaved: 0,
      efficiencyScore: 0, monthlyBreakdown: [],
    };
  }

  const periodStart = dailyBalances[0].date;
  const periodEnd = dailyBalances[dailyBalances.length - 1].date;

  let totalInterestWithOffset = 0;
  let totalInterestWithoutOffset = 0;
  let maxTheoreticalSaving = 0;

  // Monthly accumulators
  const monthlyMap = new Map<string, {
    sumOffsetBalance: number;
    dayCount: number;
    interestWithOffset: number;
    interestWithoutOffset: number;
    loanBalance: number;
  }>();

  for (const day of dailyBalances) {
    const annualRate = getRateForDate(loan, day.date);
    const dailyRate = annualRate / 100 / 365;
    const loanBalance = estimateLoanBalance(loan, day.date);

    // Interest without offset (full loan balance)
    const interestNoOffset = loanBalance * dailyRate;

    // Effective balance after offset is applied
    const effectiveBalance = Math.max(0, loanBalance - day.balance);
    const interestWithOff = effectiveBalance * dailyRate;

    // Max theoretical saving = if offset covered entire loan
    const maxDailySaving = loanBalance * dailyRate;

    totalInterestWithOffset += interestWithOff;
    totalInterestWithoutOffset += interestNoOffset;
    maxTheoreticalSaving += maxDailySaving;

    // Accumulate monthly
    const monthKey = day.date.slice(0, 7); // YYYY-MM
    const existing = monthlyMap.get(monthKey) ?? {
      sumOffsetBalance: 0, dayCount: 0,
      interestWithOffset: 0, interestWithoutOffset: 0,
      loanBalance: 0,
    };
    existing.sumOffsetBalance += day.balance;
    existing.dayCount += 1;
    existing.interestWithOffset += interestWithOff;
    existing.interestWithoutOffset += interestNoOffset;
    existing.loanBalance = loanBalance; // use last day's value
    monthlyMap.set(monthKey, existing);
  }

  const totalSaved = totalInterestWithoutOffset - totalInterestWithOffset;
  const efficiencyScore = maxTheoreticalSaving > 0
    ? Math.min(1, totalSaved / maxTheoreticalSaving)
    : 0;

  const monthlyBreakdown: MonthlyResult[] = [];
  const sortedMonths = [...monthlyMap.keys()].sort();
  for (const month of sortedMonths) {
    const m = monthlyMap.get(month)!;
    monthlyBreakdown.push({
      month,
      avgOffsetBalance: m.dayCount > 0 ? m.sumOffsetBalance / m.dayCount : 0,
      interestCharged: m.interestWithOffset,
      interestSaved: m.interestWithoutOffset - m.interestWithOffset,
      loanBalance: m.loanBalance,
    });
  }

  return {
    periodStart,
    periodEnd,
    totalInterestPaid: totalInterestWithOffset,
    totalInterestWithoutOffset,
    totalSaved,
    efficiencyScore,
    monthlyBreakdown,
  };
}
