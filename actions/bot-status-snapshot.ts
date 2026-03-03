'use server';

/**
 * Fetch the live bot heartbeat from MongoDB and return a BotStatusSnapshot.
 * The bot is expected to write a heartbeat document to the `bot_status` collection
 * (same one your /api/bot-config/status route reads from).
 *
 * Usage in your hourly cron/action:
 *
 *   import { getBotConfigSnapshot }  from '@/actions/bot-config-snapshot';
 *   import { getBotStatusSnapshot }  from '@/actions/bot-status-snapshot';
 *   import { sendHourlyBackupReport } from '@/actions/email-report';
 *
 *   const botSnap    = await getBotConfigSnapshot();
 *   const statusSnap = await getBotStatusSnapshot();
 *   await sendHourlyBackupReport(logs, recipient, botSnap, statusSnap);
 */

import clientPromise from '@/lib/mongodb';
import type { BotStatusSnapshot } from '@/actions/email-report';

const DB_NAME     = process.env.MONGODB_DB || 'hackoverflow';
const STATUS_COLL = 'bot_status';   // collection your bot upserts its heartbeat into
const STATUS_DOC  = 'heartbeat';    // _id of that document

/** Heartbeat older than this → bot is considered offline */
const STALE_MS = 2 * 60 * 1000; // 2 minutes

export async function getBotStatusSnapshot(): Promise<BotStatusSnapshot> {
  try {
    const client = await clientPromise;
    const doc = await client
      .db(DB_NAME)
      .collection(STATUS_COLL)
      .findOne({ _id: STATUS_DOC as never });

    if (!doc) {
      return { online: false, lastSeen: null, tag: null, ping: null, guildCount: null, startedAt: null };
    }

    // Resolve lastSeen — try common field names the bot might write
    const raw = doc.lastSeen ?? doc.updatedAt ?? doc.timestamp ?? null;
    const lastSeen: string | null =
      raw instanceof Date     ? raw.toISOString() :
      typeof raw === 'string' ? raw               : null;

    const staleMs  = lastSeen ? Date.now() - new Date(lastSeen).getTime() : undefined;
    const isOnline = typeof staleMs === 'number' && staleMs < STALE_MS;

    const rawStarted = doc.startedAt ?? null;
    const startedAt: string | null =
      rawStarted instanceof Date     ? rawStarted.toISOString() :
      typeof rawStarted === 'string' ? rawStarted               : null;

    return {
      online:     isOnline,
      lastSeen,
      tag:        typeof doc.tag        === 'string' ? doc.tag        : null,
      ping:       typeof doc.ping       === 'number' ? doc.ping       : null,
      guildCount: typeof doc.guildCount === 'number' ? doc.guildCount : null,
      startedAt,
      staleMs,
    };
  } catch {
    return { online: false, lastSeen: null, tag: null, ping: null, guildCount: null, startedAt: null };
  }
}