import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getAdminOverview, requireStaffSession } from '../../../server/admin'
import { RequestSecurityError } from '../../../server/request-security'

export const Route = createFileRoute('/api/admin/overview')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireStaffSession(request)
          return json(await getAdminOverview())
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 500
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to load the console.',
            },
            { status },
          )
        }
      },
    },
  },
})
