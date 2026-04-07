import type { ParseResult } from '../../types';
import { parseCSV } from './csv';

function detectFormat(content: string, filename: string): 'csv' | 'unknown' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';

  if (ext === 'csv') return 'csv';

  // Sniff content: if it has comma-separated lines with dates, treat as CSV
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  if (firstLines.includes(',') && /\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/.test(firstLines)) {
    return 'csv';
  }

  return 'unknown';
}

export function parseStatement(content: string, filename: string): ParseResult {
  const format = detectFormat(content, filename);

  switch (format) {
    case 'csv':
      return parseCSV(content);
    default:
      return {
        transactions: [],
        warnings: [{ type: 'format', message: `Unsupported file format: ${filename}` }],
        dateRange: { start: '', end: '' },
      };
  }
}

export { parseCSV };
