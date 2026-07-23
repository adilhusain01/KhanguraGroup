import { getDb } from './db'

type EnquiryEmail = {
  reference: string
  name: string
  company?: string
  phone: string
  email: string
  projectType: string
  location: string
  timeline: string
  services: string[]
  description: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return entities[character]
  })
}

async function sendAdminEmail(lead: EnquiryEmail) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const recipient =
    process.env.LEAD_NOTIFICATION_EMAIL ?? process.env.BOOTSTRAP_ADMIN_EMAIL
  if (!apiKey || !from || !recipient)
    throw new Error(
      'Email notifications require RESEND_API_KEY, RESEND_FROM_EMAIL, and LEAD_NOTIFICATION_EMAIL.',
    )

  const rows = [
    ['Reference', lead.reference],
    ['Name', lead.name],
    ['Company', lead.company || '—'],
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['Project type', lead.projectType],
    ['Location', lead.location],
    ['Timeline', lead.timeline],
    ['Services', lead.services.join(', ')],
  ]
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 16px 8px 0">${escapeHtml(label)}</th><td style="padding:8px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: lead.email,
      subject: `New Khangura enquiry · ${lead.reference}`,
      html: `<main style="font-family:Arial,sans-serif;color:#1a1f2c"><h1>New project enquiry</h1><table>${rows}</table><h2>Project description</h2><p style="white-space:pre-wrap;line-height:1.6">${escapeHtml(lead.description)}</p></main>`,
    }),
  })
  if (!response.ok)
    throw new Error(`Email delivery failed (${response.status}).`)
  return (await response.json()) as { id?: string }
}

export async function deliverQueuedEnquiryEmail(reference: string) {
  const db = await getDb()
  const lead = await db
    .collection<EnquiryEmail & { emailNotice?: { attempts?: number } }>(
      'inquiries',
    )
    .findOneAndUpdate(
      { reference, 'emailNotice.state': { $in: ['queued', 'failed'] } },
      {
        $set: { 'emailNotice.state': 'sending', updatedAt: new Date() },
        $inc: { 'emailNotice.attempts': 1 },
      },
      {
        projection: {
          reference: 1,
          name: 1,
          company: 1,
          phone: 1,
          email: 1,
          projectType: 1,
          location: 1,
          timeline: 1,
          services: 1,
          description: 1,
          'emailNotice.attempts': 1,
        },
        returnDocument: 'after',
      },
    )
  if (!lead) return { state: 'skipped' as const }

  try {
    const result = await sendAdminEmail(lead)
    await db.collection('inquiries').updateOne(
      { reference },
      {
        $set: {
          'emailNotice.state': 'sent',
          'emailNotice.messageId': result.id,
          'emailNotice.sentAt': new Date(),
          updatedAt: new Date(),
        },
      },
    )
    return { state: 'sent' as const }
  } catch (error) {
    const attempts = lead.emailNotice?.attempts ?? 1
    await db.collection('inquiries').updateOne(
      { reference },
      {
        $set: {
          'emailNotice.state': attempts >= 5 ? 'failed' : 'queued',
          'emailNotice.lastError':
            error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        },
      },
    )
    throw error
  }
}

export async function retryQueuedEnquiryEmails(limit = 25) {
  const db = await getDb()
  const records = await db
    .collection<{ reference: string }>('inquiries')
    .find({ 'emailNotice.state': 'queued' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray()
  const results = await Promise.allSettled(
    records.map((record) => deliverQueuedEnquiryEmail(record.reference)),
  )
  return {
    attempted: records.length,
    sent: results.filter(
      (result) =>
        result.status === 'fulfilled' && result.value.state === 'sent',
    ).length,
  }
}
