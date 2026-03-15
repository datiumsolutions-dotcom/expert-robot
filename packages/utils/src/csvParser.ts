export interface RawCsvRow {
  Id?: string;
  Fecha?: string;
  Total?: string;
  Estado?: string;
  'Tipo de Venta'?: string;
  'Medio de Pago'?: string;
  'Id. Cliente'?: string;
  'Teléfono del Cliente'?: string;
  'Email del Cliente'?: string;
}

const REQUIRED_COLUMNS = ['Id', 'Fecha', 'Total'] as const;

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

export function parseCsvBuffer(buffer: Buffer): { rows: RawCsvRow[]; errors: string[] } {
  const content = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV is empty'] };
  }

  const headers = parseCsvLine(lines[0] ?? '');
  const errors: string[] = [];

  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      errors.push(`Missing required column: ${column}`);
    }
  }

  if (errors.length > 0) {
    return { rows: [], errors };
  }

  const rows: RawCsvRow[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i] ?? '');
    const row: RawCsvRow = {};

    headers.forEach((header, index) => {
      row[header as keyof RawCsvRow] = values[index] ?? '';
    });

    rows.push(row);
  }

  return { rows, errors: [] };
}

export function parseAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value) return null;

  value = value.replace(/[$\s]/g, '');

  const hasDot = value.includes('.');
  const hasComma = value.includes(',');

  if (hasDot && hasComma) {
    if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
      value = value.replace(/\./g, '').replace(',', '.');
    } else {
      value = value.replace(/,/g, '');
    }
  } else if (hasComma) {
    value = value.replace(/\./g, '').replace(',', '.');
  } else if (hasDot) {
    const parts = value.split('.');
    if (parts.length > 2) {
      value = value.replace(/\./g, '');
    } else if (parts.length === 2 && (parts[1]?.length ?? 0) === 3) {
      value = value.replace(/\./g, '');
    }
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function parseSaleDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) {
    return iso;
  }

  const dateTimeMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (dateTimeMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = dateTimeMatch;
    const dt = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(ss)));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const dashedMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashedMatch) {
    const [, dd, mm, yyyy] = dashedMatch;
    const dt = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return null;
}

export function mapOrderStatus(raw: string | null | undefined): 'completed' | 'cancelled' {
  if (!raw) return 'completed';
  const value = raw.trim().toLowerCase();
  if (['anulada', 'cancelada', 'void'].includes(value)) return 'cancelled';
  return 'completed';
}

export function mapSaleType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (['delivery', 'takeaway', 'local'].includes(value)) return value;
  return null;
}
