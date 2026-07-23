import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { createEnquiry } from '../../server/leads'
import { enquiryInput } from '../../server/schemas'
import { deliverQueuedWhatsApp } from '../../server/whatsapp'
import {
  assertAllowedOrigin,
  enforceSubmissionRateLimit,
  RequestSecurityError,
  verifyTurnstile,
} from '../../server/request-security'

export const Route = createFileRoute('/api/inquiries')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertAllowedOrigin(request)
          const body = await request.json()
          await enforceSubmissionRateLimit(request, 'enquiry')
          await verifyTurnstile(request, body.turnstileToken)
          const data = enquiryInput.parse(body)
          const { reference } = await createEnquiry(data)
          // Persist first: notification failure must never invalidate the lead.
          void deliverQueuedWhatsApp(reference).catch(() => undefined)
          return json({ reference }, { status: 201 })
        } catch (error) {
          const status =
            error instanceof RequestSecurityError ? error.status : 400
          const message =
            error instanceof RequestSecurityError
              ? error.message
              : 'Please review the form and try again.'
          return json({ error: message }, { status })
        }
      },
    },
  },
})
