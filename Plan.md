# Khangura Group — Interactive Website and Admin CMS

## Summary

Build a modern, English-language construction website plus protected admin CMS that:

- Converts homeowners, builders, and commercial clients into qualified enquiries.
- Demonstrates workmanship through project case studies and the existing five interactive service scenes.
- Supports recruitment through job listings and a structured application form.
- Lets staff manage content, Cloudinary media, enquiries, applications, FAQs, testimonials, services, and site settings.
- Saves submissions to MongoDB before attempting WhatsApp notification, ensuring leads are never lost.
- Uses verified company facts only; certifications, statistics, testimonials, and guarantees remain unpublished until confirmed.

The visual concept will be **“Blueprint to Finish”**: architectural editorial design using warm drawing-paper surfaces, technical grids, structural ink, steel blue, timber tan, and safety orange. This is intentionally distinct from the generic dark-template positioning common among local competitors, while retaining expected project, service, FAQ, careers, and quote content. [One Call Drywall](https://www.onecalldrywall.ca/careers/) and [Righton Construction](https://rightonconstruction.ca/) validate those local information needs.

## Public Experience and Design System

### Public routes

- `/` — Home
- `/services` — Capabilities overview
- `/services/$slug` — Five service-specific pages
- `/projects` — Filterable showcase
- `/projects/$slug` — Detailed project case study
- `/about` — Company, process, markets, team, and verified credentials
- `/service-areas` — Surrey and verified Lower Mainland coverage
- `/faq` — Searchable, categorized questions
- `/careers` — Culture and active openings
- `/careers/$slug` — Job details and application form
- `/contact` — Enquiry/quote form
- `/privacy` and `/accessibility`
- `/admin/*` — Protected CMS and inbox

No blog or thin city-by-city SEO pages in v1. They should only be added when there is genuine project-specific content.

### Homepage composition

- Translucent, compact navigation with persistent “Request a Quote” action.
- Hero positioning around precision from structure to finish, using a real project image or optimized static scene poster as the initial visual.
- Verified trust strip: Surrey/Lower Mainland coverage, project markets, insurance or WorkSafeBC only when confirmed.
- Interactive **Capability Lab** using the five existing scenes:
  - Steel stud framing
  - Drywall taping and mudding
  - Insulation
  - Painting
  - Concrete
- Residential and commercial entry paths.
- Featured project case studies.
- “Blueprint to Finish” construction sequence.
- Verified testimonials.
- Contextual FAQs.
- Careers teaser and final enquiry CTA.

### Showcase

- Filter projects by service, residential/commercial, and city.
- Case-study fields: overview, location at city level, project type, scope, services, challenge, execution, result, completion date, and related projects.
- Ordered Cloudinary gallery with captions, required alt text, focal points, and optional before/after image pairs.
- Admin-selectable cover image, featured status, and homepage ordering.
- Shareable Open Graph image and project-specific metadata.

### Visual language

- Palette:
  - Blueprint ivory `#F0EBE0`
  - Structural ink `#151A24`
  - Safety/finish orange `#C65327`
  - Steel blue `#7893A8`
  - Timber tan `#B58B55`
  - Laser blue `#2A55CC`
  - Warm white `#FBF9F4`
- Typography: self-hosted Archivo Variable for display/body and IBM Plex Mono for drawings, labels, specifications, and metadata.
- Icons: one Tabler outline family via its maintained React package; no emojis or mixed icon styles.
- Mobile-first layouts, fluid type/spacing, container queries, and 44px minimum touch targets.

### Motion and interactivity

- One shared React Three Fiber canvas for the service scenes; never five simultaneous canvases.
- Static Cloudinary poster displayed first; WebGL loads only when the section nears the viewport or the user interacts.
- CSS/WAAPI for predictable reveals, press feedback, nav materialization, and clip-path image entrances.
- Motion springs only for interruptible service switching, drawers, and direct-manipulation interactions.
- Native View Transitions API for supported route transitions.
- Embla for accessible galleries and before/after comparison controls.
- No GSAP, Lenis, custom cursor, excessive parallax, or perpetual decorative movement.
- `prefers-reduced-motion`, reduced-transparency, keyboard, touch, low-power, and WebGL-failure fallbacks are first-class acceptance requirements.

## Technical Architecture and Interfaces

### Foundation

- Scaffold through `npx @tanstack/cli@latest create`, select Vite, Tailwind, ESLint, and React Query, then pin the verified dependency set and commit the lockfile. TanStack Start is currently an RC with a feature-complete, stable API, and provides SSR, server routes, server functions, and typed routing. [TanStack setup](https://tanstack.com/start/latest/docs/framework/react/getting-started), [framework status](https://tanstack.com/start/latest/docs/framework/react/overview).
- Initialize shadcn/ui through its CLI and customize tokens/components to the blueprint identity.
- Use:
  - TanStack Start/Router for SSR and routing
  - TanStack Query for admin CRUD, caching, and mutation invalidation
  - TanStack Table for inbox/content tables
  - TanStack Form with Zod schemas for both public and admin forms
  - Tailwind CSS and shadcn/ui
  - Three.js, React Three Fiber, and Drei
  - Motion, Embla, dnd-kit, Sonner, and Tiptap StarterKit
  - Official MongoDB Node driver
  - Better Auth with MongoDB adapter, Admin, and Two-Factor plugins
  - Cloudinary Node and URL-generation SDKs
  - Sentry with PII scrubbing
- Zustand is intentionally omitted: Router, Query, Form, URL state, and local component state cover v1 without another global store.

### Hosting

- Deploy through TanStack Start’s Vercel/Nitro adapter on Vercel Pro.
- Connect MongoDB Atlas through the Vercel integration and use proper serverless connection-pool handling.
- Use the official MongoDB driver rather than Atlas Data API, which reached end-of-life in September 2025. [MongoDB driver guidance](https://www.mongodb.com/docs/drivers/node/current/connect/), [Data API EOL](https://www.mongodb.com/docs/atlas/app-services/data-api/generated-endpoints/).
- Store all credentials in Vercel environment variables; separate preview and production Atlas databases and Cloudinary folders.
- Public content is SSR-rendered and CDN-cached with short stale-while-revalidate windows. Admin publication purges affected public cache keys.
- Server functions handle internal typed mutations; server routes handle Better Auth, Cloudinary signing, WhatsApp webhooks, Turnstile verification, and other external calls.

### Core MongoDB collections

| Collection | Primary data and workflow |
|---|---|
| `services` | Slug, content, icon/scene key, SEO, order, draft/published/archived |
| `projects` | Case-study content, service references, project type, city, gallery references, featured/order, publication state |
| `mediaAssets` | Cloudinary asset/public IDs, access type, MIME, dimensions, bytes, alt text, focal point, owner reference |
| `testimonials` | Quote, attribution, project reference, consent verification, publication state |
| `faqs` | Question, answer, contexts, order, publication state |
| `jobOpenings` | Role, location, type, summary, responsibilities, requirements, status and publish dates |
| `inquiries` | Contact/project details, attachments, consent, attribution, status, notes, WhatsApp delivery state |
| `careerApplications` | Job reference, contact/experience fields, private attachments, consent, hiring status and notes |
| `siteSettings` | Business identity, phone/email, service areas, hours, social links, defaults and SEO |
| `auditEvents` | Actor, action, entity, changed fields, timestamp and request metadata |
| Better Auth collections | Users, accounts, sessions and verification records |

Unique indexes cover slugs and auth emails. Status/date indexes support admin queues and public publication queries. Public content uses soft deletion with a 30-day trash window.

### Admin CMS

- Dashboard:
  - New enquiries and applications
  - Leads by pipeline status
  - Published/draft project counts
  - Failed WhatsApp deliveries
  - Recent editor activity
- Content:
  - Projects and galleries
  - Services
  - Testimonials
  - FAQs
  - Job openings
  - Homepage/site settings
  - Managed media library
- Inbox:
  - Enquiries: `new → contacted → quoting → won/lost/spam`
  - Applications: `new → reviewing → interview → offer → hired/rejected`
  - Internal notes, assignment, filters, search, attachment access, and CSV export
- Publishing:
  - Editors create and update drafts and previews.
  - Admins approve, publish, archive, restore, or permanently purge.
  - Layouts and design tokens remain code-controlled; this is a structured CMS, not a fragile page builder.
- Roles:
  - `admin`: users, settings, publication, permanent deletion, exports, all content/inboxes
  - `editor`: draft content, media, lead/application workflow and notes; no user management, publishing, global settings, or permanent deletion

### Authentication and media security

- Invite-only Better Auth email/password accounts; public registration is disabled.
- Mandatory TOTP two-factor authentication, recovery codes, secure HTTP-only cookies, CSRF/origin checks, rate limits, and short admin sessions.
- Password reset and invitations use Resend after the company domain is configured.
- Showcase media uses public Cloudinary delivery with automatic format/quality and responsive transformations.
- Resumes, certifications, project plans, and enquiry attachments use authenticated Cloudinary assets. Admin access generates short-lived signed URLs, matching Cloudinary’s private-media model. [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media).
- Uploads go directly to Cloudinary using short-lived server-generated signatures; API secrets never reach the browser. [Cloudinary signed uploads](https://cloudinary.com/documentation/upload_images).
- Deleted CMS records enter trash first; Cloudinary assets are only destroyed during verified permanent purge.

## Forms, WhatsApp, SEO, and Privacy

### Enquiry form

Fields:

- Name, company optional, phone, email, preferred contact
- Residential/commercial and project stage
- Requested services
- Project city/postal code
- Desired timeline and optional budget range
- Project description
- Up to five private JPG/PNG/WebP/PDF attachments, 10MB each
- Privacy and WhatsApp-processing notice
- Hidden UTM/referrer fields

Flow:

1. Validate client and server-side with the same Zod schema.
2. Verify Cloudflare Turnstile and rate limits.
3. Complete signed private uploads.
4. Save enquiry and attachment metadata to MongoDB.
5. Create a WhatsApp notification outbox record.
6. Attempt Meta Cloud API delivery.
7. Return success with a reference ID even if WhatsApp fails.
8. Offer an optional “Continue on WhatsApp” link to `+1 672-377-1944` with the reference ID.
9. Retry failed notifications through Vercel Cron; expose terminal failures in admin.

Meta setup includes Business verification, a separate Cloud API sender identity, the internal recipient number, approved utility template, long-lived system-user token, webhook verification, and delivery-status updates. Only a concise lead summary and admin deep link go to WhatsApp—never attachments or sensitive applicant data. Meta’s Cloud API uses the phone-number `/messages` endpoint and exposes delivery state through webhooks. [Meta’s official Postman collection](https://www.postman.com/meta/whatsapp-business-platform/folder/13382743-ba8d099d-007e-4b52-b9f2-3cf3c60e4fbc).

### Career form

- Opening, name, phone, email, city
- Trade experience, relevant services, years of experience
- Work authorization confirmation, availability, driving/transport information
- Resume: one PDF/DOC/DOCX
- Up to three optional PDF/JPG/PNG certification or portfolio files
- Privacy notice and explicit application-data consent
- No questions about protected personal characteristics

Career submissions save to MongoDB and appear in admin; they do not trigger visitor-facing WhatsApp messages.

### Privacy and retention

- Publish a BC PIPA-aligned privacy policy identifying collection purpose, contact point, processors, security, access/correction process, and retention.
- Applications are retained for at least one year after a hiring decision, then deleted unless hired or separately opted into a talent pool.
- Closed enquiries default to 24-month retention.
- Analytics never receives names, email addresses, phone numbers, attachment names, or free-text content.
- BC PIPA requires appropriate purpose, consent/notice, public privacy responsibility, reasonable security, and decision-related retention. [BC Personal Information Protection Act](https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/00_03063_01).

### SEO and analytics

- Unique titles, descriptions, canonicals, Open Graph/Twitter assets, sitemap and robots rules.
- `LocalBusiness`/`Organization`, `BreadcrumbList`, service, project, FAQ, and active `JobPosting` structured data where eligible.
- Connect Google Business Profile, Search Console, and GA4.
- Consent-gated GA4 events:
  - `cta_clicked`
  - `service_viewed`
  - `project_viewed`
  - `form_started`
  - `inquiry_submitted`
  - `career_application_submitted`
  - `whatsapp_continued`
  - `phone_clicked`
  - `email_clicked`
- No fabricated aggregate rating markup or unverified business claims.
- Performance targets: LCP under 2.5s, INP under 200ms, CLS under 0.1, matching Google’s current guidance. [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).
- The initial public route excludes the 3D engine and admin libraries; those ship as lazy route/interaction chunks.

## Test and Launch Plan

### Automated coverage

- Unit tests:
  - Zod schemas, permissions, publication rules, slug generation, Cloudinary policy, notification mapper
- Integration tests:
  - Enquiry/application persistence
  - Auth, 2FA, admin/editor authorization
  - Draft-preview-publish workflow
  - Signed upload authorization
  - WhatsApp webhook verification, retries, and status updates
  - Cloudinary cleanup and soft-delete restoration
- Playwright E2E:
  - All public navigation and filters
  - Successful and failed form submissions
  - Project CMS creation, image ordering, preview and publication
  - Lead/application status workflows
  - Mobile navigation, keyboard flows, focus restoration
- Security tests:
  - Unauthorized admin/API access
  - CSRF/origin rejection
  - XSS sanitization in Tiptap content
  - MIME/size spoofing, rate limiting and bot protection
  - Private attachment URLs expiring correctly
- Visual/accessibility:
  - Representative 360px, 768px, 1440px and ultrawide layouts
  - WCAG 2.2 AA checks
  - Reduced-motion and no-WebGL paths
  - Lighthouse targets of 90+ performance and 95+ accessibility, best practices, and SEO on key public routes

### Launch sequence

1. Finalize domain, DNS, logo, branded email, verified business facts, service-area list, policies, project assets, testimonials and credentials.
2. Configure Vercel, Atlas, Cloudinary, Better Auth/Resend, Meta Business, Turnstile, Sentry, GA4 and Search Console.
3. Seed services, settings, FAQs and initial admins; import the best real projects as drafts.
4. Run staging content review, privacy review, mobile testing, Meta template approval and end-to-end form drills.
5. Publish only after database backup, recovery, notification-failure, attachment-privacy and rollback checks pass.
6. Monitor errors, form conversions, WhatsApp delivery failures and Core Web Vitals after launch.

## Assumptions

- The website targets residential and commercial clients equally.
- English is the only launch language.
- The public number is `+1 672-377-1944`; Meta Cloud API requires a separately configured sender identity and internal recipient arrangement.
- The company will supply or approve all factual claims, images, testimonials, certifications, service areas and legal text.
- “Everything controlled in admin” means structured content and workflows; layout composition and brand-system code remain developer-controlled.
- Vercel Pro, MongoDB Atlas, Cloudinary, Meta messaging, Resend, domain and monitoring costs are separate operational services.
- TanStack Start RC versions will be pinned and upgraded only after passing the full regression suite.
