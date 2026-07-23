import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { updateWhatsAppDelivery } from '../../../server/whatsapp'

function hasValidSignature(body: string, signature: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  if (!signature?.startsWith('sha256=')) return false
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
}

export const Route = createFileRoute('/api/webhooks/whatsapp')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        if (
          url.searchParams.get('hub.mode') === 'subscribe' &&
          url.searchParams.get('hub.verify_token') ===
            process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
        )
          return new Response(url.searchParams.get('hub.challenge') ?? '', {
            status: 200,
          })
        return new Response('Forbidden', { status: 403 })
      },
      POST: async ({ request }) => {
        const body = await request.text()
        if (
          !hasValidSignature(body, request.headers.get('x-hub-signature-256'))
        )
          return new Response('Forbidden', { status: 403 })
        await updateWhatsAppDelivery(JSON.parse(body)).catch(() => undefined)
        return new Response(null, { status: 200 })
      },
    },
  },
})
