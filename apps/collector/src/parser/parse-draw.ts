import { randomUUID } from 'node:crypto';

import type { Bingo18ListPayload, Bingo18RawDraw } from '../adapter/bingo18-adapter.js';
import {
  classifySmallLarge,
  detectFlower,
  diceTotal,
  type DrawResult,
} from '../types/draw-result.js';
import { parseFailure, parseSuccess, type ParseResult } from '../types/parse-result.js';

interface MockRawPayload {
  readonly kind: 'mock';
  readonly drawNumber: string;
  readonly drawTime: string;
  readonly publishedAt: string;
  readonly dice: [number, number, number];
}

function isMockPayload(value: unknown): value is MockRawPayload {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    o['kind'] === 'mock' &&
    typeof o['drawNumber'] === 'string' &&
    typeof o['drawTime'] === 'string' &&
    Array.isArray(o['dice']) &&
    o['dice'].length === 3
  );
}

function isBingo18ListPayload(value: unknown): value is Bingo18ListPayload {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return o['kind'] === 'bingo18-list' && Array.isArray(o['draws']);
}

/** Stable unique key — bingo18 API has no official draw number. */
export function drawNumberFromDrawAt(drawAt: string): string {
  return drawAt;
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
  gameId = 'bingo18',
  collectedAt = new Date().toISOString(),
): ParseResult {
  const dice = parseWinningResult(raw.winningResult);
  if (dice === null) {
    return parseFailure(raw, [`Invalid winningResult: ${raw.winningResult}`]);
  }

  const drawTime = raw.drawAt;
  const publishedAt: string | null = null;
  const latencyMs = 0;
  const total = diceTotal(dice);

  const draw: DrawResult = {
    id: randomUUID(),
    gameId,
    marketVersion: 1,
    drawNumber: drawNumberFromDrawAt(drawTime),
    drawTime,
    publishedAt,
    collectedAt,
    latencyMs,
    dice,
    total,
    flower: detectFlower(dice),
    smallLarge: classifySmallLarge(total),
    rawPayload: raw,
    source,
  };

  return parseSuccess(draw, raw);
}

function buildDrawFromMock(
  rawPayload: MockRawPayload,
  source: string,
  gameId: string,
): DrawResult {
  const collectedAt = new Date().toISOString();
  const publishedAt = rawPayload.publishedAt;
  const latencyMs = Math.max(
    0,
    new Date(collectedAt).getTime() - new Date(publishedAt).getTime(),
  );
  const dice = rawPayload.dice;
  const total = diceTotal(dice);

  return {
    id: randomUUID(),
    gameId,
    marketVersion: 1,
    drawNumber: rawPayload.drawNumber,
    drawTime: rawPayload.drawTime,
    publishedAt,
    collectedAt,
    latencyMs,
    dice,
    total,
    flower: detectFlower(dice),
    smallLarge: classifySmallLarge(total),
    rawPayload,
    source,
  };
}

/** Parse a single draw payload (mock or latest from bingo18-list). */
export function parseDrawPayload(
  rawPayload: unknown,
  source: string,
  gameId = 'bingo18',
): ParseResult {
  if (isMockPayload(rawPayload)) {
    return parseSuccess(buildDrawFromMock(rawPayload, source, gameId), rawPayload);
  }

  if (isBingo18ListPayload(rawPayload)) {
    if (rawPayload.draws.length === 0) {
      return parseFailure(rawPayload, ['Empty bingo18 draw list']);
    }
    return parseBingo18RawDraw(rawPayload.draws[0], source, gameId);
  }

  return parseFailure(rawPayload, ['Unsupported payload shape — configure parser for source']);
}

/** Parse all draws from a bingo18-list payload — skips invalid entries. */
export function parseBingo18DrawBatch(
  rawPayload: unknown,
  source: string,
  gameId = 'bingo18',
): { draws: DrawResult[]; errors: string[] } {
  if (!isBingo18ListPayload(rawPayload)) {
    return { draws: [], errors: ['Not a bingo18-list payload'] };
  }

  const collectedAt = new Date().toISOString();
  const draws: DrawResult[] = [];
  const errors: string[] = [];

  for (const raw of rawPayload.draws) {
    const result = parseBingo18RawDraw(raw, source, gameId, collectedAt);
    if (result.success && result.draw !== undefined) {
      draws.push(result.draw);
    } else {
      errors.push(...result.errors);
    }
  }

  draws.sort((a, b) => new Date(a.drawTime).getTime() - new Date(b.drawTime).getTime());
  return { draws, errors };
}

export function isBingo18BatchPayload(rawPayload: unknown): boolean {
  return isBingo18ListPayload(rawPayload);
}
