'use server';

import { checkSessionAction } from './auth';
import { assembleEmailHtml, type EmailContent } from './email-template';
export type { EmailContent } from './email-template';

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional email copywriter for Hackoverflow 4.0, a premier hackathon event.
Your ONLY job is to write email text content and return it as a single valid JSON object.
Return ONLY the JSON — no markdown, no code fences, no explanation, nothing else.

JSON shape:
{
  "layout": "announcement | welcome | verification | reminder",
  "eyebrow": "Short all-caps label above the headline",
  "headline": "Bold punchy heading, max 8 words",
  "subheadline": "One sentence subtitle, max 15 words",
  "paragraphs": ["Paragraph 1 (2-3 sentences)", "Paragraph 2 (optional)", "Paragraph 3 (optional)"],
  "callout": { "style": "neutral | success | warning", "label": "Short label", "value": "Key fact value" },
  "grid": [{ "label": "Field label", "value": "Field value" }],
  "list": { "title": "List section title", "items": ["Item 1", "Item 2"] },
  "cta": { "label": "Button text", "url": "https://hackoverflow4.tech/" },
  "closing_line": "Warm closing sentence",
  "org_name": "Hackoverflow Team",
  "footer_tagline": "Short punchy tagline"
}

LAYOUT RULES — pick exactly one:
- "announcement" → Big bold news: shortlisting results, prize reveals, major updates, project submissions open
- "welcome"      → Warm onboarding: registration confirmed, team formed, participant accepted, welcome aboard
- "verification" → Data display: verify your details, confirm your info, check your registration data
- "reminder"     → Urgent/time-sensitive: submission deadline, check-in reminder, final call, don't miss out

FIELD RULES:

layout: REQUIRED. Choose based on the email's intent (see above).

eyebrow: Short label, 2-4 words, ALL CAPS tone (e.g. "HACKOVERFLOW 4.0", "REGISTRATION OPEN", "IMPORTANT NOTICE").

headline: Max 8 words. Punchy and direct. No punctuation at the end.

subheadline: One sentence, max 15 words. Supports the headline.

paragraphs: 1 to 3 items. 2-3 sentences each. Use {{name}}, {{role}}, {{company}}, {{teamName}}, {{projectName}}, {{participantId}} naturally where they add personalisation. Be warm, energetic, and professional.

callout: Include ONLY for a single most-important fact (key date, venue, deadline, result). 
  - "success" → good news (accepted, shortlisted, winner)
  - "warning" → urgency (deadline, final reminder)  
  - "neutral" → general info (date, venue, ID)
  Omit entirely if no single standout fact exists.

grid: Include for structured key-value data about the participant or event.
  - Up to 10 items allowed — use all relevant fields provided.
  - Keep BOTH label and value SHORT (under 35 chars each).
  - NEVER put email addresses, long sentences, or URLs as grid values — those belong in paragraphs.
  - For verification emails, use: Name, Phone, Institute, State, Role, Team Name, Team ID, Project, Lab, Participant ID.
  - For event info, use: Date, Venue, Duration, Theme, etc.
  - Omit only if there are no structured facts to show.

list: Include ONLY for a real checklist (what to bring, agenda steps, requirements). 2-5 items. Omit otherwise.

cta: Include when there is a natural action. The url MUST ALWAYS be exactly "https://hackoverflow4.tech/" — no paths, no slugs appended. 
  - Label must match email intent: never use "Confirm", "Register", "Sign Up" on informational emails.
  - Use passive labels for notifications: "View Event Details", "Explore Hackoverflow", "See Schedule".
  - Omit entirely if the email is purely informational with no meaningful action.

org_name: ALWAYS exactly "Hackoverflow Team". Never change this.

footer_tagline: A short punchy tagline matching the event vibe. E.g. "Build. Break. Repeat." or "36 Hours of Pure Innovation." or "Code All Night. Change the World."

IMPORTANT: Output ONLY the JSON object. Absolutely nothing else.`;

// ─── Groq call ────────────────────────────────────────────────────────────────

async function callGroq(subject: string, brief: string): Promise<EmailContent> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured in .env.local');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1400,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Subject: ${subject}\n\nEmail brief:\n${brief}` },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Groq error ${res.status}`);

  const raw: string = data.choices?.[0]?.message?.content || '{}';
  const clean = raw.replace(/```json|```/gi, '').trim();

  let parsed: Partial<EmailContent>;
  try {
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Groq returned malformed JSON — try again.');
  }

  const validLayouts = ['announcement', 'welcome', 'verification', 'reminder'];

  return {
    layout:         validLayouts.includes(parsed.layout as string)
                      ? (parsed.layout as EmailContent['layout'])
                      : 'announcement',
    eyebrow:        parsed.eyebrow        || 'Hackoverflow 4.0',
    headline:       parsed.headline       || subject,
    subheadline:    parsed.subheadline    || '',
    paragraphs:     Array.isArray(parsed.paragraphs) && parsed.paragraphs.length
                      ? parsed.paragraphs.slice(0, 3)
                      : ['We have an update for you.'],
    callout:        parsed.callout?.label  ? parsed.callout                        : undefined,
    grid:           Array.isArray(parsed.grid) && parsed.grid.length
                      ? parsed.grid.slice(0, 10)
                      : undefined,
    list:           parsed.list?.items?.length ? parsed.list                       : undefined,
    // URL is ALWAYS hardcoded — Groq's value is completely ignored
    cta:            parsed.cta?.label
                      ? { label: parsed.cta.label, url: 'https://hackoverflow4.tech/' }
                      : undefined,
    closing_line:   parsed.closing_line   || 'Looking forward to seeing you there.',
    org_name:       'Hackoverflow Team',  // hardcoded — never trust the model
    footer_tagline: parsed.footer_tagline || 'Build. Break. Repeat.',
  };
}

// ─── Exported server action ───────────────────────────────────────────────────

export interface GenerateEmailResult {
  success: boolean;
  html?: string;
  content?: EmailContent;
  error?: string;
}

export async function generateEmailAction(
  subject: string,
  brief: string
): Promise<GenerateEmailResult> {
  try {
    const session = await checkSessionAction();
    if (!session.authenticated) return { success: false, error: 'Authentication required' };
    if (!subject?.trim())        return { success: false, error: 'Subject is required' };
    if (!brief?.trim())          return { success: false, error: 'Email brief is required' };
    if (brief.length > 3000)     return { success: false, error: 'Brief too long (max 3000 chars)' };

    const content = await callGroq(subject, brief);
    const html    = assembleEmailHtml(content);

    return { success: true, html, content };
  } catch (err) {
    console.error('[generateEmailAction]', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}