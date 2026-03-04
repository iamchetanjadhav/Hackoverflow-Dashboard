'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { getParticipants } from '@/actions/participants';
import { getSponsors } from '@/actions/sponsors';
import { sendEmailsAction } from '@/actions/email';
import { generateEmailAction } from '@/actions/generate-email';
import type { EmailContent } from '@/actions/generate-email';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recipient {
  name: string;
  email: string;
  role?: string;
  company?: string;       // maps to institute in DBParticipant
  phone?: string;
  teamName?: string;
  teamId?: string;
  projectName?: string;
  state?: string;
  labAllotted?: string;
  participantId?: string;
  selected: boolean;
}

type StatusType = 'idle' | 'info' | 'success' | 'error';
interface Status { text: string; type: StatusType }

// Available template variables shown in the UI
const TEMPLATE_VARS: { token: string; label: string; example: string }[] = [
  { token: '{{name}}',          label: 'Full Name',       example: 'Arjun Sharma'       },
  { token: '{{email}}',         label: 'Email',           example: 'arjun@vjti.ac.in'   },
  { token: '{{role}}',          label: 'Role',            example: 'Developer'           },
  { token: '{{company}}',       label: 'Institute',       example: 'VJTI Mumbai'         },
  { token: '{{phone}}',         label: 'Phone',           example: '+91 98765 43210'     },
  { token: '{{teamName}}',      label: 'Team Name',       example: 'Team Nebula'         },
  { token: '{{teamId}}',        label: 'Team ID',         example: 'TEAM-042'            },
  { token: '{{projectName}}',   label: 'Project Name',    example: 'NeuralBridge'        },
  { token: '{{state}}',         label: 'State',           example: 'Maharashtra'         },
  { token: '{{labAllotted}}',   label: 'Lab Allotted',    example: 'Lab B-204'           },
  { token: '{{participantId}}', label: 'Participant ID',  example: 'HO4-0123'            },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function personalizeHtml(html: string, r: Recipient): string {
  return html
    .replace(/\{\{name\}\}/g,          r.name          || '')
    .replace(/\{\{email\}\}/g,         r.email         || '')
    .replace(/\{\{role\}\}/g,          r.role          || '')
    .replace(/\{\{company\}\}/g,       r.company       || '')
    .replace(/\{\{phone\}\}/g,         r.phone         || '')
    .replace(/\{\{teamName\}\}/g,      r.teamName      || '')
    .replace(/\{\{teamId\}\}/g,        r.teamId        || '')
    .replace(/\{\{projectName\}\}/g,   r.projectName   || '')
    .replace(/\{\{state\}\}/g,         r.state         || '')
    .replace(/\{\{labAllotted\}\}/g,   r.labAllotted   || '')
    .replace(/\{\{participantId\}\}/g, r.participantId || '');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MailerPage() {
  const [subject,       setSubject]       = useState('');
  const [brief,         setBrief]         = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [previewHtml,   setPreviewHtml]   = useState('');
  const [recipients,    setRecipients]    = useState<Recipient[]>([]);
  const [search,        setSearch]        = useState('');
  const [generating,    setGenerating]    = useState(false);
  const [sending,       setSending]       = useState(false);
  const [status,        setStatus]        = useState<Status | null>(null);
  const [tab,           setTab]           = useState<'editor' | 'recipients'>('editor');
  const [previewIdx,    setPreviewIdx]    = useState(0);
  const [jsonOpen,      setJsonOpen]      = useState(false);
  const [emailContent,  setEmailContent]  = useState<EmailContent | null>(null);

  const selected = recipients.filter((r) => r.selected);
  const filtered = recipients.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.role    || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const setMsg = (text: string, type: StatusType = 'info') => setStatus({ text, type });

  // ── Recipient loading ──────────────────────────────────────────────────────

  const handleCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        const rows: Recipient[] = (r.data as Record<string, string>[])
          .map((row) => ({
            name:     row.name    || 'N/A',
            email:    row.email   || '',
            role:     row.role    || '',
            company:  row.company || '',
            phone:    row.phone   || '',
            selected: true,
          }))
          .filter((p) => p.email);
        setRecipients(rows);
        setMsg(`Loaded ${rows.length} recipients from ${file.name}`, 'success');
        setTab('recipients');
      },
      error: (err) => setMsg(`CSV error: ${err.message}`, 'error'),
    });
  };

  const loadParticipants = async () => {
    try {
      setMsg('Loading participants…');
      const raw = await getParticipants();
      const rows: Recipient[] = raw.map((p) => ({
        name:          p.name,
        email:         p.email,
        role:          p.role          || '',
        company:       p.institute     || '',
        phone:         p.phone         || '',
        teamName:      p.teamName      || '',
        teamId:        p.teamId        || '',
        projectName:   p.projectName   || '',
        state:         p.state         || '',
        labAllotted:   p.labAllotted   || '',
        participantId: p.participantId || '',
        selected:      true,
      }));
      setRecipients(rows);
      setMsg(`Loaded ${rows.length} participants`, 'success');
      setTab('recipients');
    } catch { setMsg('Failed to load participants', 'error'); }
  };

  const loadSponsors = async () => {
    try {
      setMsg('Loading sponsors…');
      const raw = await getSponsors();
      const rows: Recipient[] = raw.map((s) => ({
        name: s.name, email: s.email, role: s.role || '',
        company: s.companyName, phone: s.phone || '', selected: true,
      }));
      setRecipients(rows);
      setMsg(`Loaded ${rows.length} sponsors`, 'success');
      setTab('recipients');
    } catch { setMsg('Failed to load sponsors', 'error'); }
  };

  const toggle = (i: number) =>
    setRecipients((prev) => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleAll = (v: boolean) =>
    setRecipients((prev) => prev.map((r) => ({ ...r, selected: v })));

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!subject.trim()) { setMsg('Add a subject line first', 'error'); return; }
    if (!brief.trim())   { setMsg('Write your email brief first', 'error'); return; }
    setGenerating(true);
    setMsg('Generating with Groq…');
    try {
      const result = await generateEmailAction(subject, brief);
      if (!result.success || !result.html) throw new Error(result.error || 'Generation failed');
      setGeneratedHtml(result.html);
      if (result.content) setEmailContent(result.content);
      const target = selected[0] ?? {
        name: 'Preview Name', email: 'preview@example.com', role: 'Participant', company: 'Company', selected: true,
      };
      setPreviewHtml(personalizeHtml(result.html, target));
      setPreviewIdx(0);
      setMsg('Email generated — check the preview!', 'success');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // ── Preview cycling ────────────────────────────────────────────────────────

  const updatePreview = useCallback(
    (idx: number) => {
      if (!generatedHtml) return;
      const clamped = Math.max(0, Math.min(idx, selected.length - 1));
      setPreviewIdx(clamped);
      setPreviewHtml(personalizeHtml(generatedHtml, selected[clamped]));
    },
    [generatedHtml, selected]
  );

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!subject.trim())    { setMsg('Subject required', 'error');              return; }
    if (!generatedHtml)     { setMsg('Generate the email first', 'error');      return; }
    if (!selected.length)   { setMsg('Select at least one recipient', 'error'); return; }
    setSending(true);
    setMsg(`Sending to ${selected.length} recipients…`);
    try {
      const res = await sendEmailsAction(
        subject, generatedHtml,
        selected.map((r) => ({
          name:          r.name,
          email:         r.email,
          role:          r.role          || '',
          company:       r.company       || '',
          phone:         r.phone         || '',
          teamName:      r.teamName      || '',
          teamId:        r.teamId        || '',
          projectName:   r.projectName   || '',
          state:         r.state         || '',
          labAllotted:   r.labAllotted   || '',
          participantId: r.participantId || '',
        }))
      );
      setMsg(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        setSubject(''); setBrief(''); setGeneratedHtml(''); setPreviewHtml('');
        setRecipients([]); setEmailContent(null); setTab('editor');
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        .ml { padding: 2.5rem 3rem; }
        .ml-grid { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; align-items: start; }
        .ml-tabs { display: flex; }
        .ml-tab {
          flex: 1; padding: 0.6rem 0; font-family: monospace; font-size: 0.68rem;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; background: transparent;
          border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); transition: all 0.2s;
        }
        .ml-tab:not(:last-child) { border-right: none; }
        .ml-tab.active { color: #fff; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
        .ml-tab .ct {
          display: inline-flex; align-items: center; justify-content: center;
          width: 15px; height: 15px; background: rgba(255,255,255,0.12); border-radius: 50%;
          font-size: 0.58rem; margin-left: 5px; vertical-align: middle;
        }
        .ml-panel { border: 1px solid rgba(255,255,255,0.08); border-top: none; padding: 1.5rem; }
        .ml-in {
          width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.12);
          padding: 0.65rem 0.9rem; color: #fff; font-family: monospace; font-size: 0.83rem;
          outline: none; transition: border-color 0.2s;
        }
        .ml-in:focus { border-color: rgba(255,255,255,0.35); }
        .ml-in::placeholder { color: rgba(255,255,255,0.2); }
        .ml-lbl { display: block; font-family: monospace; font-size: 0.67rem; letter-spacing: 0.12em;
          color: rgba(255,255,255,0.35); margin-bottom: 0.5rem; text-transform: uppercase; }
        .ml-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.45rem;
          padding: 0.75rem 1.25rem; font-family: monospace; font-size: 0.75rem;
          letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border: none;
          transition: all 0.2s; font-weight: 700; width: 100%;
        }
        .ml-btn-p { background: #fff; color: #000; }
        .ml-btn-p:hover:not(:disabled) { background: rgba(255,255,255,0.88); }
        .ml-btn-s { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65); border: 1px solid rgba(255,255,255,0.12); }
        .ml-btn-s:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
        .ml-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ml-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.6rem; }
        .ml-row2 .ml-btn { padding: 0.7rem 0.5rem; font-size: 0.68rem; }
        .ml-card {
          padding: 0.85rem 1rem; border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer; transition: all 0.2s; margin-bottom: 0.35rem;
        }
        .ml-card.on { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.04); }
        .ml-card:hover { border-color: rgba(255,255,255,0.15); }
        .ml-chk {
          width: 13px; height: 13px; border: 1px solid rgba(255,255,255,0.28);
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; margin-top: 2px;
        }
        .ml-chk.on { background: #fff; border-color: #fff; }
        .ml-scroll { max-height: 340px; overflow-y: auto; }
        .ml-scroll::-webkit-scrollbar { width: 3px; }
        .ml-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .ml-status {
          display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem 0.9rem;
          font-family: monospace; font-size: 0.73rem; border: 1px solid; margin-top: 0.875rem;
        }
        .ml-s-info    { border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.02); }
        .ml-s-success { border-color: rgba(74,222,128,0.28);  color: #4ade80;              background: rgba(74,222,128,0.05);  }
        .ml-s-error   { border-color: rgba(248,113,113,0.28); color: #f87171;              background: rgba(248,113,113,0.05); }
        .ml-spin {
          width: 13px; height: 13px; border: 2px solid rgba(0,0,0,0.1);
          border-top-color: #000; border-radius: 50%; animation: spin 0.55s linear infinite; flex-shrink: 0;
        }
        .ml-spin-w {
          width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.15);
          border-top-color: rgba(255,255,255,0.6); border-radius: 50%; animation: spin 0.55s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ml-empty {
          text-align: center; padding: 2.5rem 1rem; color: rgba(255,255,255,0.18);
          font-family: monospace; font-size: 0.78rem; line-height: 2.1;
        }
        .ml-pnav { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; }
        .ml-pnav button {
          background: transparent; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4);
          width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; flex-shrink: 0;
        }
        .ml-pnav button:hover:not(:disabled) { border-color: rgba(255,255,255,0.25); color: #fff; }
        .ml-pnav button:disabled { opacity: 0.2; cursor: not-allowed; }
        .ml-hr { height: 1px; background: rgba(255,255,255,0.07); margin: 1.1rem 0; }
        .ml-hint {
          font-family: monospace; font-size: 0.67rem; color: rgba(255,255,255,0.22);
          line-height: 1.7; margin-top: 0.5rem;
        }
        .ml-hint code { color: rgba(255,255,255,0.38); }
        @media (max-width: 860px) {
          .ml { padding: 1.25rem; padding-top: calc(60px + 1.25rem); }
          .ml-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ml">
        {/* Header */}
        <div style={{ marginBottom: '2.25rem' }}>
          <h1 style={{ fontSize: 'clamp(1.9rem,5vw,3.25rem)', fontWeight: 900, letterSpacing: '-0.05em', margin: '0 0 0.35rem' }}>
            EMAIL COMPOSER
          </h1>
          <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', margin: 0 }}>
            Describe your email → Groq writes the content → we build the layout → send
          </p>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '1.4rem' }}>
          <label className="ml-lbl">Subject Line</label>
          <input className="ml-in" type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. HackOverflow 2025 — You're registered!" />
        </div>

        <div className="ml-grid">
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Tabs — only Content and Recipients */}
            <div className="ml-tabs">
              {(['editor', 'recipients'] as const).map((t) => (
                <button key={t} className={`ml-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                  {t === 'editor' && 'Content'}
                  {t === 'recipients' && (
                    <>Recipients{recipients.length > 0 && <span className="ct">{recipients.length}</span>}</>
                  )}
                </button>
              ))}
            </div>

            <div className="ml-panel">

              {/* ──── EDITOR TAB ──── */}
              {tab === 'editor' && (
                <>
                  <label className="ml-lbl">Describe your email in plain language</label>
                  <textarea
                    className="ml-in"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={13}
                    style={{ resize: 'vertical', lineHeight: 1.75 }}
                    placeholder={
                      "Describe what this email should say and who it's for:\n\n" +
                      'e.g. Welcome email for registered hackathon participants. ' +
                      'Tell them the event is March 15–16 at Hall 3, VJTI Mumbai. ' +
                      'Doors open at 9am. Bring their laptop, charger, and college ID. ' +
                      'Meals and snacks are provided. Warm and excited tone.'
                    }
                  />
                  <p className="ml-hint" style={{ marginBottom: '0.75rem' }}>
                    Drop any variable below into your brief for per-recipient personalisation.
                  </p>
                  {/* Variable reference grid */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1rem' }}>
                    {TEMPLATE_VARS.map((v) => (
                      <button
                        key={v.token}
                        title={`${v.label} — e.g. "${v.example}"`}
                        onClick={() => setBrief((b) => b + v.token)}
                        style={{
                          background: 'rgba(232,93,36,0.08)', border: '1px solid rgba(232,93,36,0.25)',
                          borderRadius: '4px', padding: '3px 8px', cursor: 'pointer',
                          fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)',
                          transition: 'all 0.15s', letterSpacing: '0.03em',
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.background = 'rgba(232,93,36,0.18)';
                          (e.target as HTMLButtonElement).style.color = '#F2A03D';
                          (e.target as HTMLButtonElement).style.borderColor = 'rgba(232,93,36,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.background = 'rgba(232,93,36,0.08)';
                          (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                          (e.target as HTMLButtonElement).style.borderColor = 'rgba(232,93,36,0.25)';
                        }}
                      >
                        {v.token}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '1.1rem' }}>
                    <button className="ml-btn ml-btn-p" onClick={handleGenerate}
                      disabled={generating || !subject.trim() || !brief.trim()}>
                      {generating
                        ? <><div className="ml-spin" /> Generating…</>
                        : <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                            Generate with Groq
                          </>
                      }
                    </button>
                  </div>
                </>
              )}

              {/* ──── RECIPIENTS TAB ──── */}
              {tab === 'recipients' && (
                <>
                  <div className="ml-row2">
                    <button className="ml-btn ml-btn-s" onClick={loadParticipants}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Participants
                    </button>
                    <button className="ml-btn ml-btn-s" onClick={loadSponsors}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                      </svg>
                      Sponsors
                    </button>
                  </div>

                  {/* CSV upload */}
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <input type="file" accept=".csv" onChange={handleCsv} id="csv-up"
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    <label htmlFor="csv-up" style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.9rem',
                      border: '1px dashed rgba(255,255,255,0.12)', cursor: 'pointer',
                      fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', transition: 'all 0.2s',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload CSV (name, email, role, company)
                    </label>
                  </div>

                  {recipients.length > 0 && (
                    <>
                      <div className="ml-hr" />
                      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.7rem', alignItems: 'center' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                          </svg>
                          <input className="ml-in" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search…" style={{ paddingLeft: '2rem', fontSize: '0.75rem', padding: '0.5rem 0.75rem 0.5rem 2rem' }} />
                        </div>
                        <button onClick={() => toggleAll(true)}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'monospace', fontSize: '0.63rem', padding: '0.5rem 0.55rem', cursor: 'pointer',
                            letterSpacing: '0.08em', transition: 'all 0.2s' }}>
                          ALL
                        </button>
                        <button onClick={() => toggleAll(false)}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
                            fontFamily: 'monospace', fontSize: '0.63rem', padding: '0.5rem 0.5rem', cursor: 'pointer',
                            letterSpacing: '0.08em', transition: 'all 0.2s' }}>
                          NONE
                        </button>
                      </div>

                      <div className="ml-scroll">
                        {filtered.length === 0
                          ? <div className="ml-empty">No results</div>
                          : filtered.map((r) => {
                              const origIdx = recipients.findIndex((x) => x.email === r.email);
                              return (
                                <div key={r.email} className={`ml-card${r.selected ? ' on' : ''}`} onClick={() => toggle(origIdx)}>
                                  <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                                    <div className={`ml-chk${r.selected ? ' on' : ''}`}>
                                      {r.selected && (
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      )}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#fff', fontWeight: 700,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.name}
                                      </div>
                                      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.38)',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.email}
                                      </div>
                                      {(r.role || r.company) && (
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.22)',
                                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                          {[r.role, r.company].filter(Boolean).join(' · ')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        }
                      </div>

                      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)',
                        paddingTop: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.7rem' }}>
                        {selected.length} of {recipients.length} selected
                        {search && filtered.length !== recipients.length &&
                          <span style={{ color: 'rgba(255,255,255,0.18)' }}> · {filtered.length} shown</span>}
                      </div>
                    </>
                  )}

                  {recipients.length === 0 && (
                    <div className="ml-empty">
                      Load participants, sponsors,<br />or upload a CSV to begin.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status bar */}
            {status && (
              <div className={`ml-status ml-s-${status.type}`}>
                {status.type === 'success' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {status.type === 'error' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                )}
                {status.type === 'info' && <div className="ml-spin-w" />}
                {status.text}
              </div>
            )}

            {/* Send button */}
            <button
              className="ml-btn ml-btn-p"
              style={{ marginTop: '0.875rem' }}
              onClick={handleSend}
              disabled={sending || !generatedHtml || selected.length === 0}
            >
              {sending
                ? <><div className="ml-spin" />Sending…</>
                : <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    {selected.length > 0 ? `Send to ${selected.length} recipient${selected.length !== 1 ? 's' : ''}` : 'Send Email'}
                  </>
              }
            </button>
          </div>

          {/* ── RIGHT COLUMN — full preview ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.67rem', letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                Live Preview
              </span>
              {generatedHtml && selected.length > 1 && (
                <div className="ml-pnav" style={{ margin: 0 }}>
                  <button onClick={() => updatePreview(previewIdx - 1)} disabled={previewIdx === 0}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)' }}>
                    {selected[previewIdx]?.name} · {previewIdx + 1}/{selected.length}
                  </span>
                  <button onClick={() => updatePreview(previewIdx + 1)} disabled={previewIdx >= selected.length - 1}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
            </div>

            <div style={{
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden',
              minHeight: '640px', display: 'flex',
              alignItems: previewHtml ? 'stretch' : 'center',
              justifyContent: previewHtml ? 'stretch' : 'center',
              background: previewHtml ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              {previewHtml
                ? <iframe srcDoc={previewHtml} title="Email Preview" sandbox="allow-same-origin"
                    style={{ width: '100%', height: '640px', border: 'none', display: 'block' }} />
                : <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.12)', lineHeight: 2.4, padding: '4rem' }}>
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8"
                      style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.12 }}>
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <polyline points="8,21 16,21"/><line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    Describe your email on the left<br />
                    then click <strong style={{ color: 'rgba(255,255,255,0.22)' }}>Generate with Groq</strong><br />
                    to see it rendered here.
                  </div>
              }
            </div>

            {/* JSON content disclosure */}
            {emailContent && (
              <details open={jsonOpen} onToggle={(e) => setJsonOpen((e.target as HTMLDetailsElement).open)}
                style={{ marginTop: '0.875rem' }}>
                <summary style={{
                  fontFamily: 'monospace', fontSize: '0.67rem', color: 'rgba(255,255,255,0.22)',
                  cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase',
                  userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transition: 'transform 0.2s', transform: jsonOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  Groq JSON output
                </summary>
                <pre style={{
                  marginTop: '0.6rem', padding: '0.9rem', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'auto',
                  fontFamily: 'monospace', fontSize: '0.67rem', color: 'rgba(255,255,255,0.35)',
                  lineHeight: 1.65, maxHeight: '220px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {JSON.stringify(emailContent, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </>
  );
}