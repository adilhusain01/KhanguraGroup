import { randomUUID } from 'node:crypto'
import { getDb } from './db'
import { applicationInput, enquiryInput } from './schemas'
import type { ApplicationInput, EnquiryInput } from './schemas'

export async function createEnquiry(input: EnquiryInput) {
  const data = enquiryInput.parse(input)
  const reference = `KG-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const now = new Date()
  const db = await getDb()
  await db.collection('inquiries').insertOne({
    ...data,
    reference,
    status: 'new',
    whatsapp: { state: 'queued', attempts: 0 },
    emailNotice: { state: 'queued', attempts: 0 },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })
  await db.collection('notificationOutbox').insertOne({
    type: 'whatsapp-enquiry',
    reference,
    state: 'queued',
    attempts: 0,
    nextAttemptAt: now,
    createdAt: now,
    updatedAt: now,
  })
  return { reference }
}
export async function createCareerApplication(input: ApplicationInput) {
  const data = applicationInput.parse(input)
  const reference = `KGA-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`
  const now = new Date()
  const db = await getDb()
  await db.collection('careerApplications').insertOne({
    ...data,
    reference,
    status: 'new',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })
  return { reference }
}
