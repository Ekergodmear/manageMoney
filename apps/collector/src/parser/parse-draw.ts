import type { Bingo18ListPayload, Bingo18RawDraw } from '../adapter/bingo18-adapter.js';
import {
  classifySmallLarge,
  computeLatencyMs,
  detectFlower,
  diceTotal,
  drawKeyFromDrawAt,
  type DrawResult,
  type RawHttpResponse,
} from '../types/draw-result.js';
import { parseFailure, parseSuccess, type ParseResult } from '../types/parse-result.js';

interface MockRawPayload {
  readonly kind: 'mock';
  readonly drawKey: string;
  readonly drawAt: string;
  readonly publishedAt: string;
  readonly dice: [number, number, number];
}

export interface ParseDrawOptions {
  readonly gameId?: string;
  readonly rawResponse?: RawHttpResponse | null;
}

function isMockPayload(value: unknown): value is MockRawPayload {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    o['kind'] === 'mock' &&
    typeof o['drawKey'] === 'string' &&
    typeof o['drawAt'] === 'string' &&
    Array.isArray(o['dice']) &&
    o['dice'].length === 3
  );
}

function isBingo18ListPayload(value: unknown): value is Bingo18ListPayload {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return o['kind'] === 'bingo18-list' && Array.isArray(o['draws']);
}

function parseWinningResult(result: string): [number, number, number] | null {
  if (!/^\d{3}$/.test(result)) return null;
  const d1 = Number(result[0]);
  const d2 = Number(result[1]);
  const d3 = Number(result[2]);
  if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6 || d3 < 1 || d3 > 6) return null;
  return [d1, d2, d3];
}

export function parseBingo18RawDraw(
  raw: Bingo18RawDraw,
  source: string,
  options: ParseDrawOptions = {},
  collectedAt = new Date().toISOString(),
): ParseResult {
  const dice = parseWinningResult(raw.winningResult);
  if (dice === null) {
    return parseFailure(raw, [`Invalid winningResult: ${raw.winningResult}`]);
  }

  const drawAt = raw.drawAt;
  const publishedAt = drawAt;
  const publishedEstimated = true;
  const latencyMs = computeLatencyMs(publishedAt, collectedAt);
  const total = diceTotal(dice);
  const gameId = options.gameId ?? 'bingo18';

  const draw: DrawResult = {
    drawKey: drawKeyFromDrawAt(drawAt),
    gameId,
    marketVersion: 1,
    drawAt,
    publishedAt,
    publishedEstimated,
    collectedAt,
    latencyMs,
    dice,
    total,
    flower: detectFlower(dice),
    smallLarge: classifySmallLarge(total),
    source,
    rawPayload: raw,
    rawResponse: options.rawResponse ?? null,
  };

  return parseSuccess(draw, raw);
}

function buildDrawFromMock(
  rawPayload: MockRawPayload,
  source: string,
  gameId: string,
  rawResponse: RawHttpResponse | null,
): DrawResult {
  const collectedAt = new Date().toISOString();
  const publishedAt = rawPayload.publishedAt;
  const publishedEstimated = publishedAt === rawPayload.drawAt;
  const latencyMs = computeLatencyMs(publishedAt, collectedAt);
  const dice = rawPayload.dice;
  const total = diceTotal(dice);

  return {
    drawKey: rawPayload.drawKey,
    gameId,
    marketVersion: 1,
    drawAt: rawPayload.drawAt,
    publishedAt,
    publishedEstimated,
    collectedAt,
    latencyMs,
    dice,
    total,
    flower: detectFlower(dice),
    smallLarge: classifySmallLarge(total),
    source,
    rawPayload,
    rawResponse,
  };
}

/** Parse a single draw payload (mock or latest from bingo18-list). */
export function parseDrawPayload(
  rawPayload: unknown,
  source: string,
  options: ParseDrawOptions = {},
): ParseResult {
  const gameId = options.gameId ?? 'bingo18';

  if (isMockPayload(rawPayload)) {
    return parseSuccess(
      buildDrawFromMock(rawPayload, source, gameId, options.rawResponse ?? null),
      rawPayload,
    );
  }

  if (isBingo18ListPayload(rawPayload)) {
    if (rawPayload.draws.length === 0) {
      return parseFailure(rawPayload, ['Empty bingo18 draw list']);
    }
    return parseBingo18RawDraw(rawPayload.draws[0], source, options);
  }

  return parseFailure(rawPayload, ['Unsupported payload shape — configure parser for source']);
}

/** Parse all draws from a bingo18-list payload — skips invalid entries. */
export function parseBingo18DrawBatch(
  rawPayload: unknown,
  source: string,
  options: ParseDrawOptions = {},
): { draws: DrawResult[]; errors: string[] } {
  if (!isBingo18ListPayload(rawPayload)) {
    return { draws: [], errors: ['Not a bingo18-list payload'] };
  }

  const collectedAt = new Date().toISOString();
  const draws: DrawResult[] = [];
  const errors: string[] = [];

  for (const raw of rawPayload.draws) {
    const result = parseBingo18RawDraw(raw, source, { ...options, rawResponse: null }, collectedAt);
    if (result.success && result.draw !== undefined) {
      draws.push(result.draw);
    } else {
      errors.push(...result.errors);
    }
  }

  draws.sort((a, b) => new Date(a.drawAt).getTime() - new Date(b.drawAt).getTime());

  if (draws.length > 0 && options.rawResponse != null) {
    const last = draws[draws.length - 1];
    draws[draws.length - 1] = { ...last, rawResponse: options.rawResponse };
  }
  return { draws, errors };
}

export function isBingo18BatchPayload(rawPayload: unknown): boolean {
  return isBingo18ListPayload(rawPayload);
}
