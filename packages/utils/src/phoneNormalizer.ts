export function normalizePhone(
  raw: string | null | undefined,
  countryCode: string | null | undefined,
  areaCode: string | null | undefined,
): string | null {
  if (!raw) return null;

  const cc = (countryCode ?? '54').replace(/\D/g, '');
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(cc)) {
    digits = digits.slice(cc.length);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith('15')) {
    digits = digits.slice(2);
  }

  if (digits.length >= 10 && digits[2] === '1' && digits.startsWith('11')) {
    digits = `${digits.slice(0, 2)}${digits.slice(3)}`;
  }

  const normalizedAreaCode = (areaCode ?? '').replace(/\D/g, '');
  if (digits.length === 7 || digits.length === 8) {
    if (!normalizedAreaCode) return null;
    digits = `${normalizedAreaCode}${digits}`;
  }

  if (digits.length === 10 && digits[2] === '1') {
    digits = `${digits.slice(0, 2)}${digits.slice(3)}`;
  }

  if (digits.length < 10 || digits.length > 11) return null;

  return `+${cc}${digits}`;
}

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (!value.includes('@')) return null;
  return value;
}
