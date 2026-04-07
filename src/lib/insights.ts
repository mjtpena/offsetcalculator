import { parseISO, differenceInCalendarDays, format } from 'date-fns';
import type { DailyBalance, LoanProfile, AnalysisResult, CashflowPattern, Insight } from '../types';

export function generateInsights(
  dailyBalances: DailyBalance[],
  loan: LoanProfile,
  analysis: AnalysisResult,
  pattern: CashflowPattern | null,
): Insight[] {
  const insights: Insight[] = [];

  if (dailyBalances.length === 0) return insights;

  // ─── 1. Efficiency insight ─────────────────────────────────────
  const efficiency = analysis.efficiencyScore;
  const avgBalance =
    dailyBalances.reduce((s, d) => s + d.balance, 0) / dailyBalances.length;
  const utilizationPct = loan.currentBalance > 0
    ? Math.min(100, (avgBalance / loan.currentBalance) * 100)
    : 0;

  if (efficiency < 0.5) {
    insights.push({
      id: 'efficiency-low',
      type: 'efficiency',
      headline: 'Your offset is working at only ' + Math.round(efficiency * 100) + '% efficiency',
      detail: `Your average offset balance of $${Math.round(avgBalance).toLocaleString()} covers ${Math.round(utilizationPct)}% of your $${Math.round(loan.currentBalance).toLocaleString()} loan. ` +
        'Increasing your offset balance would significantly reduce interest charges.',
      annualSavingImpact: estimateAdditionalSaving(loan, avgBalance, avgBalance * 1.2),
    });
  } else {
    insights.push({
      id: 'efficiency-good',
      type: 'efficiency',
      headline: 'Your offset efficiency is ' + Math.round(efficiency * 100) + '% — great work!',
      detail: `Your average offset balance of $${Math.round(avgBalance).toLocaleString()} is effectively reducing your interest. ` +
        `You've saved $${Math.round(analysis.totalSaved).toLocaleString()} over this period.`,
    });
  }

  // ─── 2. Timing insight: end-of-month balance dips ──────────────
  const monthlyBreakdown = analysis.monthlyBreakdown;
  if (monthlyBreakdown.length >= 2) {
    // Find months with significantly lower avg balance
    const overallAvg = monthlyBreakdown.reduce((s, m) => s + m.avgOffsetBalance, 0) / monthlyBreakdown.length;
    const dipMonths = monthlyBreakdown.filter(m => m.avgOffsetBalance < overallAvg * 0.8);

    if (dipMonths.length > 0) {
      const worstMonth = dipMonths.reduce((w, m) => m.avgOffsetBalance < w.avgOffsetBalance ? m : w);
      const dip = overallAvg - worstMonth.avgOffsetBalance;
      insights.push({
        id: 'timing-dip',
        type: 'timing',
        headline: 'Balance dip detected in ' + format(parseISO(worstMonth.month + '-01'), 'MMMM yyyy'),
        detail: `Your offset balance dropped $${Math.round(dip).toLocaleString()} below average that month. ` +
          'Consider timing large payments (credit cards, insurance) to occur just after salary deposits to maintain a higher average.',
        annualSavingImpact: estimateTimingSaving(loan, dip),
      });
    }
  }

  // ─── 3. Opportunity insight: potential consolidation ───────────
  if (pattern && pattern.avgNetSavings > 0) {
    const annualNetSavings = pattern.avgNetSavings * 12;
    const potentialExtraSaving = estimateAdditionalSaving(loan, avgBalance, avgBalance + annualNetSavings / 2);

    if (potentialExtraSaving > 100) {
      insights.push({
        id: 'opportunity-consolidate',
        type: 'opportunity',
        headline: 'Consolidating savings could save you more',
        detail: `You're accumulating ~$${Math.round(pattern.avgNetSavings).toLocaleString()}/month in net savings. ` +
          'If any of this sits in a savings account earning less than your mortgage rate, moving it to your offset would save more in avoided interest.',
        annualSavingImpact: potentialExtraSaving,
      });
    }
  }

  // ─── 4. Milestone insight: projected payoff acceleration ───────
  if (loan.repaymentType === 'PI' && avgBalance > 0) {
    const monthlyRate = loan.annualRate / 100 / 12;
    const totalMonths = loan.termYears * 12;

    // Without offset
    const paymentNoOffset = monthlyRate > 0
      ? loan.originalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loan.originalAmount / totalMonths;

    // With offset reducing effective balance
    const effectiveBalance = Math.max(0, loan.currentBalance - avgBalance);
    const remainingNoOffset = monthlyRate > 0
      ? Math.ceil(Math.log(paymentNoOffset / (paymentNoOffset - loan.currentBalance * monthlyRate)) / Math.log(1 + monthlyRate))
      : Math.ceil(loan.currentBalance / paymentNoOffset);
    const remainingWithOffset = monthlyRate > 0 && effectiveBalance > 0
      ? Math.ceil(Math.log(paymentNoOffset / (paymentNoOffset - effectiveBalance * monthlyRate)) / Math.log(1 + monthlyRate))
      : 0;

    const monthsSaved = remainingNoOffset - remainingWithOffset;

    if (monthsSaved > 6) {
      const yearsSaved = Math.floor(monthsSaved / 12);
      const extraMonths = monthsSaved % 12;
      const timeStr = yearsSaved > 0
        ? `${yearsSaved} year${yearsSaved > 1 ? 's' : ''}${extraMonths > 0 ? ` and ${extraMonths} month${extraMonths > 1 ? 's' : ''}` : ''}`
        : `${extraMonths} month${extraMonths > 1 ? 's' : ''}`;

      insights.push({
        id: 'milestone-payoff',
        type: 'milestone',
        headline: `Your offset could shorten your loan by ${timeStr}`,
        detail: `At your current average offset balance, you're on track to pay off your mortgage ${timeStr} earlier ` +
          `than the original ${loan.termYears}-year term.`,
      });
    }
  }

  // ─── 5. Risk insights ─────────────────────────────────────────

  // Data gaps
  const interpolatedDays = dailyBalances.filter(d => d.isInterpolated).length;
  const totalDays = dailyBalances.length;
  const interpolatedPct = (interpolatedDays / totalDays) * 100;

  if (interpolatedPct > 30) {
    insights.push({
      id: 'risk-data-gaps',
      type: 'risk',
      headline: `${Math.round(interpolatedPct)}% of your balance data is estimated`,
      detail: `We only have actual transaction data for ${totalDays - interpolatedDays} of ${totalDays} days. ` +
        'Upload more statement data for more accurate calculations. Gaps greater than a week may skew interest estimates.',
    });
  }

  // Rate history risk — if rate hasn't been updated recently
  if (loan.rateHistory.length > 0) {
    const lastRateChange = loan.rateHistory[loan.rateHistory.length - 1];
    const daysSinceChange = differenceInCalendarDays(
      new Date(),
      parseISO(lastRateChange.effectiveDate),
    );

    if (daysSinceChange > 365) {
      insights.push({
        id: 'risk-rate-stale',
        type: 'risk',
        headline: 'Your interest rate may be outdated',
        detail: `The last rate update in your profile was ${format(parseISO(lastRateChange.effectiveDate), 'dd MMM yyyy')}. ` +
          'Check your lender for any recent rate changes to keep calculations accurate.',
      });
    }
  }

  // Return top 5 insights
  return insights.slice(0, 5);
}

// ─── Helper: estimate annual saving from increasing offset ──────

function estimateAdditionalSaving(
  loan: LoanProfile,
  currentAvgBalance: number,
  newAvgBalance: number,
): number {
  const rate = loan.annualRate / 100;
  const currentEffective = Math.max(0, loan.currentBalance - currentAvgBalance);
  const newEffective = Math.max(0, loan.currentBalance - newAvgBalance);
  const currentAnnualInterest = currentEffective * rate;
  const newAnnualInterest = newEffective * rate;
  return Math.round((currentAnnualInterest - newAnnualInterest) * 100) / 100;
}

function estimateTimingSaving(loan: LoanProfile, dipAmount: number): number {
  // If the dip could be smoothed out, estimate saving
  const rate = loan.annualRate / 100;
  // The dip happens for roughly half the month
  return Math.round((dipAmount * rate * 0.5 / 12) * 100) / 100;
}
