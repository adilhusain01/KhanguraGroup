import { createFileRoute } from '@tanstack/react-router'
import { PageHero, SiteLayout } from '../components/site-shell'

export const Route = createFileRoute('/privacy')({ component: Privacy })

function Privacy() {
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={
            <>
              Your information, handled with <em>purpose.</em>
            </>
          }
          description="How project enquiries and job applications are collected, used, and protected."
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-legal-copy">
            <article>
              <h2>What we collect and why</h2>
              <p>
                We collect contact and project information needed to respond to
                an enquiry, and applicant information needed to evaluate an
                application. Attachments are stored as private files and are not
                included in WhatsApp notifications.
              </p>
            </article>
            <article>
              <h2>Retention and access</h2>
              <p>
                Closed enquiries are configured for a 24-month retention period.
                Applications are retained for at least one year after a hiring
                decision unless a longer relationship or a separate consent
                applies. Contact the company to request access or correction.
              </p>
            </article>
            <article>
              <h2>Processors and safeguards</h2>
              <p>
                The planned service providers are MongoDB Atlas, Cloudinary,
                Vercel, Meta WhatsApp, Resend, and Cloudflare Turnstile. Final
                processor details, contact point, and policy text require legal
                and company approval.
              </p>
            </article>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
