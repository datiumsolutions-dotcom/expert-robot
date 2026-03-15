import { calculatePoints } from '../import.processor';
import { normalizePhone, normalizeEmail } from '../../../../../../packages/utils/src/phoneNormalizer';
import { parseAmount, parseSaleDate, mapOrderStatus, parseCsvBuffer } from '../../../../../../packages/utils/src/csvParser';

describe('normalizePhone', () => {
  it('normalizes with area code formatting', () => {
    expect(normalizePhone('(223) 456-7890', '54', '223')).toBe('+542234567890');
  });

  it('normalizes with 15 prefix', () => {
    expect(normalizePhone('15 456 7890', '54', '223')).toBe('+542234567890');
  });

  it('normalizes local number using area code', () => {
    expect(normalizePhone('456-7890', '54', '223')).toBe('+542234567890');
  });

  it('normalizes leading 0 and country code', () => {
    expect(normalizePhone('0 223 4567890', '54', '223')).toBe('+542234567890');
    expect(normalizePhone('+54 223 4567890', '54', '223')).toBe('+542234567890');
  });

  it('returns null for null input', () => {
    expect(normalizePhone(null, '54', '223')).toBeNull();
  });

  it('returns null for garbage', () => {
    expect(normalizePhone('garbage', '54', '223')).toBeNull();
  });

  it('returns null when area code needed but missing', () => {
    expect(normalizePhone('4567890', '54', null)).toBeNull();
  });

  it('returns null for too short numbers', () => {
    expect(normalizePhone('123', '54', '223')).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  TEST@Mail.COM  ')).toBe('test@mail.com');
  });

  it('returns null for invalid value', () => {
    expect(normalizeEmail('invalid')).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe('parseAmount', () => {
  it('parses ES locale', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });

  it('parses EN locale', () => {
    expect(parseAmount('1,234.56')).toBe(1234.56);
  });

  it('parses amount with currency symbol', () => {
    expect(parseAmount('$45.000')).toBe(45000);
  });

  it('returns null for undefined', () => {
    expect(parseAmount(undefined)).toBeNull();
  });
});

describe('parseSaleDate', () => {
  it('parses ISO date', () => {
    expect(parseSaleDate('2026-03-14T12:00:00Z')).toBeInstanceOf(Date);
  });

  it('parses DD/MM/YYYY', () => {
    const date = parseSaleDate('14/03/2026');
    expect(date).toBeInstanceOf(Date);
    expect(date?.toISOString()).toContain('2026-03-14');
  });

  it('returns null for invalid dates', () => {
    expect(parseSaleDate('not-a-date')).toBeNull();
  });
});

describe('mapOrderStatus', () => {
  it('maps Anulada to cancelled', () => {
    expect(mapOrderStatus('Anulada')).toBe('cancelled');
  });

  it('defaults to completed', () => {
    expect(mapOrderStatus('Pagada')).toBe('completed');
  });
});

describe('calculatePoints', () => {
  it('calculates expected points and threshold behavior', () => {
    expect(calculatePoints(45000, 10000)).toBe(4);
    expect(calculatePoints(10000, 10000)).toBe(1);
    expect(calculatePoints(9999, 10000)).toBe(0);
    expect(calculatePoints(0, 10000)).toBe(0);
  });
});

describe('parseCsvBuffer', () => {
  it('parses valid CSV', () => {
    const csv = 'Id,Fecha,Total\n1,14/03/2026,1000';
    const parsed = parseCsvBuffer(Buffer.from(csv));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.Id).toBe('1');
  });

  it('handles UTF-8 BOM', () => {
    const csv = '\uFEFFId,Fecha,Total\n1,14/03/2026,1000';
    const parsed = parseCsvBuffer(Buffer.from(csv));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
  });

  it('returns error for missing required column', () => {
    const csv = 'Id,Fecha\n1,14/03/2026';
    const parsed = parseCsvBuffer(Buffer.from(csv));
    expect(parsed.errors).toContain('Missing required column: Total');
  });

  it('handles empty lines', () => {
    const csv = 'Id,Fecha,Total\n\n1,14/03/2026,1000\n';
    const parsed = parseCsvBuffer(Buffer.from(csv));
    expect(parsed.rows).toHaveLength(1);
  });

  it('handles quoted fields containing commas', () => {
    const csv = 'Id,Fecha,Total,Medio de Pago\n1,14/03/2026,1000,"Tarjeta, Visa"';
    const parsed = parseCsvBuffer(Buffer.from(csv));
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.['Medio de Pago']).toBe('Tarjeta, Visa');
  });
});
