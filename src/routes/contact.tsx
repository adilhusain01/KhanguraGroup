import { createFileRoute } from '@tanstack/react-router'
import { EnquiryForm } from '../components/forms'
import { PageHero, SiteLayout } from '../components/site-shell'

export const Route = createFileRoute('/contact')({ component: Contact })

function Contact() {
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={
            <>
              Let’s make the next step <em>clear.</em>
            </>
          }
          description="Share the essentials and the team can review the site, timing, and services together."
        />
        <section className="kg-content-section kg-form-section">
          <div className="kg-wrap">
            <EnquiryForm />
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
