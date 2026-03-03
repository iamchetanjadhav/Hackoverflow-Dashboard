'use server';

import nodemailer from 'nodemailer';
import type { BackupLogEntry } from '@/actions/backup-log';

// ─── Snapshots ─────────────────────────────────────────────────────────────────

export interface BotConfigSnapshot {
  version:    number;
  updatedAt:  string | null;
  updatedBy:  string | null;
  healthy:    boolean;
  fieldCount?: number;
}

export interface BotStatusSnapshot {
  online:     boolean;
  lastSeen:   string | null;
  tag:        string | null;
  ping:       number | null;
  guildCount: number | null;
  startedAt:  string | null;
  staleMs?:   number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST  ?? 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT ?? 587),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(d: Date | string): string {
  return new Date(d).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }) + ' IST';
}

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5)    return 'just now';
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function pingColor(ms: number | null): string {
  if (ms === null) return '#666';
  if (ms < 100)   return '#4ade80';
  if (ms < 300)   return '#f6ad55';
  return '#f87171';
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function sendHourlyBackupReport(
  logs:       BackupLogEntry[],
  recipient:  string,
  botConfig?: BotConfigSnapshot,
  botStatus?: BotStatusSnapshot,
): Promise<void> {
  const transporter = createTransport();

  const succeeded  = logs.filter(l => l.success);
  const failed     = logs.filter(l => !l.success);
  const statusLabel =
    failed.length === 0           ? 'ALL PASSED' :
    failed.length === logs.length ? 'ALL FAILED'  : 'PARTIAL FAILURE';

  // ── Backup log rows ─────────────────────────────────────────────────────────
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

  // ── Summary stat cards ──────────────────────────────────────────────────────
  const statCards = [
    { label: 'TOTAL BACKUPS', value: logs.length,      color: '#fff'    },
    { label: 'SUCCEEDED',     value: succeeded.length, color: '#4ade80' },
    { label: 'FAILED',        value: failed.length,    color: failed.length ? '#f87171' : '#666' },
  ].map(s => `
    <td style="padding:16px 20px;border:1px solid rgba(255,255,255,0.08);text-align:center;width:33%;">
      <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.12em;margin-bottom:6px">${s.label}</div>
      <div style="font-family:monospace;font-size:26px;font-weight:900;color:${s.color}">${s.value}</div>
    </td>`).join('');

  // ── Bot Status Section ──────────────────────────────────────────────────────
  let botStatusSection = '';
  if (botStatus) {
    const online       = botStatus.online;
    const dotColor     = online ? '#4ade80' : '#f87171';
    const statusText   = online ? 'ONLINE'  : 'OFFLINE';
    const statusBg     = online ? '#0d1f0d' : '#1f0d0d';
    const borderColor  = online ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';

    // Build stat pills
    const pills: string[] = [];

    if (botStatus.tag) {
      pills.push(`
        <td style="padding:12px 16px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
          <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;margin-bottom:4px">BOT TAG</div>
          <div style="font-family:monospace;font-size:14px;font-weight:700;color:#fff">${botStatus.tag}</div>
        </td>`);
    }

    if (botStatus.ping !== null) {
      pills.push(`
        <td style="padding:12px 16px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
          <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;margin-bottom:4px">PING</div>
          <div style="font-family:monospace;font-size:14px;font-weight:700;color:${pingColor(botStatus.ping)}">${botStatus.ping}ms</div>
        </td>`);
    }

    if (botStatus.guildCount !== null) {
      pills.push(`
        <td style="padding:12px 16px;border:1px solid rgba(255,255,255,0.08);text-align:center;">
          <div style="font-family:monospace;font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.1em;margin-bottom:4px">SERVERS</div>
          <div style="font-family:monospace;font-size:14px;font-weight:700;color:#fff">${botStatus.guildCount}</div>
        </td>`);
    }

    const lastSeenLine = !online && botStatus.lastSeen
      ? `<div style="font-family:monospace;font-size:11px;color:#f87171;opacity:0.7;margin-top:6px">
           Last seen: ${formatTime(botStatus.lastSeen)} (${relTime(botStatus.lastSeen)})
         </div>`
      : '';

    const startedLine = online && botStatus.startedAt
      ? `<div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px">
           Up since: ${formatTime(botStatus.startedAt)}
         </div>`
      : '';

    const pillsHtml = pills.length > 0
      ? `<table style="border-collapse:separate;border-spacing:6px;margin-top:14px;">
           <tbody><tr>${pills.join('')}</tr></tbody>
         </table>`
      : '';

    botStatusSection = `
      <!-- Bot Status Section -->
      <div style="margin-top:12px;border:1px solid ${borderColor};background:${statusBg};padding:20px 24px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.14em;color:rgba(255,255,255,0.3);margin-bottom:10px">
          BOT RUNTIME STATUS
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${dotColor};"></span>
          <span style="font-family:monospace;font-size:20px;font-weight:900;color:${dotColor};">${statusText}</span>
        </div>
        ${lastSeenLine}
        ${startedLine}
        ${pillsHtml}
      </div>`;
  }

  // ── Bot Config Section ──────────────────────────────────────────────────────
  let botConfigSection = '';
  if (botConfig) {
    const cfgColor  = botConfig.healthy ? '#4ade80' : '#f87171';
    const cfgText   = botConfig.healthy ? 'HEALTHY' : 'UNREACHABLE';
    const cfgBg     = botConfig.healthy ? '#0d1f0d' : '#1f0d0d';
    const cfgBorder = botConfig.healthy ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';

    const authorLine = botConfig.updatedBy && botConfig.updatedBy !== 'unknown'
      ? `<span style="color:rgba(255,255,255,0.35);font-family:monospace;font-size:11px"> · by ${botConfig.updatedBy}</span>`
      : '';

    const updatedLine = botConfig.updatedAt
      ? `<div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px">
           Last saved: ${formatTime(botConfig.updatedAt)}${authorLine}
         </div>`
      : '';

    const fieldCountLine = botConfig.fieldCount != null
      ? `<div style="font-family:monospace;font-size:11px;color:rgba(255,255,255,0.28);margin-top:2px">
           ${botConfig.fieldCount} top-level fields in config
         </div>`
      : '';

    botConfigSection = `
      <!-- Bot Config Section -->
      <div style="margin-top:12px;border:1px solid ${cfgBorder};background:${cfgBg};padding:20px 24px;">
        <div style="font-family:monospace;font-size:10px;letter-spacing:0.14em;color:rgba(255,255,255,0.3);margin-bottom:10px">
          BOT CONFIG STATUS
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
              <span style="font-family:monospace;font-size:18px;font-weight:900;color:#fff;">
                v${botConfig.version}
              </span>
              <span style="font-family:monospace;font-size:11px;font-weight:700;color:${cfgColor};
                border:1px solid ${cfgColor};padding:2px 8px;opacity:0.85;">
                ● ${cfgText}
              </span>
            </div>
            ${updatedLine}
            ${fieldCountLine}
          </div>
        </div>
      </div>`;
  }

  // ── Full HTML ───────────────────────────────────────────────────────────────
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
      <div style="font-family:monospace;font-size:10px;letter-spacing:0.14em;color:rgba(255,255,255,0.3);margin-bottom:8px;text-transform:uppercase">
        Hackoverflow // Hourly System Report
      </div>
      <h1 style="margin:0 0 4px;font-size:24px;font-weight:900;letter-spacing:-0.03em;color:#fff">
        Backup &amp; Bot Health Summary
      </h1>
      <p style="margin:4px 0 0;font-family:monospace;font-size:12px;color:rgba(255,255,255,0.4)">
        Period ending ${formatTime(new Date())} &nbsp;&middot;&nbsp;
        <span style="color:${failed.length === 0 ? '#4ade80' : failed.length === logs.length ? '#f87171' : '#facc15'}">${statusLabel}</span>
      </p>

      <!-- Backup stat cards -->
      <table class="stat-table" style="width:100%;border-collapse:separate;border-spacing:8px;margin-top:20px;">
        <tbody><tr>${statCards}</tr></tbody>
      </table>
    </div>

    <!-- Bot Runtime Status -->
    ${botStatusSection}

    <!-- Bot Config Status -->
    ${botConfigSection}

    <!-- Divider label -->
    <div style="margin-top:16px;margin-bottom:4px;font-family:monospace;font-size:10px;
      letter-spacing:0.14em;color:rgba(255,255,255,0.25);padding-left:2px;">
      DATABASE BACKUP LOG
    </div>

    <!-- Log table or empty state -->
    ${logs.length === 0
      ? `<div style="border:1px solid rgba(250,204,21,0.3);background:rgba(250,204,21,0.05);padding:24px;font-family:monospace;font-size:13px;color:#facc15;line-height:1.6">
           NO BACKUPS WERE RECORDED IN THIS HOUR<br/>
           <span style="color:rgba(255,255,255,0.3);font-size:11px">Check GitHub Actions and cron configuration.</span>
         </div>`
      : `<div class="log-wrap" style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
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
    <div class="footer-box" style="margin-top:12px;border:1px solid rgba(255,255,255,0.06);padding:20px;
      font-family:monospace;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8">
      Automated report &middot; Hackoverflow Dashboard &middot; Logs stored in MongoDB backup_logs collection<br/>
      Times shown in IST (Asia/Kolkata)
    </div>

  </div>
</body>
</html>`;

  // ── Subject line ────────────────────────────────────────────────────────────
  const botOnlineIndicator = botStatus
    ? (botStatus.online ? ' · Bot ✓' : ' · Bot ✗')
    : '';

  const subject = logs.length === 0
    ? `[Hackoverflow] No backups recorded — Config ${botConfig ? `v${botConfig.version}` : ''}${botOnlineIndicator} — ${formatTime(new Date())}`
    : `[Hackoverflow] ${succeeded.length}/${logs.length} backups OK — Config ${botConfig ? `v${botConfig.version}` : ''}${botOnlineIndicator} — ${formatTime(new Date())}`;

  await transporter.sendMail({
    from:    `"Hackoverflow Backup" <${process.env.EMAIL_USER}>`,
    to:      recipient,
    subject,
    html,
  });
}