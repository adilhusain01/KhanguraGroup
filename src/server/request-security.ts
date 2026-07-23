import { getDb } from './db'

function requestOrigin(request: Request) {
  const value = request.headers.get('origin')
  return value ? new URL(value).origin : null
}

export function assertAllowedOrigin(request: Request) {
  const origin = requestOrigin(request)
  const allowed = [
    process.env.BETTER_AUTH_URL,
    process.env.VITE_SITE_URL,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '').split(','),
  ]
    .filter(Boolean)
    .map((value) => new URL(value!).origin)

  // Browsers send Origin for JSON mutations. Reject absent origins in production
  // so a credentialed sibling-origin POST cannot rely on SameSite alone.
  if (!origin || !allowed.includes(origin)) {
    throw new RequestSecurityError(
      'This request is not from an approved site.',
      403,
    )
  }
}

export async function verifyTurnstile(request: Request, token: unknown) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production')
      throw new RequestSecurityError('Form protection is not configured.', 503)
    return
  }
  if (typeof token !== 'string' || !token)
    throw new RequestSecurityError(
      'Please complete the verification check.',
      400,
    )

  const remoteip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]
  const body = new FormData()
  body.set('secret', secret)
  body.set('response', token)
  if (remoteip) body.set('remoteip', remoteip)
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body },
  )
  const result = (await response.json().catch(() => null)) as {
    success?: boolean
  } | null
  if (!response.ok || !result?.success)
    throw new RequestSecurityError(
      'Verification expired. Please try again.',
      400,
    )
}

export async function enforceSubmissionRateLimit(
  request: Request,
  scope: 'enquiry' | 'application' | 'upload',
) {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  const db = await getDb()
  const now = new Date()
  const windowEndsAt = new Date(now.getTime() + 15 * 60 * 1000)
  const key = `${scope}:${ip}`
  const collection = db.collection<{
    _id: string
    hits: number
    expiresAt: Date
  }>('submissionRateLimits')
  const existing = await collection.findOne({ _id: key })
  const entry =
    !existing || existing.expiresAt <= now
      ? await collection.findOneAndUpdate(
          { _id: key },
          { $set: { hits: 1, expiresAt: windowEndsAt } },
          { upsert: true, returnDocument: 'after' },
        )
      : await collection.findOneAndUpdate(
          { _id: key },
          { $inc: { hits: 1 } },
          { returnDocument: 'after' },
        )
  if ((entry?.hits ?? 1) > 8)
    throw new RequestSecurityError(
      'Please wait a few minutes before submitting again.',
      429,
    )
}

export class RequestSecurityError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
