'use server';

import { google } from 'googleapis';
import { Readable } from 'stream';
import { exportDatabaseAsCSV } from '@/actions/database';

export interface BackupResult {
  count:    number;
  filename: string;
  driveUrl: string;
  time:     string;
}

async function uploadToDrive(csv: string, filename: string): Promise<string> {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    requestBody: {
      name:    filename,
      mimeType: 'text/csv',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    },
    media: {
      mimeType: 'text/csv',
      body:     Readable.from([csv]),
    },
    fields: 'id, webViewLink',
  });

  return response.data.webViewLink ?? `https://drive.google.com/file/d/${response.data.id}/view`;
}

export async function backupToDrive(): Promise<BackupResult> {
  const { csv, count } = await exportDatabaseAsCSV();

  const now      = new Date();
  const ts       = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `hackoverflow-backup-${ts}.csv`;

  const driveUrl = await uploadToDrive(csv, filename);

  return { count, filename, driveUrl, time: now.toISOString() };
}