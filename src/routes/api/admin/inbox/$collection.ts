import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import {
  listInbox,
  requireStaffSession,
  updateInbox,
} from '../../../../server/admin'
import {
  assertAllowedOrigin,
  RequestSecurityError,
} from '../../../../server/request-security'

const updateInput = z.object({
  id: z.string(),
  status: z.string().optional(),
  note: z.string().optional(),
})
const isInboxCollection = (
  value: string,
): value is 'inquiries' | 'careerApplications' =>
  value === 'inquiries' || value === 'careerApplications'
export const Route = createFileRoute('/api/admin/inbox/$collection')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          await requireStaffSession(request)
          if (!isInboxCollection(params.collection))
            return json({ error: 'Unknown inbox.' }, { status: 404 })
          return json(await listInbox(params.collection))
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 500
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load inbox.',
            },
            { status },
          )
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          assertAllowedOrigin(request)
          const session = await requireStaffSession(request)
          if (!isInboxCollection(params.collection))
            return json({ error: 'Unknown inbox.' }, { status: 404 })
          const data = updateInput.parse(await request.json())
          await updateInbox(params.collection, data.id, data, session.user)
          return json({ ok: true })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to update inbox.',
            },
            { status },
          )
        }
      },
    },
  },
})
