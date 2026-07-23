import { createFileRoute } from '@tanstack/react-router'
import {
  IconArrowsShuffle,
  IconBuilding,
  IconHome,
  IconLayersLinked,
} from '@tabler/icons-react'
import { FinalCta, PageHero, SiteLayout } from '../components/site-shell'

export const Route = createFileRoute('/about')({ component: About })

const principles = [
  {
    icon: IconLayersLinked,
    title: 'Connected trades',
    copy: 'Framing, drywall finishing, insulation, painting, and concrete are presented as related parts of the work—not five disconnected sales pages.',
  },
  {
    icon: IconArrowsShuffle,
    title: 'Visible handoffs',
    copy: 'The first review focuses on project stage, access, sequence, requested services, and the finish the project is working toward.',
  },
]

function About() {
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={<>Built for the work between structure and finish.</>}
          description="Khangura Group of Companies Inc. provides professional construction and finishing solutions across Surrey and the Lower Mainland."
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-about-layout">
            <div className="kg-about-mark" aria-hidden="true">
              <img src="/brand/khangura-client-logo-v1.png" alt="" />
            </div>
            <div className="kg-about-copy">
              <h2>
                One construction conversation, from first scope to final pass.
              </h2>
              <p>
                The company serves residential and commercial clients through a
                practical range of construction and finishing services. The
                website is designed around useful project information instead of
                unsupported claims or generic contractor language.
              </p>
            </div>
          </div>
          <div className="kg-wrap kg-about-cards">
            <article>
              <IconHome size={30} stroke={1.5} />
              <h3>Residential</h3>
              <p>Homes, additions, renovations, and interior work.</p>
            </article>
            <article>
              <IconBuilding size={30} stroke={1.5} />
              <h3>Commercial</h3>
              <p>Buildouts, multi-unit work, and commercial interiors.</p>
            </article>
            {principles.map(({ icon: Icon, title, copy }) => (
              <article key={title}>
                <Icon size={30} stroke={1.5} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
