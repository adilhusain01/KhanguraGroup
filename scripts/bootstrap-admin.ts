import { getAuth } from '../src/server/auth'

const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const name = process.env.BOOTSTRAP_ADMIN_NAME
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD

if (!email || !name || !password) {
  throw new Error(
    'Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, and BOOTSTRAP_ADMIN_PASSWORD for this one-time command.',
  )
}

const auth = await getAuth()
await auth.api.createUser({ body: { email, name, password, role: 'admin' } })
console.log(
  'Initial admin created. Remove the BOOTSTRAP_ADMIN_* variables now.',
)
