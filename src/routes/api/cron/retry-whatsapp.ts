import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { retryWhatsAppNotifications } from '../../../server/whatsapp'

export const Route = createFileRoute('/api/cron/retry-whatsapp')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET
        if (
          !secret ||
          request.headers.get('authorization') !== `Bearer ${secret}`
        )
          return json({ error: 'Unauthorized' }, { status: 401 })
        return json(await retryWhatsAppNotifications())
      },
    },
  },
})
