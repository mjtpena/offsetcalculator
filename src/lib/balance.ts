import { addDays, parseISO, format, differenceInCalendarDays } from 'date-fns';
import type { Transaction, DailyBalance } from '../types';

export function reconstructDailyBalances(transactions: Transaction[]): DailyBalance[] {
  if (transactions.length === 0) return [];

  // Sort chronologically
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  // Group by date — use the last transaction's running balance for each day
  const dailyMap = new Map<string, number>();
  for (const txn of sorted) {
    dailyMap.set(txn.date, txn.runningBalance);
  }

  const startDate = parseISO(sorted[0].date);
  const endDate = parseISO(sorted[sorted.length - 1].date);
  const totalDays = differenceInCalendarDays(endDate, startDate);

  const result: DailyBalance[] = [];
  let lastKnownBalance = sorted[0].runningBalance;

  for (let d = 0; d <= totalDays; d++) {
    const current = addDays(startDate, d);
    const dateStr = format(current, 'yyyy-MM-dd');
    const actualBalance = dailyMap.get(dateStr);

    if (actualBalance !== undefined) {
      lastKnownBalance = actualBalance;
      result.push({ date: dateStr, balance: actualBalance, isInterpolated: false });
    } else {
      // Carry forward the last known balance
      result.push({ date: dateStr, balance: lastKnownBalance, isInterpolated: true });
    }
  }

  return result;
}
