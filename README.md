# Khangura Group — Blueprint to Finish

Modern construction and finishing website with an admin CMS foundation.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The public experience works without secrets. With the configured services, enquiries and applications are saved in MongoDB, private files upload directly to Cloudinary, and the WhatsApp outbox records delivery attempts independently of lead persistence.

## Production wiring checklist

1. Set preview and production environment variables in Vercel; use distinct Atlas databases and Cloudinary folders.
2. Run `ensureIndexes()` from `src/server/db.ts` as part of the initial deploy/seed task.
3. On a trusted local machine only, set the three `BOOTSTRAP_ADMIN_*` values in `.env`, run `npm run bootstrap-admin`, then remove those values. Public registration remains disabled. The first admin completes mandatory TOTP enrollment at `/admin`.
4. Set `VITE_TURNSTILE_SITE_KEY` alongside `TURNSTILE_SECRET_KEY`, configure the Meta webhook as `/api/webhooks/whatsapp`, and set `CRON_SECRET` for both Vercel jobs.
5. Add the production Resend sender and Sentry/GA4 identifiers when those services are configured; visitor analytics remains consent-gated.
6. Replace the draft project cards with company-approved images, captions, alt text, and factual case-study content before public launch.
