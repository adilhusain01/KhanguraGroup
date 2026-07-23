import { createFileRoute } from '@tanstack/react-router'
import { PageHero, SiteLayout } from '../components/site-shell'

export const Route = createFileRoute('/accessibility')({
  component: Accessibility,
})

function Accessibility() {
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={
            <>
              Designed for a <em>clearer</em> experience.
            </>
          }
          description="Khangura Group aims to provide a usable website across devices, input methods, and accessibility preferences."
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-legal-copy">
            <article>
              <h2>Accessibility approach</h2>
              <p>
                The site is designed with semantic content, keyboard paths,
                visible focus states, minimum touch targets, responsive layouts,
                and reduced-motion / reduced-transparency alternatives. The
                interactive capability model is optional and has a static
                fallback.
              </p>
            </article>
            <article>
              <h2>Need help?</h2>
              <p>
                If a part of the website is difficult to use, contact the
                company at 672-377-1944 or
                khangura.group.of.companies.inc@gmail.com. Provide the page and
                a brief description of the issue so it can be reviewed.
              </p>
            </article>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
