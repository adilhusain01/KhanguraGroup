import { destroyPrivateAsset } from './cloudinary'
import { getDb } from './db'

type Attachment = { publicId?: string; resourceType?: 'image' | 'raw' }
const monthsAgo = (months: number) => {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date
}
async function destroyFiles(files: Attachment[]) {
  await Promise.allSettled(
    files
      .filter((file): file is Attachment & { publicId: string } =>
        Boolean(file.publicId),
      )
      .map((file) =>
        destroyPrivateAsset(file.publicId, file.resourceType ?? 'raw'),
      ),
  )
}

export async function enforceRetention() {
  const db = await getDb()
  const inquiryCutoff = monthsAgo(24)
  const applicationCutoff = monthsAgo(12)
  const [inquiries, applications] = await Promise.all([
    db
      .collection<{ _id: unknown; attachments?: Attachment[] }>('inquiries')
      .find({
        status: { $in: ['won', 'lost', 'spam'] },
        updatedAt: { $lt: inquiryCutoff },
        deletedAt: null,
      })
      .limit(100)
      .toArray(),
    db
      .collection<{
        _id: unknown
        resume?: Attachment
        supportingFiles?: Attachment[]
      }>('careerApplications')
      .find({
        status: { $in: ['hired', 'rejected'] },
        updatedAt: { $lt: applicationCutoff },
        deletedAt: null,
      })
      .limit(100)
      .toArray(),
  ])
  await Promise.all(
    inquiries.map(async (record) => {
      await destroyFiles(record.attachments ?? [])
      await db.collection('inquiries').deleteOne({ _id: record._id })
    }),
  )
  await Promise.all(
    applications.map(async (record) => {
      await destroyFiles([
        ...(record.resume ? [record.resume] : []),
        ...(record.supportingFiles ?? []),
      ])
      await db.collection('careerApplications').deleteOne({ _id: record._id })
    }),
  )
  return {
    enquiriesPurged: inquiries.length,
    applicationsPurged: applications.length,
  }
}
