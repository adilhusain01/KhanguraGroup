import { betterAuth } from 'better-auth'
import { mongodbAdapter } from '@better-auth/mongo-adapter'
import { admin } from 'better-auth/plugins/admin'
import { twoFactor } from 'better-auth/plugins/two-factor'
import { getDb } from './db'

// Called only by the auth route after production configuration exists. Public sign-up stays disabled.
export async function getAuth() {
  const db = await getDb()
  return betterAuth({
    appName: 'Khangura Group Content Console', baseURL: process.env.BETTER_AUTH_URL, secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db), emailAndPassword: { enabled: true, disableSignUp: true },
    plugins: [admin({ defaultRole: 'editor', adminRoles: ['admin'] }), twoFactor()],
    trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '').split(',').filter(Boolean),
    rateLimit: { enabled: true, window: 60, max: 8 }, session: { expiresIn: 60 * 60 * 8, updateAge: 60 * 15, cookieCache: { enabled: true, maxAge: 60 * 15 } },
    advanced: { useSecureCookies: process.env.NODE_ENV === 'production' },
  })
}
