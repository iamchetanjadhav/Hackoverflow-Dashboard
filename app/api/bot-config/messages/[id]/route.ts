/**
 * app/api/bot-config/messages/[id]/route.ts
 * PATCH  — toggle active / update fields
 * DELETE — remove a scheduled message
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body    = await req.json();
    const client  = await clientPromise;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const $set: Record<string, any> = { updatedAt: new Date() };
    if (typeof body.active         !== 'undefined') $set.active         = body.active;
    if (typeof body.name           !== 'undefined') $set.name           = body.name;
    if (typeof body.content        !== 'undefined') $set.content        = body.content;
    if (typeof body.embedTitle     !== 'undefined') $set.embedTitle     = body.embedTitle;
    if (typeof body.embedColor     !== 'undefined') $set.embedColor     = body.embedColor;
    if (typeof body.channelId      !== 'undefined') $set.channelId      = body.channelId;
    if (typeof body.cronExpression !== 'undefined') $set.cronExpression = body.cronExpression;

    const result = await client
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(id) }, { $set });

    if (result.matchedCount === 0)
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticate();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const client = await clientPromise;
    const result = await client
      .db(DB_NAME)
      .collection(COLL)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}