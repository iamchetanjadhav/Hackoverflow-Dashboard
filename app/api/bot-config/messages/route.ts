/**
 * app/api/bot-config/messages/route.ts
 * GET  — list all scheduled messages
 * POST — create a new scheduled message
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = process.env.MONGODB_DB || 'hackoverflow';
const COLL    = 'scheduled_messages';

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  try { return verifyToken(token); } catch { return null; }
}

export async function GET() {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = await clientPromise;
    const messages = await client
      .db(DB_NAME)
      .collection(COLL)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, channelId, content, embedTitle, embedColor, scheduleType, cronExpression, sendAt, messageFormat } = body;

    if (!name?.trim())      return NextResponse.json({ error: 'Name is required' },       { status: 400 });
    if (!channelId?.trim()) return NextResponse.json({ error: 'Channel ID is required' }, { status: 400 });
    if (!content?.trim() && !embedTitle?.trim())
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    if (scheduleType === 'recurring' && !cronExpression?.trim())
      return NextResponse.json({ error: 'Cron expression is required for recurring messages' }, { status: 400 });
    if (scheduleType === 'once' && !sendAt)
      return NextResponse.json({ error: 'Send time is required for one-time messages' }, { status: 400 });

    const doc = {
      _id:           new ObjectId(),
      name:          name.trim(),
      channelId:     channelId.trim(),
      messageFormat: messageFormat ?? 'plain',
      content:       content?.trim() ?? '',
      embedTitle:    embedTitle?.trim() ?? '',
      embedColor:    embedColor ?? '#FF6B35',
      scheduleType,
      cronExpression: scheduleType === 'recurring' ? cronExpression.trim() : null,
      sendAt:         scheduleType === 'once' ? new Date(sendAt) : null,
      active:        true,
      sent:          false,
      sentCount:     0,
      lastSentAt:    null,
      createdAt:     new Date(),
      createdBy:     (user as { email?: string }).email ?? 'unknown',
    };

    const client = await clientPromise;
    await client.db(DB_NAME).collection(COLL).insertOne(doc);

    return NextResponse.json({ success: true, message: 'Scheduled message created', id: doc._id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}