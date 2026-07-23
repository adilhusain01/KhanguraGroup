import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { enforceRetention } from '../../../server/retention'

export const Route = createFileRoute('/api/cron/retention')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.CRON_SECRET
        if (
          !secret ||
          request.headers.get('authorization') !== `Bearer ${secret}`
        )
          return json({ error: 'Unauthorized' }, { status: 401 })
        return json(await enforceRetention())
      },
    },
  },
})
