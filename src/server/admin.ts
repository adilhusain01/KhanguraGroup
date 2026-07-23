import { ObjectId } from 'mongodb'
import { getAuth } from './auth'
import { getDb } from './db'
import { RequestSecurityError } from './request-security'

type StaffRole = 'admin' | 'editor'
type StaffSession = {
  user: {
    id: string
    email: string
    name: string
    role?: string
    twoFactorEnabled?: boolean
  }
}

export async function requireStaffSession(
  request: Request,
  roles: StaffRole[] = ['admin', 'editor'],
) {
  const auth = await getAuth()
  const session = (await auth.api.getSession({
    headers: request.headers,
  })) as StaffSession | null
  if (!session?.user)
    throw new RequestSecurityError('Sign in is required.', 401)
  if (!roles.includes(session.user.role as StaffRole))
    throw new RequestSecurityError('You do not have access to this area.', 403)
  if (!session.user.twoFactorEnabled)
    throw new RequestSecurityError(
      'Two-factor authentication must be enabled before using the console.',
      403,
    )
  return session
}

export async function getAdminOverview() {
  const db = await getDb()
  const [
    newEnquiries,
    newApplications,
    publishedProjects,
    failedWhatsapp,
    recentEnquiries,
  ] = await Promise.all([
    db
      .collection('inquiries')
      .countDocuments({ status: 'new', deletedAt: null }),
    db
      .collection('careerApplications')
      .countDocuments({ status: 'new', deletedAt: null }),
    db
      .collection('projects')
      .countDocuments({ state: 'published', deletedAt: null }),
    db.collection('notificationOutbox').countDocuments({ state: 'failed' }),
    db
      .collection('inquiries')
      .find(
        { deletedAt: null },
        {
          projection: {
            name: 1,
            company: 1,
            reference: 1,
            status: 1,
            createdAt: 1,
            projectType: 1,
          },
        },
      )
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
  ])
  return {
    metrics: {
      newEnquiries,
      newApplications,
      publishedProjects,
      failedWhatsapp,
    },
    recentEnquiries: recentEnquiries.map(({ _id, ...item }) => ({
      id: _id.toString(),
      ...item,
    })),
  }
}

const editableCollections = [
  'projects',
  'services',
  'testimonials',
  'faqs',
  'jobOpenings',
  'siteSettings',
] as const
export type EditableCollection = (typeof editableCollections)[number]
export function isEditableCollection(
  value: string,
): value is EditableCollection {
  return editableCollections.includes(value as EditableCollection)
}

export async function listContent(collection: EditableCollection) {
  const db = await getDb()
  return (
    await db
      .collection(collection)
      .find({ deletedAt: null })
      .sort({ updatedAt: -1, order: 1 })
      .limit(100)
      .toArray()
  ).map(({ _id, ...item }) => ({ id: _id.toString(), ...item }))
}

export async function saveContent(
  collection: EditableCollection,
  input: Record<string, unknown>,
  user: StaffSession['user'],
) {
  const db = await getDb()
  const now = new Date()
  const id =
    typeof input.id === 'string' && ObjectId.isValid(input.id)
      ? new ObjectId(input.id)
      : null
  const { id: _id, ...data } = input
  const requestedState = typeof data.state === 'string' ? data.state : undefined
  if (requestedState === 'published' && user.role !== 'admin')
    throw new RequestSecurityError(
      'Only administrators can publish content.',
      403,
    )
  const safeData = {
    ...data,
    state: requestedState ?? 'draft',
    publishedAt: requestedState === 'published' ? now : undefined,
    updatedAt: now,
    updatedBy: user.id,
  }
  if (id) {
    await db
      .collection(collection)
      .updateOne({ _id: id, deletedAt: null }, { $set: safeData })
    await recordAudit(
      user,
      'updated',
      collection,
      id.toString(),
      Object.keys(data),
    )
    return { id: id.toString() }
  }
  const result = await db.collection(collection).insertOne({
    ...safeData,
    createdAt: now,
    createdBy: user.id,
    deletedAt: null,
  })
  await recordAudit(
    user,
    'created',
    collection,
    result.insertedId.toString(),
    Object.keys(data),
  )
  return { id: result.insertedId.toString() }
}

export async function trashContent(
  collection: EditableCollection,
  id: string,
  user: StaffSession['user'],
) {
  if (!ObjectId.isValid(id))
    throw new RequestSecurityError('Invalid content record.', 400)
  const db = await getDb()
  const result = await db
    .collection(collection)
    .updateOne(
      { _id: new ObjectId(id), deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      },
    )
  if (!result.matchedCount)
    throw new RequestSecurityError('Content record was not found.', 404)
  await recordAudit(user, 'trashed', collection, id, [])
}

export async function listInbox(
  collection: 'inquiries' | 'careerApplications',
) {
  const db = await getDb()
  const projection =
    collection === 'inquiries'
      ? {
          reference: 1,
          name: 1,
          company: 1,
          email: 1,
          phone: 1,
          projectType: 1,
          location: 1,
          services: 1,
          status: 1,
          notes: 1,
          createdAt: 1,
          attachments: 1,
        }
      : {
          reference: 1,
          openingSlug: 1,
          name: 1,
          email: 1,
          phone: 1,
          city: 1,
          experience: 1,
          years: 1,
          status: 1,
          notes: 1,
          createdAt: 1,
          resume: 1,
          supportingFiles: 1,
        }
  return (
    await db
      .collection(collection)
      .find({ deletedAt: null }, { projection })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray()
  ).map(({ _id, ...item }) => ({ id: _id.toString(), ...item }))
}

export async function updateInbox(
  collection: 'inquiries' | 'careerApplications',
  id: string,
  input: { status?: string; note?: string },
  user: StaffSession['user'],
) {
  if (!ObjectId.isValid(id))
    throw new RequestSecurityError('Invalid inbox record.', 400)
  const statuses =
    collection === 'inquiries'
      ? ['new', 'contacted', 'quoting', 'won', 'lost', 'spam']
      : ['new', 'reviewing', 'interview', 'offer', 'hired', 'rejected']
  if (input.status && !statuses.includes(input.status))
    throw new RequestSecurityError('Invalid workflow status.', 400)
  if (input.note && input.note.length > 3000)
    throw new RequestSecurityError('Note is too long.', 400)
  const db = await getDb()
  const now = new Date()
  const update: Record<string, unknown> = { updatedAt: now }
  if (input.status) update.status = input.status
  if (input.note?.trim())
    update.$push = {
      notes: { body: input.note.trim(), actorId: user.id, createdAt: now },
    }
  const result = await db
    .collection(collection)
    .updateOne({ _id: new ObjectId(id), deletedAt: null }, update)
  if (!result.matchedCount)
    throw new RequestSecurityError('Inbox record was not found.', 404)
  await recordAudit(
    user,
    'workflow-updated',
    collection,
    id,
    Object.keys(input),
  )
}

async function recordAudit(
  user: StaffSession['user'],
  action: string,
  entityType: string,
  entityId: string,
  changedFields: string[],
) {
  const db = await getDb()
  await db
    .collection('auditEvents')
    .insertOne({
      actorId: user.id,
      actorEmail: user.email,
      action,
      entityType,
      entityId,
      changedFields,
      createdAt: new Date(),
    })
}
