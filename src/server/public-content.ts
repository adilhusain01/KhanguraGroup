import { getDb } from './db'

const collections = [
  'projects',
  'services',
  'faqs',
  'testimonials',
  'jobOpenings',
  'siteSettings',
] as const
export type PublicCollection = (typeof collections)[number]

export function isPublicCollection(value: string): value is PublicCollection {
  return collections.includes(value as PublicCollection)
}

export async function getPublishedContent(
  collection: PublicCollection,
  slug?: string,
) {
  const db = await getDb()
  const query = {
    state: 'published',
    deletedAt: null,
    ...(slug ? { slug } : {}),
  }
  const records = await db
    .collection(collection)
    .find(query)
    .sort({ featuredOrder: 1, order: 1, publishedAt: -1 })
    .limit(slug ? 1 : 100)
    .toArray()
  return records.map(({ _id, createdBy, updatedBy, deletedAt, ...record }) => ({
    id: _id.toString(),
    ...record,
  }))
}
