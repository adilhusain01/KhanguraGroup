import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { z } from 'zod'
import { privateUploadSignature } from '../../../server/cloudinary'
import {
  assertAllowedOrigin,
  enforceSubmissionRateLimit,
  RequestSecurityError,
  verifyTurnstile,
} from '../../../server/request-security'

const input = z.object({
  kind: z.enum(['inquiry', 'application']),
  resourceType: z.enum(['image', 'raw']),
  turnstileToken: z.string().optional(),
})
export const Route = createFileRoute('/api/uploads/sign')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertAllowedOrigin(request)
          const data = input.parse(await request.json())
          await enforceSubmissionRateLimit(request, 'upload')
          await verifyTurnstile(request, data.turnstileToken)
          return json(privateUploadSignature(data.kind, data.resourceType))
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof RequestSecurityError
                  ? error.message
                  : 'Unable to prepare this upload.',
            },
            { status },
          )
        }
      },
    },
  },
})
