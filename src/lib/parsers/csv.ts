import { parse as parseDate, isValid, format } from 'date-fns';
import type { Transaction, ParseResult, ParseWarning } from '../../types';

interface RawRow {
  date: string;
  description: string;
  amount: number;
  balance: number | null;
}

interface BankParser {
  name: string;
  detect: (headers: string[], rows: string[][]) => boolean;
  parse: (headers: string[], rows: string[][]) => RawRow[];
}

// Date format parsers for Australian banks
const DATE_FORMATS = [
  'dd/MM/yyyy',
  'dd/MM/yy',
  'd/MM/yyyy',
  'd/M/yyyy',
  'dd MMM yyyy',
  'd MMM yyyy',
  'dd-MMM-yy',
  'dd-MMM-yyyy',
  'yyyy-MM-dd',
];

function parseAusDate(raw: string): Date | null {
  const trimmed = raw.trim();
  for (const fmt of DATE_FORMATS) {
    const d = parseDate(trimmed, fmt, new Date());
    if (isValid(d)) return d;
  }
  return null;
}

function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function normaliseHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findCol(headers: string[], ...candidates: string[]): number {
  const norm = headers.map(normaliseHeader);
  for (const c of candidates) {
    const idx = norm.indexOf(c);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseAmount(val: string): number {
  if (!val || val.trim() === '') return 0;
  const cleaned = val.replace(/[$,\s"]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ─── Bank-specific parsers ───────────────────────────────────────

const stGeorge: BankParser = {
  name: 'St George',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('description') && norm.includes('debit') && norm.includes('credit') && norm.includes('balance');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'description');
    const iDebit = findCol(headers, 'debit');
    const iCredit = findCol(headers, 'credit');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const westpac: BankParser = {
  name: 'Westpac',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return (norm.includes('bankaccount') || norm.includes('bsbnumber')) &&
      norm.includes('date') && norm.includes('narrative');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'narrative', 'description');
    const iAmount = findCol(headers, 'amount');
    const iDebit = findCol(headers, 'debitamount', 'debit');
    const iCredit = findCol(headers, 'creditamount', 'credit');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => {
      let amount: number;
      if (iAmount >= 0) {
        amount = parseAmount(r[iAmount] ?? '');
      } else {
        amount = parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? '');
      }
      return {
        date: r[iDate] ?? '',
        description: r[iDesc] ?? '',
        amount,
        balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
      };
    });
  },
};

const cba: BankParser = {
  name: 'CBA',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    // CBA exports: Date, Amount, Description, Balance (no header row sometimes)
    // or with headers: "Date","Amount","Description","Balance"
    return norm.length >= 3 && norm.includes('date') && norm.includes('amount') && norm.includes('description');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iAmount = findCol(headers, 'amount');
    const iDesc = findCol(headers, 'description');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iAmount] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const anz: BankParser = {
  name: 'ANZ',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    // ANZ: "Type","Details","Particulars","Code","Reference","Amount","Date","ForeignCurrencyAmount","ConversionCharge"
    // or simplified with status
    return (norm.includes('type') && norm.includes('details') && norm.includes('amount') && norm.includes('date')) ||
      (norm.includes('status') && norm.includes('date') && norm.includes('description'));
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'details', 'description', 'narrative');
    const iAmount = findCol(headers, 'amount');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iAmount] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const nab: BankParser = {
  name: 'NAB',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('transactiondetails') && (norm.includes('amount') || (norm.includes('debit') && norm.includes('credit')));
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'transactiondetails', 'description');
    const iAmount = findCol(headers, 'amount');
    const iDebit = findCol(headers, 'debit');
    const iCredit = findCol(headers, 'credit');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => {
      let amount: number;
      if (iAmount >= 0) {
        amount = parseAmount(r[iAmount] ?? '');
      } else {
        amount = parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? '');
      }
      return {
        date: r[iDate] ?? '',
        description: r[iDesc] ?? '',
        amount,
        balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
      };
    });
  },
};

const macquarie: BankParser = {
  name: 'Macquarie',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('description') && norm.includes('amount') && norm.includes('balance');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'description');
    const iAmount = findCol(headers, 'amount');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iAmount] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const ing: BankParser = {
  name: 'ING',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('description') && (norm.includes('credit') || norm.includes('debit')) && norm.includes('balance');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'description');
    const iDebit = findCol(headers, 'debit');
    const iCredit = findCol(headers, 'credit');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const bendigo: BankParser = {
  name: 'Bendigo',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('description') && norm.includes('debit') && norm.includes('credit');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'description');
    const iDebit = findCol(headers, 'debit');
    const iCredit = findCol(headers, 'credit');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const suncorp: BankParser = {
  name: 'Suncorp',
  detect: (headers) => {
    const norm = headers.map(normaliseHeader);
    return norm.includes('date') && norm.includes('narrative') && norm.includes('amount');
  },
  parse: (headers, rows) => {
    const iDate = findCol(headers, 'date');
    const iDesc = findCol(headers, 'narrative', 'description');
    const iAmount = findCol(headers, 'amount');
    const iBal = findCol(headers, 'balance');
    return rows.map(r => ({
      date: r[iDate] ?? '',
      description: r[iDesc] ?? '',
      amount: parseAmount(r[iAmount] ?? ''),
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    }));
  },
};

const BANK_PARSERS: BankParser[] = [
  stGeorge, westpac, cba, anz, nab, macquarie, ing, bendigo, suncorp,
];

// ─── CSV tokeniser (handles quoted fields) ───────────────────────

function tokeniseCSV(raw: string): string[][] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field.trim());
        field = '';
        if (current.some(c => c !== '')) lines.push(current);
        current = [];
        if (ch === '\r') i++;
      } else {
        field += ch;
      }
    }
  }
  // push last field
  current.push(field.trim());
  if (current.some(c => c !== '')) lines.push(current);

  return lines;
}

// ─── Generic fallback parser ────────────────────────────────────

function genericParse(headers: string[], rows: string[][]): { rows: RawRow[]; bank: string } | null {
  const norm = headers.map(normaliseHeader);

  // Find date column
  let iDate = norm.findIndex(h => h === 'date' || h === 'transactiondate' || h === 'valuedate' || h === 'postingdate');
  if (iDate < 0) {
    // Try to find column with parseable dates
    for (let c = 0; c < headers.length && c < 6; c++) {
      if (rows.length > 0 && parseAusDate(rows[0][c] ?? '') !== null) {
        iDate = c;
        break;
      }
    }
  }
  if (iDate < 0) return null;

  // Find amount column(s)
  let iAmount = norm.findIndex(h => h === 'amount' || h === 'transactionamount');
  const iDebit = norm.findIndex(h => h === 'debit' || h === 'debitamount' || h === 'debits');
  const iCredit = norm.findIndex(h => h === 'credit' || h === 'creditamount' || h === 'credits');

  // If no named amount column, find first numeric non-date column
  if (iAmount < 0 && iDebit < 0) {
    for (let c = 0; c < headers.length; c++) {
      if (c === iDate) continue;
      if (rows.length > 0) {
        const val = parseAmount(rows[0][c] ?? '');
        if (val !== 0 || (rows[0][c] ?? '').match(/^\s*\$?[\d,.-]+\s*$/)) {
          iAmount = c;
          break;
        }
      }
    }
  }

  if (iAmount < 0 && iDebit < 0) return null;

  // Find description
  let iDesc = norm.findIndex(h =>
    h === 'description' || h === 'narrative' || h === 'details' ||
    h === 'transactiondetails' || h === 'memo' || h === 'reference'
  );
  if (iDesc < 0) {
    // pick the first text-ish column that isn't date or amount
    for (let c = 0; c < headers.length; c++) {
      if (c === iDate || c === iAmount || c === iDebit || c === iCredit) continue;
      iDesc = c;
      break;
    }
  }

  // Find balance
  const iBal = norm.findIndex(h => h === 'balance' || h === 'runningbalance' || h === 'closingbalance');

  const parsed = rows.map(r => {
    let amount: number;
    if (iAmount >= 0) {
      amount = parseAmount(r[iAmount] ?? '');
    } else {
      amount = parseAmount(r[iCredit] ?? '') - parseAmount(r[iDebit] ?? '');
    }
    return {
      date: r[iDate] ?? '',
      description: iDesc >= 0 ? (r[iDesc] ?? '') : '',
      amount,
      balance: iBal >= 0 ? parseAmount(r[iBal] ?? '') : null,
    };
  });

  return { rows: parsed, bank: 'Generic' };
}

// ─── Post-processing: compute running balance if missing ────────

function computeRunningBalance(rawRows: RawRow[]): RawRow[] {
  const hasBalance = rawRows.some(r => r.balance !== null && r.balance !== 0);
  if (hasBalance) return rawRows;

  // Without a starting balance we can only track relative changes
  let balance = 0;
  return rawRows.map(r => {
    balance += r.amount;
    return { ...r, balance };
  });
}

// ─── Main export ────────────────────────────────────────────────

export function parseCSV(raw: string): ParseResult {
  const warnings: ParseWarning[] = [];

  const allRows = tokeniseCSV(raw);
  if (allRows.length < 2) {
    return { transactions: [], warnings: [{ type: 'format', message: 'File is empty or has no data rows' }], dateRange: { start: '', end: '' } };
  }

  const headers = allRows[0];
  const dataRows = allRows.slice(1);

  // Try each bank parser
  let rawRows: RawRow[] | null = null;
  let detectedBank: string | undefined;

  for (const bp of BANK_PARSERS) {
    if (bp.detect(headers, dataRows)) {
      rawRows = bp.parse(headers, dataRows);
      detectedBank = bp.name;
      break;
    }
  }

  // Fallback to generic
  if (!rawRows) {
    const result = genericParse(headers, dataRows);
    if (result) {
      rawRows = result.rows;
      detectedBank = result.bank;
    }
  }

  if (!rawRows || rawRows.length === 0) {
    return { transactions: [], warnings: [{ type: 'format', message: 'Unable to detect CSV format or no valid data found' }], dateRange: { start: '', end: '' } };
  }

  // Fill in running balance if not present
  rawRows = computeRunningBalance(rawRows);

  // Convert dates and filter invalid rows
  const transactions: Transaction[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const d = parseAusDate(r.date);
    if (!d) {
      warnings.push({ type: 'format', message: `Unparseable date "${r.date}"`, line: i + 2 });
      continue;
    }
    transactions.push({
      date: toISODate(d),
      description: r.description,
      amount: r.amount,
      runningBalance: r.balance ?? 0,
    });
  }

  if (transactions.length === 0) {
    return { transactions: [], warnings: [{ type: 'format', message: 'No valid transactions found after parsing' }], dateRange: { start: '', end: '' } };
  }

  // Sort chronologically
  transactions.sort((a, b) => a.date.localeCompare(b.date));

  // Detect gaps > 7 days
  for (let i = 1; i < transactions.length; i++) {
    const prev = new Date(transactions[i - 1].date);
    const curr = new Date(transactions[i].date);
    const gap = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (gap > 7) {
      warnings.push({
        type: 'gap',
        message: `${Math.round(gap)}-day gap between ${transactions[i - 1].date} and ${transactions[i].date}`,
      });
    }
  }

  // Detect duplicate rows
  const seen = new Set<string>();
  for (let i = 0; i < transactions.length; i++) {
    const key = `${transactions[i].date}|${transactions[i].amount}|${transactions[i].description}`;
    if (seen.has(key)) {
      warnings.push({ type: 'duplicate', message: `Possible duplicate: ${key}`, line: i + 2 });
    }
    seen.add(key);
  }

  // Detect balance discontinuities
  for (let i = 1; i < transactions.length; i++) {
    const expected = transactions[i - 1].runningBalance + transactions[i].amount;
    const actual = transactions[i].runningBalance;
    if (actual !== 0 && Math.abs(expected - actual) > 0.02) {
      warnings.push({
        type: 'discontinuity',
        message: `Balance discontinuity on ${transactions[i].date}: expected ${expected.toFixed(2)}, got ${actual.toFixed(2)}`,
      });
    }
  }

  return {
    transactions,
    warnings,
    detectedBank,
    dateRange: {
      start: transactions[0].date,
      end: transactions[transactions.length - 1].date,
    },
  };
}
