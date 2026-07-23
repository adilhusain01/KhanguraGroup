import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import { requireStaffSession } from '../../../server/admin'
import { privateDeliveryUrl } from '../../../server/cloudinary'
import { RequestSecurityError } from '../../../server/request-security'

const input = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(['image', 'raw']).default('raw'),
})
export const Route = createFileRoute('/api/admin/private-url')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          await requireStaffSession(request)
          const data = input.parse(
            Object.fromEntries(new URL(request.url).searchParams),
          )
          const url = privateDeliveryUrl(data.publicId, data.resourceType)
          return json({ url })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Unable to create secure file link.',
            },
            { status },
          )
        }
      },
    },
  },
})
