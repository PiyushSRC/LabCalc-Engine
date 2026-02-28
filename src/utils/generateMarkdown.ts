export interface LabReportData {
  concentration: number | null;
  stdOD: number | null;
  solvent: string;
  normalDate: string;
  srcDate: string;
  rows: {
    id: number;
    normalOD: number | null;
    normalCalc: number | null;
    postOD: number | null;
    postCalc: number | null;
  }[];
}

function formatCell(value: number | null): string {
  return value != null ? value.toFixed(2) : '-';
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

export function generateMarkdown(report: LabReportData): string {
  const lines: string[] = [];

  lines.push('# Laboratory Summary Report');
  lines.push('');
  lines.push(`Report Timestamp: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push(`**Std O.D.:** ${formatCell(report.stdOD)}`);
  lines.push(`**Concentration:** ${formatCell(report.concentration)}`);
  lines.push(`**Solvent:** ${report.solvent || '-'}`);
  lines.push(`**Normal Date:** ${report.normalDate || '-'}`);
  lines.push(`**SRC Date:** ${report.srcDate || '-'}`);
  lines.push('');

  const headers = ['Sample ID', 'Normal: O.D.', 'Normal: Calc', 'SRC: O.D.', 'SRC: Calc'];
  const colWidths = [9, 12, 12, 9, 9];

  const headerRow = '| ' + headers.map((h, i) => padRight(h, colWidths[i])).join(' | ') + ' |';
  const separatorRow = '|' + colWidths.map(w => '-'.repeat(w + 2)).join('|') + '|';

  lines.push(headerRow);
  lines.push(separatorRow);

  if (report.rows.length === 0) {
    lines.push('| ' + padRight('No data', colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 3) + ' |');
  } else {
    for (const row of report.rows) {
      const cells = [
        String(row.id),
        formatCell(row.normalOD),
        formatCell(row.normalCalc),
        formatCell(row.postOD),
        formatCell(row.postCalc),
      ];
      lines.push('| ' + cells.map((c, i) => padRight(c, colWidths[i])).join(' | ') + ' |');
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('*Generated via LabCalc Engine Professional*');

  return lines.join('\n');
}
