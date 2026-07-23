import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import { publicUploadSignature } from '../../../server/cloudinary'
import { requireStaffSession } from '../../../server/admin'
import {
  assertAllowedOrigin,
  RequestSecurityError,
} from '../../../server/request-security'
import { getDb } from '../../../server/db'

const assetInput = z.object({
  action: z.literal('record'),
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  width: z.number().optional(),
  height: z.number().optional(),
  bytes: z.number().optional(),
  alt: z.string().min(3).max(300),
  originalFilename: z.string().max(255).optional(),
})
export const Route = createFileRoute('/api/admin/media')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireStaffSession(request)
          const db = await getDb()
          const items = await db
            .collection('mediaAssets')
            .find({ deletedAt: null })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray()
          return json(
            items.map(({ _id, ...item }) => ({ id: _id.toString(), ...item })),
          )
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 500
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load media.',
            },
            { status },
          )
        }
      },
      POST: async ({ request }) => {
        try {
          assertAllowedOrigin(request)
          const session = await requireStaffSession(request)
          const body = await request.json()
          if (body.action === 'sign') return json(publicUploadSignature())
          const asset = assetInput.parse(body)
          const db = await getDb()
          const now = new Date()
          await db
            .collection('mediaAssets')
            .updateOne(
              { publicId: asset.publicId },
              {
                $set: {
                  ...asset,
                  access: 'public',
                  updatedAt: now,
                  updatedBy: session.user.id,
                  deletedAt: null,
                },
                $setOnInsert: { createdAt: now, createdBy: session.user.id },
              },
              { upsert: true },
            )
          return json({ ok: true })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to save media.',
            },
            { status },
          )
        }
      },
    },
  },
})
