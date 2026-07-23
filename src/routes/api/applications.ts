import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { createCareerApplication } from '../../server/leads'
import { applicationInput } from '../../server/schemas'
import {
  assertAllowedOrigin,
  enforceSubmissionRateLimit,
  RequestSecurityError,
  verifyTurnstile,
} from '../../server/request-security'

export const Route = createFileRoute('/api/applications')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertAllowedOrigin(request)
          const body = await request.json()
          await enforceSubmissionRateLimit(request, 'application')
          await verifyTurnstile(request, body.turnstileToken)
          const application = applicationInput.parse(body)
          return json(await createCareerApplication(application), {
            status: 201,
          })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          return json(
            {
              error:
                error instanceof RequestSecurityError
                  ? error.message
                  : 'Please review the application and try again.',
            },
            { status },
          )
        }
      },
    },
  },
})
