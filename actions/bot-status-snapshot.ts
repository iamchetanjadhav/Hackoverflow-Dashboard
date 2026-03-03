'use server';

import clientPromise from '@/lib/mongodb';
import type { BotStatusSnapshot } from '@/actions/email-report';

const DB_NAME     = process.env.MONGODB_DB || 'hackoverflow';
const STATUS_COLL = 'bot_status';
const STATUS_DOC  = 'kernel-bot';       // ← was 'heartbeat'
const STALE_MS    = 2 * 60 * 1000;

export async function getBotStatusSnapshot(): Promise<BotStatusSnapshot> {
  const empty: BotStatusSnapshot = {
    online: false, lastSeen: null, tag: null,
    ping: null, guildCount: null, startedAt: null,
  };

  try {
    const client = await clientPromise;
    const doc    = await client
      .db(DB_NAME)
      .collection(STATUS_COLL)
      .findOne({ _id: STATUS_DOC as never });

    if (!doc) {
      console.warn('[getBotStatusSnapshot] no document found with _id:', STATUS_DOC);
      return empty;
    }

    const rawSeen  = doc.lastSeen ?? doc.updatedAt ?? doc.timestamp ?? null;
    const lastSeen: string | null =
      rawSeen instanceof Date     ? rawSeen.toISOString() :
      typeof rawSeen === 'string' ? rawSeen : null;

    const staleMs  = lastSeen ? Date.now() - new Date(lastSeen).getTime() : undefined;

    // Bot writes `alive`, not `online` — respect it AND check staleness
    const isOnline =
      doc.alive === true &&
      typeof staleMs === 'number' &&
      staleMs < STALE_MS;

    const rawStarted = doc.startedAt ?? null;
    const startedAt: string | null =
      rawStarted instanceof Date     ? rawStarted.toISOString() :
      typeof rawStarted === 'string' ? rawStarted : null;

    return {
      online:     isOnline,
      lastSeen,
      tag:        typeof doc.tag        === 'string' ? doc.tag        : null,
      ping:       typeof doc.ping       === 'number' ? doc.ping       : null,
      guildCount: typeof doc.guildCount === 'number' ? doc.guildCount : null,
      startedAt,
      staleMs,
    };
  } catch (err) {
    console.error('[getBotStatusSnapshot] error:', err);
    return empty;
  }
}