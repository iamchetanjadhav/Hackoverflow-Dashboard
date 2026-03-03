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
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

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