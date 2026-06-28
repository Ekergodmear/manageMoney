export function normalizeMoneyInput(raw: string): string {
  return raw.trim().replace(/\./g, '').replace(/,/g, '').replace(/\s/g, '');
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

export function sanitizeMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') {
    return '';
  }
  const value = Number(digits);
  if (!Number.isFinite(value)) {
    return '';
  }
  return formatAmount(value);
}

export function parseMoneyPositiveInt(raw: string): number | null {
  const normalized = normalizeMoneyInput(raw);
  if (normalized === '') {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return null;
  }
  return value;
}
