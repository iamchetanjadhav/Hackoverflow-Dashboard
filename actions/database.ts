'use server';

import { getClient } from '@/lib/mongodb';
import { DBParticipant } from '@/types';
import { ObjectId } from 'mongodb';

const DB_NAME = 'hackoverflow';
const COLLECTION_NAME = 'participants';

// ── Password ──────────────────────────────────────────────────────────────────
const DB_PASSWORD = process.env.DB_PAGE_PASSWORD ?? 'hackoverflow-db-2024';

export async function verifyDbPassword(password: string): Promise<boolean> {
  return password === DB_PASSWORD;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
type ParticipantDocument = Omit<DBParticipant, '_id'> & {
  _id?: ObjectId;
};

async function getCollection() {
  const client = await getClient();   // ← getClient() instead of clientPromise
  const db = client.db(DB_NAME);
  return db.collection<ParticipantDocument>(COLLECTION_NAME);
}

const escapeCell = (v: unknown): string => {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const CSV_HEADERS = [
  'participantId',
  'name',
  'email',
  'phone',
  'role',
  'teamName',
  'institute',
  'labAllotted',
  'wifiSSID',
  'wifiPassword',
  'collegeCheckIn',
  'collegeCheckInTime',
  'labCheckIn',
  'labCheckInTime',
  'collegeCheckOut',
  'collegeCheckOutTime',
  'tempLabCheckOut',
  'tempLabCheckOutTime',
  'createdAt',
  'updatedAt',
] as const;

// ── Export ────────────────────────────────────────────────────────────────────
export async function exportDatabaseAsCSV(): Promise<{ csv: string; count: number }> {
  try {
    const collection = await getCollection();
    const participants = await collection.find({}).sort({ createdAt: -1 }).toArray();

    const rows = participants.map(p =>
      [
        p.participantId,
        p.name,
        p.email,
        p.phone,
        p.role,
        p.teamName,
        p.institute,
        p.labAllotted,
        p.wifiCredentials?.ssid,
        p.wifiCredentials?.password,
        p.collegeCheckIn?.status ?? false,
        p.collegeCheckIn?.time  ? new Date(p.collegeCheckIn.time).toISOString()  : '',
        p.labCheckIn?.status    ?? false,
        p.labCheckIn?.time      ? new Date(p.labCheckIn.time).toISOString()      : '',
        p.collegeCheckOut?.status  ?? false,
        p.collegeCheckOut?.time    ? new Date(p.collegeCheckOut.time).toISOString()    : '',
        p.tempLabCheckOut?.status  ?? false,
        p.tempLabCheckOut?.time    ? new Date(p.tempLabCheckOut.time).toISOString()    : '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
        p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
      ]
        .map(escapeCell)
        .join(',')
    );

    const csv = [CSV_HEADERS.join(','), ...rows].join('\n');
    return { csv, count: participants.length };
  } catch (error) {
    console.error('Error exporting database:', error);
    throw new Error('Failed to export database');
  }
}

// ── Import — upsert by participantId via bulkWrite ────────────────────────────
export interface ImportResult {
  upserted: number;
  modified: number;
  errors: string[];
}

export async function upsertParticipantsFromCSV(
  headers: string[],
  rows: string[][]
): Promise<ImportResult> {
  try {
    const collection = await getCollection();
    const now = new Date();
    const errors: string[] = [];

    const ops = rows
      .map((row, idx) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h.trim()] = (row[i] ?? '').trim(); });

        const participantId = obj.participantId;
        if (!participantId) {
          errors.push(`Row ${idx + 2}: missing participantId — skipped`);
          return null;
        }

        const doc: Omit<ParticipantDocument, '_id'> = {
          participantId,
          name:        obj.name  ?? '',
          email:       obj.email ?? '',
          phone:       obj.phone      || undefined,
          role:        obj.role       || undefined,
          teamName:    obj.teamName   || undefined,
          institute:   obj.institute  || undefined,
          labAllotted: obj.labAllotted || undefined,
          wifiCredentials:
            obj.wifiSSID || obj.wifiPassword
              ? { ssid: obj.wifiSSID || undefined, password: obj.wifiPassword || undefined }
              : undefined,
          collegeCheckIn: {
            status: obj.collegeCheckIn === 'true',
            time:   obj.collegeCheckInTime  ? new Date(obj.collegeCheckInTime)  : undefined,
          },
          labCheckIn: {
            status: obj.labCheckIn === 'true',
            time:   obj.labCheckInTime      ? new Date(obj.labCheckInTime)      : undefined,
          },
          collegeCheckOut: {
            status: obj.collegeCheckOut === 'true',
            time:   obj.collegeCheckOutTime ? new Date(obj.collegeCheckOutTime) : undefined,
          },
          tempLabCheckOut: {
            status: obj.tempLabCheckOut === 'true',
            time:   obj.tempLabCheckOutTime ? new Date(obj.tempLabCheckOutTime) : undefined,
          },
          createdAt: obj.createdAt ? new Date(obj.createdAt) : now,
          updatedAt: now,
        };

        return {
          updateOne: {
            filter: { participantId },
            update: {
              $set: doc,
              $setOnInsert: { createdAt: doc.createdAt },
            },
            upsert: true,
          },
        };
      })
      .filter(Boolean);

    if (ops.length === 0) return { upserted: 0, modified: 0, errors };

    const result = await collection.bulkWrite(ops as Parameters<typeof collection.bulkWrite>[0], { ordered: false });
    return {
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      errors,
    };
  } catch (error) {
    console.error('Error importing participants:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to import participants'
    );
  }
}

// ── Live stats ────────────────────────────────────────────────────────────────
export interface DbStats {
  total: number;
  collegeCheckedIn: number;
  labCheckedIn: number;
  checkedOut: number;
}

export async function getDbStats(): Promise<DbStats> {
  try {
    const collection = await getCollection();
    const [total, collegeCheckedIn, labCheckedIn, checkedOut] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ 'collegeCheckIn.status':  true }),
      collection.countDocuments({ 'labCheckIn.status':      true }),
      collection.countDocuments({ 'collegeCheckOut.status': true }),
    ]);
    return { total, collegeCheckedIn, labCheckedIn, checkedOut };
  } catch (error) {
    console.error('Error fetching DB stats:', error);
    throw new Error('Failed to fetch database stats');
  }
}