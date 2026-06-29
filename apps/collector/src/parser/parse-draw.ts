import { randomUUID } from 'node:crypto';

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

export function parseDrawPayload(
  rawPayload: unknown,
  source: string,
  gameId = 'bingo18',
): ParseResult {
  if (!isMockPayload(rawPayload)) {
    return parseFailure(rawPayload, ['Unsupported payload shape — configure parser for source']);
  }

  const collectedAt = new Date().toISOString();
  const publishedAt = rawPayload.publishedAt;
  const latencyMs = Math.max(
    0,
    new Date(collectedAt).getTime() - new Date(publishedAt).getTime(),
  );
  const dice = rawPayload.dice;
  const total = diceTotal(dice);

  const draw: DrawResult = {
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

  return parseSuccess(draw, rawPayload);
}
