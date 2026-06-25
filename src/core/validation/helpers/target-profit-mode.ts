import type { CalculationRequest } from '@/application/dto';

const VALID_MODES = new Set(['breakEven', 'fixedAmount', 'percentage']);

export function isRequestObject(request: unknown): request is CalculationRequest {
  return typeof request === 'object' && request !== null;
}

export function getTargetProfitMode(request: unknown): string | null {
  if (!isRequestObject(request)) {
    return null;
  }

  const target: unknown = request.targetProfit;
  if (typeof target !== 'object' || target === null || !('mode' in target)) {
    return null;
  }

  return (target as { mode: string }).mode;
}

export function isKnownTargetProfitMode(
  mode: string | null,
): mode is CalculationRequest['targetProfit']['mode'] {
  return mode !== null && VALID_MODES.has(mode);
}
