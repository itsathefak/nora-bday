import type { HeartPingSender } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type SenderRecord = {
  sentAt: number[];
  lastSentAt?: number;
};

type FailureRecord = {
  failedAt: number[];
};

const senderRecords = new Map<string, SenderRecord>();
const failureRecords = new Map<string, FailureRecord>();
const idempotencyRecords = new Map<string, { sendId: string; createdAt: number }>();

function prune(values: number[], cutoff: number) {
  return values.filter((value) => value > cutoff);
}

function senderKey(sender: HeartPingSender, identity: string) {
  return `${sender}:${identity}`;
}

export function checkHeartPingRateLimit(sender: HeartPingSender, identity: string) {
  const now = Date.now();
  const key = senderKey(sender, identity);
  const record = senderRecords.get(key) ?? { sentAt: [] };
  record.sentAt = prune(record.sentAt, now - DAY_MS);
  senderRecords.set(key, record);

  if (record.lastSentAt && now - record.lastSentAt < TEN_MINUTES_MS) {
    return { allowed: false };
  }

  if (record.sentAt.length >= 3) {
    return { allowed: false };
  }

  return { allowed: true };
}

export function recordHeartPingSend(sender: HeartPingSender, identity: string) {
  const now = Date.now();
  const key = senderKey(sender, identity);
  const record = senderRecords.get(key) ?? { sentAt: [] };
  record.sentAt = prune(record.sentAt, now - DAY_MS);
  record.sentAt.push(now);
  record.lastSentAt = now;
  senderRecords.set(key, record);
}

export function checkFailedAttemptLimit(identity: string) {
  const now = Date.now();
  const record = failureRecords.get(identity) ?? { failedAt: [] };
  record.failedAt = prune(record.failedAt, now - HOUR_MS);
  failureRecords.set(identity, record);
  return record.failedAt.length < 5;
}

export function recordFailedAttempt(identity: string) {
  const now = Date.now();
  const record = failureRecords.get(identity) ?? { failedAt: [] };
  record.failedAt = prune(record.failedAt, now - HOUR_MS);
  record.failedAt.push(now);
  failureRecords.set(identity, record);
}

export function getIdempotentSend(idempotencyKey: string) {
  const now = Date.now();
  const existing = idempotencyRecords.get(idempotencyKey);
  if (!existing) return null;
  if (existing.createdAt < now - DAY_MS) {
    idempotencyRecords.delete(idempotencyKey);
    return null;
  }
  return existing.sendId;
}

export function recordIdempotentSend(idempotencyKey: string, sendId: string) {
  idempotencyRecords.set(idempotencyKey, { sendId, createdAt: Date.now() });
}
