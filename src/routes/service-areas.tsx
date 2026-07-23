import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowUpRight, IconMapPin } from '@tabler/icons-react'
import { FinalCta, PageHero, SiteLayout } from '../components/site-shell'

export const Route = createFileRoute('/service-areas')({
  component: ServiceAreas,
})

function ServiceAreas() {
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={<>Surrey and the Lower Mainland.</>}
          description="Location coverage is confirmed during project review so site access, travel, scope, and availability can be considered together."
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-area-grid">
            <div className="kg-area-map">
              <div className="kg-map-pin">
                <IconMapPin size={34} stroke={1.6} />
              </div>
              <span>Surrey, BC</span>
              <i aria-hidden="true" />
            </div>
            <article className="kg-area-copy">
              <h2>Tell us where the work is.</h2>
              <p>
                Add the city or postal code to your enquiry. The team will
                confirm whether the project location, timing, access, and scope
                fit the current service area.
              </p>
              <Link className="kg-button kg-button-signal" to="/contact">
                Check project fit <IconArrowUpRight size={18} />
              </Link>
            </article>
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
