// ─── actions/email-template.ts ───────────────────────────────────────────────
// Table-based HTML — Gmail · Outlook · Apple Mail · Yahoo · narrow phones.
// Gmail gradient fix: background-clip:text never works in Gmail app.
// Solution: vibrant solid fallback color + gradient for supporting clients.
// CTA / bars / callout use block-level background gradients — those DO work in Gmail.

export interface EmailContent {
  layout: 'announcement' | 'welcome' | 'verification' | 'reminder';
  eyebrow: string;
  headline: string;
  subheadline: string;
  paragraphs: string[];
  callout?: { style: 'neutral' | 'success' | 'warning'; label: string; value: string };
  grid?: Array<{ label: string; value: string }>;
  list?: { title: string; items: string[] };
  cta?: { label: string; url: string };
  closing_line: string;
  org_name: string;
  footer_tagline: string;
}

// ─── Escape ───────────────────────────────────────────────────────────────────

function e(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/\{\{(\w+)\}\}/g, '{{$1}}');
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

// Block-level gradients (work in Gmail app ✓)
const GRAD_BAR  = 'linear-gradient(90deg,#FCB216 0%,#E85D24 35%,#D91B57 70%,#63205F 100%)';
const GRAD_BTN  = 'linear-gradient(90deg,#FCB216 0%,#E85D24 40%,#D91B57 100%)';
const GRAD_DIAG = 'linear-gradient(135deg,#FCB216 0%,#E85D24 30%,#D91B57 65%,#63205F 100%)';

const GOLD  = '#FCB216';
const ORG   = '#E85D24';
const PINK  = '#D91B57';
const WHITE = '#FFFFFF';
const DARK  = '#0D0D0D';
const CARD  = '#161616';
const FOOT  = '#0A0A0A';

// ─── Layout themes ────────────────────────────────────────────────────────────

const THEME: Record<string, {
  pill: string; pillBg: string; pillBdr: string;
  headGrad: string; headFb: string;
  sigGrad: string;  sigFb: string;
}> = {
  announcement: {
    pill: ORG, pillBg: 'rgba(232,93,36,0.14)', pillBdr: 'rgba(232,93,36,0.40)',
    headGrad: GRAD_DIAG, headFb: ORG,
    sigGrad: GRAD_BTN, sigFb: GOLD,
  },
  welcome: {
    pill: GOLD, pillBg: 'rgba(252,178,22,0.13)', pillBdr: 'rgba(252,178,22,0.40)',
    headGrad: 'linear-gradient(135deg,#FFD47C 0%,#FCB216 35%,#E85D24 70%,#D91B57 100%)', headFb: GOLD,
    sigGrad: GRAD_BTN, sigFb: GOLD,
  },
  verification: {
    pill: PINK, pillBg: 'rgba(217,27,87,0.12)', pillBdr: 'rgba(217,27,87,0.38)',
    headGrad: 'linear-gradient(135deg,#D91B57 0%,#a040a0 50%,#63205F 100%)', headFb: PINK,
    sigGrad: 'linear-gradient(90deg,#D91B57 0%,#a040a0 100%)', sigFb: PINK,
  },
  reminder: {
    pill: PINK, pillBg: 'rgba(217,27,87,0.12)', pillBdr: 'rgba(217,27,87,0.38)',
    headGrad: 'linear-gradient(135deg,#D91B57 0%,#E85D24 55%,#FCB216 100%)', headFb: ORG,
    sigGrad: GRAD_BTN, sigFb: ORG,
  },
};

// ─── Callout themes ───────────────────────────────────────────────────────────

const CALLOUT_STYLE: Record<string, {
  bar: string; bg: string; bdr: string; lbl: string; val: string;
}> = {
  neutral: { bar: GOLD,      bg: 'rgba(252,178,22,0.08)', bdr: 'rgba(252,178,22,0.22)', lbl: GOLD,      val: '#FFD47C'  },
  success: { bar: '#22c55e', bg: 'rgba(34,197,94,0.07)',  bdr: 'rgba(34,197,94,0.22)',  lbl: '#4ade80', val: '#bbf7d0' },
  warning: { bar: ORG,       bg: 'rgba(232,93,36,0.08)',  bdr: 'rgba(232,93,36,0.22)',  lbl: ORG,       val: '#F2A03D' },
};

// ─── Assets ───────────────────────────────────────────────────────────────────

const LOGO  = 'https://hackoverflow4.tech/images/Logo.png';
const LOGO2 = 'https://hackoverflow4.tech/Images/Logo.png';

const SOCIAL: Array<{ href: string; label: string; svg: string }> = [
  {
    href: 'https://hackoverflow4.tech/', label: 'Website',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/></svg>`,
  },
  {
    href: 'https://www.instagram.com/hackoverflow.tech/', label: 'Instagram',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/><circle cx="12" cy="12" r="5" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/><circle cx="17.5" cy="6.5" r="1" fill="rgba(255,255,255,0.55)"/></svg>`,
  },
  {
    href: 'https://www.linkedin.com/company/hack-overflow/', label: 'LinkedIn',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" xmlns="http://www.w3.org/2000/svg"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
  },
  {
    href: 'https://discord.gg/6dJRD5jB', label: 'Discord',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.62.874-1.28 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>`,
  },
  {
    href: 'https://www.youtube.com/@hackoverflow_tech', label: 'YouTube',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.55)" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#0D0D0D"/></svg>`,
  },
];

// ─── Gradient text helper ─────────────────────────────────────────────────────
// Gmail app ignores -webkit-background-clip:text and shows `color:` fallback.
// We make fallback a vibrant brand color so it looks intentional in Gmail.

function gradText(text: string, grad: string, fallback: string): string {
  return [
    `<!--[if mso]><span style="color:${fallback};">${text}</span><![endif]-->`,
    `<!--[if !mso]><!-->`,
    `<span style="background:${grad};`,
    `-webkit-background-clip:text;`,
    `-webkit-text-fill-color:transparent;`,
    `background-clip:text;`,
    `color:${fallback};">`,
    `${text}</span>`,
    `<!--<![endif]-->`,
  ].join('');
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

function topBar(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td height="4" style="height:4px;line-height:4px;font-size:0;padding:0;
          background:${GRAD_BAR};">&nbsp;</td>
    </tr>
  </table>`;
}

function nameBar(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:18px 36px;
                 border-bottom:1px solid rgba(255,255,255,0.06);">
        <p class="namebar" style="margin:0;font-family:'Poppins',Arial,sans-serif;
           font-size:17px;font-weight:800;letter-spacing:2px;
           text-transform:uppercase;line-height:1;">
          ${gradText('HACKOVERFLOW', GRAD_DIAG, ORG)}<span
          style="color:rgba(255,255,255,0.28);font-weight:400;letter-spacing:1px;"> 4.0</span>
        </p>
      </td>
    </tr>
  </table>`;
}

function heroBlock(c: EmailContent, T: typeof THEME[string]): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="hero pad" align="center"
          style="background:${DARK};padding:52px 36px 58px;text-align:center;">

        <!-- Eyebrow pill -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
               align="center" style="margin:0 auto 22px;">
          <tr>
            <td style="padding:7px 20px;border-radius:100px;
                       background:${T.pillBg};border:1px solid ${T.pillBdr};
                       font-family:'Poppins',Arial,sans-serif;font-size:10px;font-weight:700;
                       letter-spacing:3px;text-transform:uppercase;color:${T.pill};
                       white-space:nowrap;">
              ${e(c.eyebrow)}
            </td>
          </tr>
        </table>

        <!-- Headline -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:16px;text-align:center;">
              <div class="hdiv"
                   style="font-family:'Poppins',Arial,sans-serif;font-size:36px;
                          font-weight:800;line-height:1.15;letter-spacing:-0.5px;
                          color:${T.headFb};text-align:center;">
                ${gradText(e(c.headline), T.headGrad, T.headFb)}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center">
              <p class="subp"
                 style="margin:0 auto;max-width:400px;font-family:'Poppins',Arial,sans-serif;
                        font-size:15px;color:rgba(255,255,255,0.48);line-height:1.75;">
                ${e(c.subheadline)}
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>`;
}

function bodyBlock(c: EmailContent): string {
  const paras = c.paragraphs.map((p, i) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};
          padding:${i === 0 ? '14px' : '2px'} 36px ${i === c.paragraphs.length - 1 ? '32px' : '12px'};">
        <p class="bodyp" style="margin:0;font-family:'Poppins',Arial,sans-serif;
           font-size:15px;color:rgba(255,255,255,0.65);line-height:1.9;">
          ${e(p)}
        </p>
      </td>
    </tr>
  </table>`).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:34px 36px 0;">
        <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:15px;
           color:rgba(255,255,255,0.88);line-height:1.8;">
          Hi&nbsp;<strong style="color:${WHITE};font-weight:700;">{{name}}</strong>,
        </p>
      </td>
    </tr>
  </table>
  ${paras}`;
}

function dividerBlock(): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:6px 36px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td height="1" style="height:1px;font-size:0;line-height:0;
                background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);">
              &nbsp;
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function calloutBlock(callout: NonNullable<EmailContent['callout']>): string {
  const s = CALLOUT_STYLE[callout.style] ?? CALLOUT_STYLE.neutral;
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:0 36px 26px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="5" style="width:5px;min-width:5px;background:${s.bar};
                border-radius:6px 0 0 6px;font-size:0;line-height:0;">&nbsp;</td>
            <td style="background:${s.bg};border:1px solid ${s.bdr};border-left:0;
                       border-radius:0 12px 12px 0;padding:16px 20px;">
              <p style="margin:0 0 5px;font-family:'Poppins',Arial,sans-serif;font-size:9px;
                 font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${s.lbl};">
                ${e(callout.label)}
              </p>
              <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:17px;
                 font-weight:700;color:${s.val};line-height:1.4;
                 word-break:break-word;overflow-wrap:break-word;">
                ${e(callout.value)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function gridBlock(grid: NonNullable<EmailContent['grid']>, accentColor: string): string {
  const cellS = `background:${CARD};border:1px solid rgba(255,255,255,0.08);border-top:2px solid ${accentColor};border-radius:10px;padding:14px 15px;`;
  const lblS  = `font-family:'Poppins',Arial,sans-serif;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.28);font-weight:600;margin:0 0 6px;`;
  const valS  = `font-family:'Poppins',Arial,sans-serif;font-size:13px;font-weight:700;color:${WHITE};line-height:1.4;margin:0;word-break:break-word;overflow-wrap:break-word;`;

  const pairs: Array<typeof grid> = [];
  for (let i = 0; i < grid.length; i += 2) pairs.push(grid.slice(i, i + 2));

  const rows = pairs.map(row => `
    <tr>
      <td class="gcell" width="50%" valign="top"
          style="padding:0 5px 10px 0;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="${cellS}">
            <p style="${lblS}">${e(row[0].label)}</p>
            <p style="${valS}">${e(row[0].value)}</p>
          </td></tr>
        </table>
      </td>
      <td class="gcell" width="50%" valign="top"
          style="padding:0 0 10px 5px;vertical-align:top;">
        ${row[1] ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="${cellS}">
            <p style="${lblS}">${e(row[1].label)}</p>
            <p style="${valS}">${e(row[1].value)}</p>
          </td></tr>
        </table>` : ''}
      </td>
    </tr>`).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:0 36px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               class="gtable">
          ${rows}
        </table>
      </td>
    </tr>
  </table>`;
}

function listBlock(list: NonNullable<EmailContent['list']>): string {
  const items = list.items.map((item, i) => `
    <tr>
      <td style="padding:13px 20px;${i < list.items.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05);' : ''}">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="20" valign="top" style="padding-top:6px;padding-right:12px;vertical-align:top;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="8" height="8"
                      style="width:8px;height:8px;border-radius:4px;
                             background:${GRAD_BTN};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
            <td valign="top" style="vertical-align:top;">
              <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:14px;
                 color:rgba(255,255,255,0.70);line-height:1.8;
                 word-break:break-word;overflow-wrap:break-word;">
                ${e(item)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" style="background:${DARK};padding:0 36px 28px;">
        <p style="margin:0 0 12px;font-family:'Poppins',Arial,sans-serif;font-size:9px;
           font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
           color:rgba(255,255,255,0.22);">
          ${e(list.title)}
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:${CARD};border:1px solid rgba(255,255,255,0.07);
                      border-radius:14px;overflow:hidden;">
          ${items}
        </table>
      </td>
    </tr>
  </table>`;
}

function ctaBlock(cta: NonNullable<EmailContent['cta']>): string {
  // Block background gradient on <a> — works in Gmail app ✓
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad" align="center"
          style="background:${DARK};padding:6px 36px 44px;text-align:center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${e(cta.url)}"
          style="height:50px;v-text-anchor:middle;width:240px;"
          arcsize="50%" fillcolor="#E85D24" stroke="f">
          <w:anchorlock/>
          <center style="color:#fff;font-family:Arial,sans-serif;font-size:13px;
                         font-weight:700;text-transform:uppercase;letter-spacing:2px;">
            ${e(cta.label)}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${e(cta.url)}" class="cta"
           style="display:inline-block;padding:16px 48px;border-radius:100px;
                  text-decoration:none;font-family:'Poppins',Arial,sans-serif;
                  font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
                  color:#ffffff;background:${GRAD_BTN};
                  box-shadow:0 8px 32px rgba(232,93,36,0.40);mso-hide:all;">
          ${e(cta.label)}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}

function closingBlock(c: EmailContent, T: typeof THEME[string]): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="pad"
          style="background:${DARK};padding:${c.cta ? '4px' : '12px'} 36px 48px;">
        <p style="margin:0 0 14px;font-family:'Poppins',Arial,sans-serif;font-size:14px;
           color:rgba(255,255,255,0.40);line-height:1.9;">
          ${e(c.closing_line)}
        </p>
        <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:16px;
           font-weight:800;color:${T.sigFb};">
          &mdash;&nbsp;${gradText(e(c.org_name), T.sigGrad, T.sigFb)}
        </p>
      </td>
    </tr>
  </table>`;
}

function footerBlock(c: EmailContent): string {
  const socialCells = SOCIAL.map(s => {
    const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(s.svg)}`;
    return `
      <td style="padding:0 5px;">
        <a href="${s.href}" title="${s.label}"
           style="display:block;width:34px;height:34px;border-radius:17px;
                  background:rgba(255,255,255,0.06);
                  border:1px solid rgba(255,255,255,0.10);
                  text-align:center;text-decoration:none;
                  font-size:0;line-height:34px;">
          <img src="${dataUri}" width="14" height="14" alt="${s.label}"
               style="display:inline-block;vertical-align:middle;border:0;outline:0;" />
        </a>
      </td>`;
  }).join('');

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:${FOOT};border-top:1px solid rgba(255,255,255,0.05);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td height="3" style="height:3px;line-height:3px;font-size:0;padding:0;
                background:${GRAD_BAR};">&nbsp;</td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="padding:32px 36px 36px;text-align:center;">
              <img src="${LOGO}" onerror="this.onerror=null;this.src='${LOGO2}'"
                   alt="Hackoverflow 4.0" width="60" height="60"
                   style="display:block;margin:0 auto 14px;width:60px;height:60px;
                          object-fit:contain;opacity:0.50;border:0;" />
              <p style="margin:0 0 20px;font-family:'Poppins',Arial,sans-serif;font-size:10px;
                 color:rgba(255,255,255,0.14);letter-spacing:1.5px;text-transform:uppercase;">
                ${e(c.org_name)}&nbsp;&nbsp;&middot;&nbsp;&nbsp;${e(c.footer_tagline)}
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                     align="center" style="margin:0 auto 22px;">
                <tr>${socialCells}</tr>
              </table>
              <!-- Split footer text so Gmail doesn't flag it as quoted repeat content -->
              <p style="margin:0 0 2px;font-family:'Poppins',Arial,sans-serif;font-size:10px;
                 color:rgba(255,255,255,0.10);line-height:1.9;">
                Sent to you as a registered participant of Hackoverflow 4.0.
              </p>
              <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-size:10px;
                 color:rgba(255,255,255,0.08);line-height:1.9;">
                &copy; 2025 Hackoverflow&nbsp;&middot;&nbsp;All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function assembleEmailHtml(c: EmailContent): string {
  const T = THEME[c.layout] ?? THEME.announcement;
  const has = {
    callout: !!c.callout,
    grid:    !!(c.grid && c.grid.length > 0),
    list:    !!(c.list && c.list.items.length > 0),
    cta:     !!c.cta,
  };
  const hasSecondary = has.callout || has.grid || has.list;

  // Unique per render — prevents Gmail collapsing repeated emails as quoted thread content
  const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"/>
  <title>${e(c.headline)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap"
        rel="stylesheet"/>
  <!--[if mso]><noscript><xml>
    <o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
  </xml></noscript><![endif]-->
  <style>
    /* Reset */
    body,table,td,p,a,li{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;
        -ms-interpolation-mode:bicubic}
    body{margin:0!important;padding:0!important;background:#111}
    a{color:inherit;text-decoration:none}

    /* ── Tablet / large phone ≤600px ───────── */
    @media only screen and (max-width:600px){
      .wrap{width:100%!important;border-radius:0!important}
      .pad{padding-left:20px!important;padding-right:20px!important}
      .hero{padding-top:40px!important;padding-bottom:44px!important}
      .hdiv{font-size:28px!important;line-height:1.2!important}
      .subp{font-size:13px!important;max-width:100%!important}
      .bodyp{font-size:14px!important}
      .gtable{width:100%!important}
      .gcell{display:block!important;width:100%!important;
             padding-left:0!important;padding-right:0!important;
             padding-bottom:10px!important}
      .cta{display:block!important;text-align:center!important;
           padding:15px 20px!important;box-sizing:border-box!important}
    }

    /* ── Narrow phones ≤380px ───────────────── */
    @media only screen and (max-width:380px){
      .pad{padding-left:14px!important;padding-right:14px!important}
      .hero{padding-top:28px!important;padding-bottom:32px!important;
            padding-left:14px!important;padding-right:14px!important}
      .hdiv{font-size:22px!important;letter-spacing:-0.3px!important}
      .subp{font-size:12px!important}
      .bodyp{font-size:13px!important}
      .namebar{font-size:14px!important;letter-spacing:1px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#111111;">

  <!-- Hidden preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;
              line-height:1px;color:#111;mso-hide:all;">
    ${e(c.subheadline)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#111111;">
    <tr>
      <td style="padding:28px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               class="wrap" align="center"
               style="max-width:580px;width:100%;margin:0 auto;
                      border-radius:18px;overflow:hidden;
                      border:1px solid rgba(255,255,255,0.08);
                      box-shadow:0 24px 80px rgba(0,0,0,0.70);">

          ${topBar()}
          ${nameBar()}
          ${heroBlock(c, T)}
          ${bodyBlock(c)}
          ${hasSecondary ? dividerBlock() : ''}
          ${has.callout ? calloutBlock(c.callout!) : ''}
          ${has.grid    ? gridBlock(c.grid!, T.pill) : ''}
          ${has.list    ? listBlock(c.list!) : ''}
          ${has.cta     ? ctaBlock(c.cta!) : ''}
          ${closingBlock(c, T)}
          ${footerBlock(c)}

        </table>
      </td>
    </tr>
  </table>

  <!-- Unique render token — changes every send so Gmail never collapses
       this email as a quoted reply in a conversation thread. -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:0;
              line-height:0;color:#111111;mso-hide:all;" aria-hidden="true">uid:${uid}</div>

</body>
</html>`;
}