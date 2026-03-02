/**
 * Vector PDF Generation for ID Cards
 *
 * Generates crisp PDF ID cards using jsPDF.
 * SVG background is rendered as high-DPI PNG (7x scale).
 * Name, Team ID + QR code positions are driven by CardOverlays from IDCardEditor.
 *
 * @module utils/generate-pdf
 */

import { jsPDF } from 'jspdf';
import { IDCardData, HackathonInfo } from '@/types';
import { CardOverlays, DEFAULT_OVERLAYS, CARD_W_MM, CARD_H_MM } from '@/components/id-card/IDCardEditor';

const CARD_FORMAT: [number, number] = [CARD_W_MM, CARD_H_MM];

// High-DPI SVG rendering scale (7x = ~1589px wide — professional print quality)
const HIGH_DPI_SCALE = 7;

// SVG source dimensions (px at 96 DPI)
const SVG_W_PX = 226.77;
const SVG_H_PX = 283.46;

// ─── Font cache ───────────────────────────────────────────────────────────────
let cachedFontBase64: string | null = null;
let fontLoadFailed = false;

async function loadCustomFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  if (fontLoadFailed) return '';
  try {
    const res = await fetch('/fonts/HO.ttf');
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const buf   = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary  = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    cachedFontBase64 = btoa(binary);
    console.log('✓ Custom font HO loaded');
    return cachedFontBase64;
  } catch (err) {
    console.warn('Custom font not loaded, falling back to Helvetica Bold:', err);
    fontLoadFailed = true;
    return '';
  }
}

function addFontToPDF(pdf: jsPDF, fontBase64: string): boolean {
  if (!fontBase64) return false;
  try {
    pdf.addFileToVFS('HO-Regular.ttf', fontBase64);
    pdf.addFont('HO-Regular.ttf', 'HO', 'normal');
    return true;
  } catch {
    return false;
  }
}

// ─── SVG → High-DPI PNG ───────────────────────────────────────────────────────
async function loadSVGAsHighDPIPNG(): Promise<string> {
  const res = await fetch('/Images/id.svg');
  if (!res.ok) throw new Error(`Failed to load SVG: ${res.statusText}`);
  const svgText = await res.text();
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img    = new Image();
    const canvas = document.createElement('canvas');
    canvas.width  = SVG_W_PX * HIGH_DPI_SCALE;
    canvas.height = SVG_H_PX * HIGH_DPI_SCALE;
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      console.log(`✓ SVG → PNG at ${canvas.width}×${canvas.height}px (${HIGH_DPI_SCALE}x)`);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG render failed')); };
    img.src = url;
  });
}

// ─── Draw a single card ───────────────────────────────────────────────────────
async function drawCard(
  pdf: jsPDF,
  data: IDCardData,
  backgroundPNG: string,
  customFont: string,
  overlays: CardOverlays,
): Promise<void> {
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  // ── Background ──
  try {
    pdf.addImage(backgroundPNG, 'PNG', 0, 0, W, H, `bg_${data.participantId}`, 'FAST');
  } catch {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, W, H, 'F');
  }

  const hasFont = addFontToPDF(pdf, customFont);

  // ── Name ──
  pdf.setTextColor(255, 255, 255);
  pdf.setFont(hasFont ? 'HO' : 'helvetica', hasFont ? 'normal' : 'bold');
  pdf.setFontSize(overlays.name.fontSizePt);

  const nameParts     = data.name.toUpperCase().split(' ');
  const lineSpacingMM = overlays.name.fontSizePt * (25.4 / 72) * 1.4; // ~1.4× leading

  if (nameParts.length > 2) {
    const mid   = Math.ceil(nameParts.length / 2);
    const line1 = nameParts.slice(0, mid).join(' ');
    const line2 = nameParts.slice(mid).join(' ');
    pdf.text(line1, overlays.name.centerXmm, overlays.name.ymm,                { align: 'center', maxWidth: W * 0.9 });
    pdf.text(line2, overlays.name.centerXmm, overlays.name.ymm + lineSpacingMM, { align: 'center', maxWidth: W * 0.9 });
  } else {
    pdf.text(data.name.toUpperCase(), overlays.name.centerXmm, overlays.name.ymm, {
      align: 'center', maxWidth: W * 0.9,
    });
  }

  // ── Team ID ──
  if (overlays.teamId.show && data.teamId) {
    pdf.setFontSize(overlays.teamId.fontSizePt);
    pdf.setTextColor(220, 220, 220); // slightly dimmer than name
    pdf.setFont(hasFont ? 'HO' : 'helvetica', hasFont ? 'normal' : 'normal');
    pdf.text(data.teamId, overlays.teamId.centerXmm, overlays.teamId.ymm, {
      align: 'center', maxWidth: W * 0.9,
    });
  }

  // ── QR Code ──
  const { xmm, ymm, sizemm } = overlays.qr;
  try {
    const qr = data.qrCodeDataURL?.trim().replace(/\s+/g, '');
    if (!qr?.startsWith('data:image/')) throw new Error('Invalid QR data URL');
    const fmt = qr.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    pdf.addImage(qr, fmt, xmm, ymm, sizemm, sizemm, `qr_${data.participantId}`, 'FAST');
  } catch (err) {
    console.error(`QR error for ${data.participantId}:`, err);
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.rect(xmm, ymm, sizemm, sizemm, 'S');
    pdf.setFontSize(6);
    pdf.setTextColor(160, 160, 160);
    pdf.setFont('helvetica', 'normal');
    pdf.text('QR ERROR', xmm + sizemm / 2, ymm + sizemm / 2, { align: 'center' });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a single PDF ID card and trigger download.
 */
export async function generateVectorPDF(
  data: IDCardData,
  _hackathonInfo: HackathonInfo,
  fileName = 'id-card.pdf',
  overlays: CardOverlays = DEFAULT_OVERLAYS,
): Promise<void> {
  const [backgroundPNG, customFont] = await Promise.all([loadSVGAsHighDPIPNG(), loadCustomFont()]);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: CARD_FORMAT });
  await drawCard(pdf, data, backgroundPNG, customFont, overlays);
  pdf.save(fileName);
}

/**
 * Generate multiple PDF ID cards, zip them, and trigger download.
 */
export async function generateBulkVectorPDFs(
  cards: IDCardData[],
  hackathonInfo: HackathonInfo,
  baseFileName = 'id-cards',
  onProgress?: (current: number, total: number) => void,
  overlays: CardOverlays = DEFAULT_OVERLAYS,
): Promise<void> {
  // Load shared resources once
  const [backgroundPNG, customFont] = await Promise.all([loadSVGAsHighDPIPNG(), loadCustomFont()]);
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (let i = 0; i < cards.length; i++) {
    try {
      const card = cards[i];
      const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: CARD_FORMAT });
      await drawCard(pdf, card, backgroundPNG, customFont, overlays);
      zip.file(`${card.name.replace(/\s+/g, '_')}_${card.participantId}.pdf`, pdf.output('blob'));
      onProgress?.(i + 1, cards.length);
    } catch (err) {
      console.error(`Card ${i} (${cards[i]?.participantId}) failed:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `${baseFileName}_all.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}