import type { Db} from 'mongodb';
import { MongoClient } from 'mongodb'

const globalMongo = globalThis as typeof globalThis & {
  _khanguraMongo?: Promise<MongoClient>
}
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  const database = process.env.MONGODB_DB
  if (!uri || !database)
    throw new Error(
      'MongoDB is not configured. Set MONGODB_URI and MONGODB_DB.',
    )
  globalMongo._khanguraMongo ??= new MongoClient(uri, {
    maxPoolSize: 8,
    serverSelectionTimeoutMS: 5000,
  }).connect()
  return (await globalMongo._khanguraMongo).db(database)
}
export async function ensureIndexes() {
  const db = await getDb()
  await Promise.all([
    db.collection('services').createIndex({ slug: 1 }, { unique: true }),
    db.collection('projects').createIndex({ slug: 1 }, { unique: true }),
    db.collection('jobOpenings').createIndex({ slug: 1 }, { unique: true }),
    db.collection('inquiries').createIndex({ status: 1, createdAt: -1 }),
    db
      .collection('careerApplications')
      .createIndex({ status: 1, createdAt: -1 }),
    db.collection('mediaAssets').createIndex({ publicId: 1 }, { unique: true }),
    db
      .collection('notificationOutbox')
      .createIndex({ state: 1, nextAttemptAt: 1 }),
    db
      .collection('submissionRateLimits')
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ])
}
