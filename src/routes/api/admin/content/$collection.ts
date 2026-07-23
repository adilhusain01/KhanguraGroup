import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import {
  isEditableCollection,
  listContent,
  requireStaffSession,
  saveContent,
  trashContent,
} from '../../../../server/admin'
import {
  assertAllowedOrigin,
  RequestSecurityError,
} from '../../../../server/request-security'

export const Route = createFileRoute('/api/admin/content/$collection')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireStaffSession(request)
          if (!isEditableCollection(params.collection))
            return json({ error: 'Unknown collection.' }, { status: 404 })
          return json(await listContent(params.collection))
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 500
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load content.',
            },
            { status },
          )
        }
      },
      POST: async ({ request, params }) => {
        try {
          assertAllowedOrigin(request)
          const session = await requireStaffSession(request)
          if (!isEditableCollection(params.collection))
            return json({ error: 'Unknown collection.' }, { status: 404 })
          return json(
            await saveContent(
              params.collection,
              await request.json(),
              session.user,
            ),
            { status: 201 },
          )
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to save content.',
            },
            { status },
          )
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          assertAllowedOrigin(request)
          const session = await requireStaffSession(request, ['admin'])
          if (!isEditableCollection(params.collection))
            return json({ error: 'Unknown collection.' }, { status: 404 })
          const { id } = z
            .object({ id: z.string() })
            .parse(await request.json())
          await trashContent(params.collection, id, session.user)
          return json({ ok: true })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to remove content.',
            },
            { status },
          )
        }
      },
    },
  },
})
