'use client';

import { useState, useRef } from 'react';
import IDCardEditor, { IDCardCard, CardOverlays, DEFAULT_OVERLAYS } from '@/components/id-card/IDCardEditor';
import { IDCardData, HackathonInfo } from '@/types';
import { parseCSVForIDCards } from '@/lib/csv';
import { downloadCSVTemplate } from '@/utils/csv-download';
import { getParticipants } from '@/actions/participants';
import { generateQRCode } from '@/utils/generate-qr';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { generateBulkVectorPDFs } from '@/utils/generate-pdf';

interface SelectableIDCardData extends IDCardData {
  selected: boolean;
}

// Placeholder QR for when no card is loaded yet
const PLACEHOLDER_QR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const SAMPLE_CARD: IDCardData = {
  name: 'JOHN DOE',
  email: 'john.doe@example.com',
  role: 'Participant',
  company: 'N/A',
  phone: '',
  participantId: 'PART-0000',
  qrCodeDataURL: PLACEHOLDER_QR,
  teamId: 'TEAM-001',
};

export default function GeneratorPage() {
  const [cards, setCards]               = useState<SelectableIDCardData[]>([]);
  const [overlays, setOverlays]         = useState<CardOverlays>(DEFAULT_OVERLAYS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress]         = useState(0);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf'>('pdf');
  const [fileName, setFileName]         = useState('');
  const [status, setStatus]             = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const hackathonInfo: HackathonInfo = {
    name: 'HACKOVERFLOW 4.0',
    date: 'March 15-16, 2026',
    venue: 'Pillai HOC College, Rasayani',
  };

  // The card shown in the overlay editor — first loaded card or sample
  const editorCard: IDCardData = cards.length > 0 ? cards[0] : SAMPLE_CARD;

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const processed = await parseCSVForIDCards(text);
      setCards(processed.map(c => ({ ...c, selected: true })));
      setStatus(`Loaded ${processed.length} participants successfully`);
    } catch (err) {
      setStatus('Error processing CSV. Please check the format.');
      console.error(err);
    }
  };

  const loadParticipants = async () => {
    try {
      setStatus('Loading participants from database...');
      const db = await getParticipants();
      const transformed: SelectableIDCardData[] = await Promise.all(
        db.map(async (p) => ({
          name:          p.name,
          email:         p.email,
          role:          p.role || 'Participant',
          company:       p.institute || 'N/A',
          phone:         p.phone || '',
          participantId: p.participantId,
          qrCodeDataURL: await generateQRCode(p.participantId),
          teamId:        p.teamId,  // ← pulled from DB
          selected:      true,
        }))
      );
      setCards(transformed);
      setStatus(`Loaded ${transformed.length} participants from database`);
    } catch (err) {
      setStatus('Error loading participants from database');
      console.error(err);
    }
  };

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleParticipant = (i: number) =>
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c));

  const toggleAll = (sel: boolean) =>
    setCards(prev => prev.map(c => ({ ...c, selected: sel })));

  // ── Generation ───────────────────────────────────────────────────────────────
  const generatePNGCards = async () => {
    const selected = cards.filter(c => c.selected);
    if (!selected.length) { setStatus('Please select at least one participant'); return; }

    setIsGenerating(true);
    setProgress(0);
    try {
      const zip = new JSZip();
      for (let i = 0; i < cards.length; i++) {
        if (!cards[i].selected) continue;
        const el = cardRefs.current[i];
        if (!el) continue;

        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const blob   = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
        zip.file(`${cards[i].name.replace(/\s+/g, '_')}_${cards[i].participantId}.png`, blob);

        const idx = selected.findIndex(sc => sc.participantId === cards[i].participantId);
        setProgress(Math.round(((idx + 1) / selected.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url  = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url; link.download = 'id-cards.zip';
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);

      setStatus(`Generated ${selected.length} PNG cards`);
    } catch (err) {
      setStatus('Error generating PNG cards. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false); setProgress(0);
    }
  };

  const generatePDFCards = async () => {
    const selected = cards.filter(c => c.selected);
    if (!selected.length) { setStatus('Please select at least one participant'); return; }

    setIsGenerating(true);
    setProgress(0);
    try {
      await generateBulkVectorPDFs(
        selected,
        hackathonInfo,
        'id-cards',
        (cur, tot) => setProgress(Math.round((cur / tot) * 100)),
        overlays, // ← pass live positions from the editor
      );
      setStatus(`Generated ${selected.length} vector PDF cards`);
    } catch (err) {
      setStatus('Error generating PDF cards. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false); setProgress(0);
    }
  };

  const handleGenerate = () => downloadFormat === 'pdf' ? generatePDFCards() : generatePNGCards();

  const selectedCount = cards.filter(c => c.selected).length;
  const filteredCards = cards.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.teamId  && c.teamId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.role    && c.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '3rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '0.5rem' }}>
          ID CARD GENERATOR
        </h1>
        <p style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
          Upload CSV, position overlays, and generate professional ID cards in bulk
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

        {/* ── 1. Import ── */}
        <Section label="1. IMPORT PARTICIPANTS">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <IconButton onClick={loadParticipants} label="LOAD FROM DATABASE">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </IconButton>
            <IconButton onClick={() => downloadCSVTemplate('id-card')} label="DOWNLOAD TEMPLATE">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </IconButton>
          </div>

          <div style={{ position: 'relative' }}>
            <input type="file" accept=".csv" onChange={handleFileUpload}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.2)', padding: '2rem 1rem', cursor: 'pointer', transition: 'all 0.3s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.75rem', opacity: 0.5 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                {fileName || 'Upload CSV File'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                {cards.length > 0 ? `${cards.length} participants loaded` : 'Click to browse or drag and drop'}
              </div>
            </label>
          </div>
        </Section>

        {/* ── 2. Position Overlays ── */}
        <Section label="2. POSITION CARD ELEMENTS">
          <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.25rem' }}>
            Drag the name, team ID or QR code to the correct position. Adjustments apply to all generated cards.
            {cards.length === 0 && ' (Load participants to preview with real data)'}
          </p>
          <IDCardEditor
            data={editorCard}
            overlays={overlays}
            onOverlaysChange={setOverlays}
            previewWidth={310}
          />
        </Section>

        {/* ── 3. Select Participants ── */}
        {cards.length > 0 && (
          <Section label="3. SELECT PARTICIPANTS">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <GhostButton onClick={() => toggleAll(true)}>SELECT ALL</GhostButton>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                <GhostButton onClick={() => toggleAll(false)}>DESELECT ALL</GhostButton>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, team ID, participant ID..."
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 0.75rem 0.5rem 2.5rem', color: '#fff', fontFamily: 'monospace', fontSize: '0.75rem' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
                onBlur={(e)  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              />
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '20rem', overflowY: 'auto' }}>
              {filteredCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  No results found
                </div>
              ) : filteredCards.map((card) => {
                const idx = cards.findIndex(c => c.participantId === card.participantId);
                return (
                  <div key={idx} onClick={() => toggleParticipant(idx)}
                    style={{ border: `1px solid ${card.selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, padding: '0.875rem 1rem', cursor: 'pointer', backgroundColor: card.selected ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                    onMouseEnter={(e) => { if (!card.selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={(e) => { if (!card.selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    {/* Checkbox */}
                    <div style={{ width: 14, height: 14, border: `1px solid ${card.selected ? '#fff' : 'rgba(255,255,255,0.3)'}`, backgroundColor: card.selected ? '#fff' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {card.selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {card.name}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{card.participantId}</span>
                        {card.teamId && (
                          <span style={{ color: 'rgba(74,222,128,0.7)' }}>{card.teamId}</span>
                        )}
                        <span style={{ opacity: 0.7 }}>{card.email}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '0.875rem', fontFamily: 'monospace', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {selectedCount} of {cards.length} selected
              {searchQuery && filteredCards.length !== cards.length && (
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> ({filteredCards.length} shown)</span>
              )}
            </div>
          </Section>
        )}

        {/* ── 4. Format & Generate ── */}
        <Section label={cards.length > 0 ? '4. GENERATE' : '3. GENERATE'}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {(['pdf', 'png'] as const).map((fmt) => (
              <button key={fmt} onClick={() => setDownloadFormat(fmt)}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', background: downloadFormat === fmt ? '#fff' : 'transparent', color: downloadFormat === fmt ? '#000' : '#fff', fontWeight: downloadFormat === fmt ? 'bold' : 'normal', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'monospace' }}
                onMouseEnter={(e) => { if (downloadFormat !== fmt) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; } }}
                onMouseLeave={(e) => { if (downloadFormat !== fmt) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
              >
                {fmt} {fmt === 'pdf' && <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>VECTOR</span>}
              </button>
            ))}
          </div>

          <button onClick={handleGenerate}
            disabled={isGenerating || selectedCount === 0}
            style={{ width: '100%', padding: '1rem', fontWeight: 900, fontSize: '1.125rem', background: selectedCount === 0 || isGenerating ? 'rgba(255,255,255,0.1)' : '#fff', color: selectedCount === 0 || isGenerating ? 'rgba(255,255,255,0.3)' : '#000', cursor: selectedCount === 0 || isGenerating ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.3s', letterSpacing: '0.05em' }}
            onMouseEnter={(e) => { if (!isGenerating && selectedCount > 0) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; }}
            onMouseLeave={(e) => { if (!isGenerating && selectedCount > 0) e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            {isGenerating
              ? `GENERATING... ${progress}%`
              : selectedCount === 0
                ? 'SELECT PARTICIPANTS FIRST'
                : `GENERATE ${selectedCount} ${downloadFormat.toUpperCase()} CARD${selectedCount !== 1 ? 'S' : ''}`}
          </button>

          {isGenerating && (
            <div style={{ marginTop: '1rem', height: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#4ade80', width: `${progress}%`, transition: 'width 0.3s' }} />
            </div>
          )}
        </Section>

        {/* ── Status ── */}
        {status && (
          <div style={{ border: '1px solid rgba(255,255,255,0.15)', padding: '0.875rem 1rem', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{status}</div>
          </div>
        )}

        {/* ── Preview Grid ── */}
        <Section label={`PREVIEW CARDS (${cards.length})`}>
          {cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
              No participants loaded
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', maxHeight: '600px', overflowY: 'auto', padding: '0.25rem' }}>
              {cards.map((card, i) => {
                const RENDER_W  = 400;
                const RENDER_H  = RENDER_W * (74.98 / 60.02);
                const DISPLAY_W = 160;
                const scale     = DISPLAY_W / RENDER_W;
                return (
                  <div key={i}
                    style={{ position: 'relative', width: DISPLAY_W, height: DISPLAY_W * (74.98 / 60.02), overflow: 'hidden', border: `1px solid ${card.selected ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.2s', cursor: 'pointer' }}
                    onClick={() => toggleParticipant(i)}
                    title={card.selected ? 'Click to deselect' : 'Click to select'}
                  >
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
                      <IDCardCard
                        ref={(el) => { cardRefs.current[i] = el; }}
                        data={card}
                        overlays={overlays}
                        width={RENDER_W}
                        dimmed={!card.selected}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

      </div>
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', transition: 'border-color 0.3s' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', padding: '1.5rem 1rem', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem', opacity: 0.55 }}>
        {children}
      </svg>
      <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.07em' }}>
        {label}
      </div>
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', transition: 'color 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
    >
      {children}
    </button>
  );
}