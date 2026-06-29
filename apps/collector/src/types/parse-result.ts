import type { DrawResult } from './draw-result.js';

export interface ParseResult {
  readonly success: boolean;
  readonly draw?: DrawResult;
  readonly rawPayload: unknown;
  readonly errors: readonly string[];
}

export function parseFailure(
  rawPayload: unknown,
  errors: readonly string[],
): ParseResult {
  return { success: false, rawPayload, errors };
}

export function parseSuccess(draw: DrawResult, rawPayload: unknown): ParseResult {
  return { success: true, draw, rawPayload, errors: [] };
}
