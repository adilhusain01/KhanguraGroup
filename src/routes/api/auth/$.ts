import { createFileRoute } from '@tanstack/react-router'
import { getAuth } from '../../../server/auth'

// Better Auth owns the invite-only sign-in, session, admin-role, and TOTP endpoints.
export const Route = createFileRoute('/api/auth/$')({
  server: { handlers: {
    GET: ({ request }) => getAuth().then((auth) => auth.handler(request)),
    POST: ({ request }) => getAuth().then((auth) => auth.handler(request)),
  } },
})
