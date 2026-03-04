/**
 * Email Sending Utilities
 * lib/email.ts
 */

import nodemailer from 'nodemailer';
import type { Participant, EmailResult } from '@/types';

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email configuration missing. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env.local'
    );
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Replaces ALL template variables with actual participant data.
 */
function personalizeContent(template: string, participant: Participant & {
  teamName?: string;
  teamId?: string;
  projectName?: string;
  state?: string;
  labAllotted?: string;
  participantId?: string;
}): string {
  return template
    .replace(/\{\{name\}\}/g,          participant.name          || '')
    .replace(/\{\{email\}\}/g,         participant.email         || '')
    .replace(/\{\{role\}\}/g,          participant.role          || '')
    .replace(/\{\{company\}\}/g,       participant.company       || '')
    .replace(/\{\{phone\}\}/g,         participant.phone         || '')
    .replace(/\{\{teamName\}\}/g,      participant.teamName      || '')
    .replace(/\{\{teamId\}\}/g,        participant.teamId        || '')
    .replace(/\{\{projectName\}\}/g,   participant.projectName   || '')
    .replace(/\{\{state\}\}/g,         participant.state         || '')
    .replace(/\{\{labAllotted\}\}/g,   participant.labAllotted   || '')
    .replace(/\{\{participantId\}\}/g, participant.participantId || '');
}

/**
 * Returns true if the string is already a complete HTML document.
 * Used to skip the old wrapInTemplate() wrapper.
 */
function isCompleteHtmlDocument(html: string): boolean {
  const trimmed = html.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

export async function sendBatchEmails(
  subject: string,
  htmlContent: string,
  recipients: Participant[]
): Promise<EmailResult> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const transporter = createTransporter();

    try {
      await transporter.verify();
    } catch {
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        error: 'Failed to connect to email server. Check your email configuration.',
      };
    }

    for (const recipient of recipients) {
      try {
        // Personalize first (replaces all {{tokens}} with real values)
        const personalizedHtml = personalizeContent(htmlContent, recipient as any);

        // If it's already a full HTML document (from assembleEmailHtml),
        // send it directly — do NOT wrap it in another template.
        const finalHtml = isCompleteHtmlDocument(personalizedHtml)
          ? personalizedHtml
          : `<!DOCTYPE html><html><body>${personalizedHtml}</body></html>`;

        await transporter.sendMail({
          from: `"Hackoverflow 4.0" <${process.env.EMAIL_USER}>`,
          to: recipient.email,
          subject,
          html: finalHtml,
          text: personalizedHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
        });

        sent++;
      } catch (error) {
        failed++;
        const msg = `Failed to send to ${recipient.email}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(msg);
        console.error(msg);
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('Error in sendBatchEmails:', error);
    return {
      success: false,
      sent,
      failed: recipients.length - sent,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}