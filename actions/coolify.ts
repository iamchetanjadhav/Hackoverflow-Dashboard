'use server';

const FREQ_TO_CRON: Record<string, string> = {
  '5min':   '*/5 * * * *',
  '10min':  '*/10 * * * *',
  '20min':  '*/20 * * * *',
  'manual': '0 0 31 2 *', // Feb 31 — never runs naturally
};

export async function updateBackupFrequency(freq: string): Promise<{ ok: boolean; error?: string }> {
  const baseUrl  = process.env.COOLIFY_BASE_URL;
  const token    = process.env.COOLIFY_API_TOKEN;
  const taskUuid = process.env.COOLIFY_BACKUP_TASK_UUID;

  if (!baseUrl || !token || !taskUuid) {
    return { ok: false, error: 'Missing COOLIFY_BASE_URL, COOLIFY_API_TOKEN, or COOLIFY_BACKUP_TASK_UUID env variables' };
  }

  const cron = FREQ_TO_CRON[freq];
  if (!cron) {
    return { ok: false, error: `Unknown frequency: ${freq}` };
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/scheduled-tasks/${taskUuid}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify({ frequency: cron }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[updateBackupFrequency] Coolify error:', res.status, text);
      return { ok: false, error: `Coolify API returned ${res.status}: ${text}` };
    }

    return { ok: true };
  } catch (err) {
    console.error('[updateBackupFrequency] Fetch error:', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}