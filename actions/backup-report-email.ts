'use server';

import nodemailer from 'nodemailer';
import type { BackupLogEntry } from '@/actions/backup-log';

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST  ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }) + ' IST';
}

export async function sendHourlyBackupReport(
  logs:      BackupLogEntry[],
  recipient: string,
): Promise<void> {
  const transporter = createTransport();

  const succeeded = logs.filter(l => l.success);
  const failed    = logs.filter(l => !l.success);
  const statusLabel =
    failed.length === 0        ? 'ALL PASSED' :
    failed.length === logs.length ? 'ALL FAILED'  : 'PARTIAL FAILURE';

  const rows = logs.map(l => {
    const bg    = l.success ? '#0d1f0d' : '#1f0d0d';
    const badge = l.success
      ? '<span style="color:#4ade80;font-weight:700;font-family:monospace;font-size:12px">SUCCESS</span>'
      : '<span style="color:#f87171;font-weight:700;font-family:monospace;font-size:12px">FAILED</span>';
    const driveCell = l.driveUrl
      ? `<a href="${l.driveUrl}" style="color:#60a5fa;font-family:monospace;font-size:12px">Open</a>`
      : '—';
    return `
      <tr style="background:${bg};border-bottom:1px solid #1a1a1a;">
        <td style="padding:10px 14px;font-family:monospace;font-size:12px;color:#aaa;white-space:nowrap">${formatTime(l.time)}</td>
        <td style="padding:10px 14px">${badge}</td>
        <td style="padding:10px 14px;font-family:monospace;font-size:12px;color:#ccc">${l.count ?? '—'}</td>
        <td style="padding:10px 14px">${driveCell}</td>
        <td style="padding:10px 14px;font-family:monospace;font-size:12px;color:#666">${formatDuration(l.duration)}</td>
        <td style="padding:10px 14px;font-family:monospace;font-size:12px;color:#f87171;max-width:200px;word-break:break-word">${l.error ?? ''}</td>
      </tr>`;
  }).join('');

  const statCards = [
    { label: 'TOTAL BACKUPS', value: logs.length,       color: '#fff'    },
    { label: 'SUCCEEDED',     value: succeeded.length,  color: '#4ade80' },
    { label: 'FAILED',        value: failed.length,     color: failed.length ? '#f87171' : '#666' },
  ].map(s => `
    <td style="padding:16px 20px;border:1px solid rgba(255,255,255,0.08);text-align:center;width:33%;">
      <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.12em;margin-bottom:6px">${s.label}</div>
      <div style="font-family:monospace;font-size:26px;font-weight:900;color:${s.color}">${s.value}</div>
    </td>`).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media only screen and (max-width: 600px) {
      .outer-wrap  { padding: 0 8px !important; }
      .header-box  { padding: 20px 16px !important; }
      .stat-table  { display: block !important; width: 100% !important; }
      .stat-table tbody { display: block !important; }
      .stat-table tr    { display: flex !important; flex-wrap: wrap !important; }
      .stat-table td    { flex: 1 1 80px !important; padding: 12px 10px !important; }
      .log-wrap    { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
      .log-table   { min-width: 560px !important; }
      .footer-box  { padding: 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:system-ui,sans-serif;">
  <div class="outer-wrap" style="max-width:760px;margin:32px auto;padding:0 16px;">

    <!-- Header -->
    <div class="header-box" style="border:1px solid rgba(255,255,255,0.09);padding:32px;">
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.14em;color:rgba(255,255,255,0.3);margin-bottom:8px;text-transform:uppercase">Hackoverflow // Database Backup Report</div>
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff">Hourly Backup Summary</h1>
      <p style="margin:4px 0 0;font-family:monospace;font-size:12px;color:rgba(255,255,255,0.4)">Period ending ${formatTime(new Date())} &nbsp;&middot;&nbsp; <span style="color:${failed.length === 0 ? '#4ade80' : failed.length === logs.length ? '#f87171' : '#facc15'}">${statusLabel}</span></p>

      <!-- Stat cards -->
      <table class="stat-table" style="width:100%;border-collapse:separate;border-spacing:8px;margin-top:20px;">
        <tbody><tr>${statCards}</tr></tbody>
      </table>
    </div>

    <!-- Log table or empty state -->
    ${logs.length === 0
      ? `<div style="border:1px solid rgba(250,204,21,0.3);background:rgba(250,204,21,0.05);padding:24px;margin-top:12px;font-family:monospace;font-size:13px;color:#facc15;line-height:1.6">
           NO BACKUPS WERE RECORDED IN THIS HOUR<br/>
           <span style="color:rgba(255,255,255,0.3);font-size:11px">Check GitHub Actions and cron configuration.</span>
         </div>`
      : `<div class="log-wrap" style="margin-top:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
           <table class="log-table" style="width:100%;border-collapse:collapse;font-size:13px;">
             <thead>
               <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
                 ${['TIME','STATUS','RECORDS','DRIVE','DURATION','ERROR']
                   .map(h => `<th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;white-space:nowrap">${h}</th>`)
                   .join('')}
               </tr>
             </thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`}

    <!-- Footer -->
    <div class="footer-box" style="margin-top:12px;border:1px solid rgba(255,255,255,0.06);padding:20px;font-family:monospace;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8">
      Automated report &middot; Hackoverflow Dashboard &middot; Logs stored in MongoDB backup_logs collection<br/>
      Times shown in IST (Asia/Kolkata)
    </div>

  </div>
</body>
</html>`;

  const subject = logs.length === 0
    ? `[Hackoverflow] No backups recorded in the last hour`
    : `[Hackoverflow] ${succeeded.length}/${logs.length} backups succeeded — ${formatTime(new Date())}`;

  await transporter.sendMail({
    from:    `"Hackoverflow Backup" <${process.env.EMAIL_USER}>`,
    to:      recipient,
    subject,
    html,
  });
}