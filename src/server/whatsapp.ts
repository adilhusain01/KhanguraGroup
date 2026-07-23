import { getDb } from './db'

type LeadNotice = {
  reference: string
  projectType: string
  location: string
  services: string[]
}

async function sendNotice(lead: LeadNotice) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const recipient = process.env.WHATSAPP_INTERNAL_RECIPIENT
  if (!token || !phoneNumberId || !recipient)
    throw new Error('WhatsApp is not configured.')
  const body = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME ?? 'new_enquiry',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: lead.reference },
            { type: 'text', text: lead.projectType },
            { type: 'text', text: lead.location },
            { type: 'text', text: lead.services.join(', ') },
          ],
        },
      ],
    },
  }
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  if (!response.ok)
    throw new Error(`WhatsApp delivery failed (${response.status}).`)
  return (await response.json()) as { messages?: Array<{ id?: string }> }
}

export async function deliverQueuedWhatsApp(reference: string) {
  const db = await getDb()
  const outbox = await db.collection('notificationOutbox').findOneAndUpdate(
    { reference, state: { $in: ['queued', 'failed'] } },
    {
      $set: { state: 'sending', updatedAt: new Date() },
      $inc: { attempts: 1 },
    },
    { returnDocument: 'after' },
  )
  if (!outbox) return { state: 'skipped' as const }
  const lead = await db.collection<LeadNotice>('inquiries').findOne(
    { reference },
    {
      projection: { reference: 1, projectType: 1, location: 1, services: 1 },
    },
  )
  if (!lead) return { state: 'skipped' as const }
  try {
    const result = await sendNotice(lead)
    const messageId = result.messages?.[0]?.id
    await db.collection('notificationOutbox').updateOne(
      { _id: outbox._id },
      {
        $set: {
          state: 'sent',
          messageId,
          sentAt: new Date(),
          updatedAt: new Date(),
        },
      },
    )
    await db.collection('inquiries').updateOne(
      { reference },
      {
        $set: {
          'whatsapp.state': 'sent',
          'whatsapp.messageId': messageId,
          updatedAt: new Date(),
        },
      },
    )
    return { state: 'sent' as const }
  } catch (error) {
    const attempts = outbox.attempts ?? 1
    const nextAttemptAt = new Date(
      Date.now() + Math.min(60 * 60 * 1000, 60_000 * 2 ** attempts),
    )
    await db.collection('notificationOutbox').updateOne(
      { _id: outbox._id },
      {
        $set: {
          state: attempts >= 5 ? 'failed' : 'queued',
          lastError: error instanceof Error ? error.message : 'Unknown error',
          nextAttemptAt,
          updatedAt: new Date(),
        },
      },
    )
    await db.collection('inquiries').updateOne(
      { reference },
      {
        $set: {
          'whatsapp.state': attempts >= 5 ? 'failed' : 'queued',
          updatedAt: new Date(),
        },
      },
    )
    throw error
  }
}

export async function retryWhatsAppNotifications(limit = 25) {
  const db = await getDb()
  const records = await db
    .collection<{ reference: string }>('notificationOutbox')
    .find({ state: 'queued', nextAttemptAt: { $lte: new Date() } })
    .sort({ nextAttemptAt: 1 })
    .limit(limit)
    .toArray()
  const results = await Promise.allSettled(
    records.map((record) => deliverQueuedWhatsApp(record.reference)),
  )
  return {
    attempted: records.length,
    sent: results.filter(
      (result) =>
        result.status === 'fulfilled' && result.value.state === 'sent',
    ).length,
  }
}

export async function updateWhatsAppDelivery(payload: unknown) {
  const statuses =
    (
      payload as {
        entry?: Array<{
          changes?: Array<{
            value?: { statuses?: Array<{ id?: string; status?: string }> }
          }>
        }>
      }
    ).entry
      ?.flatMap((entry) => entry.changes ?? [])
      .flatMap((change) => change.value?.statuses ?? []) ?? []
  if (!statuses.length) return
  const db = await getDb()
  await Promise.all(
    statuses
      .filter((status) => status.id && status.status)
      .map((status) =>
        db.collection('notificationOutbox').updateOne(
          { messageId: status.id },
          {
            $set: {
              deliveryStatus: status.status,
              deliveryUpdatedAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ),
      ),
  )
}
