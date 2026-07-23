import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  IconArrowUpRight,
  IconBriefcase2,
  IconBuilding,
  IconCamera,
  IconCheck,
  IconCube,
  IconHome,
  IconMapPin,
  IconPhone,
} from '@tabler/icons-react'
import { lazy, Suspense, useState } from 'react'
import HeroBuildScene from '../components/effects/HeroBuildScene.jsx'
import { faqs } from '../lib/content'
import { SiteLayout } from '../components/site-shell'

const CapabilityLab = lazy(() =>
  import('../components/capability-lab').then((module) => ({
    default: module.CapabilityLab,
  })),
)

export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [
      {
        title: 'Khangura Group | Construction & Finishing in Surrey, BC',
      },
      {
        name: 'description',
        content:
          'Drywall finishing, steel stud framing, insulation, painting, and concrete services for residential and commercial projects across Surrey and the Lower Mainland.',
      },
    ],
  }),
})

const serviceNames = [
  'Steel stud framing',
  'Drywall taping & mudding',
  'Insulation',
  'Painting',
  'Concrete services',
]

const process = [
  {
    number: '01',
    title: 'Share the site',
    copy: 'Tell us the location, project stage, services, access, and timing. Photos or drawings help make the first conversation useful.',
  },
  {
    number: '02',
    title: 'Shape the scope',
    copy: 'The work is reviewed as a sequence—not a pile of disconnected line items—so the right questions surface before site work begins.',
  },
  {
    number: '03',
    title: 'Coordinate the work',
    copy: 'Service handoffs, preparation, and finish expectations are made clear for the project and the people involved.',
  },
]

function HeroGraphic() {
  const [view, setView] = useState<'photo' | 'build'>('photo')

  return (
    <div className="kg-hero-graphic">
      {view === 'photo' ? (
        <img
          className="kg-hero-photo"
          src="/hero/structure-surface-finish.png"
          alt="Illustrative construction interior showing framing and drywall progress."
        />
      ) : (
        <HeroBuildScene />
      )}
      <div className="kg-hero-view-switch" role="group" aria-label="Hero view">
        <button
          type="button"
          aria-pressed={view === 'photo'}
          onClick={() => setView('photo')}
        >
          <IconCamera size={16} stroke={1.8} />
          Site view
        </button>
        <button
          type="button"
          aria-pressed={view === 'build'}
          onClick={() => setView('build')}
        >
          <IconCube size={16} stroke={1.8} />
          Build view
        </button>
      </div>
    </div>
  )
}

function Home() {
  const { data: liveFaqs } = useQuery({
    queryKey: ['home-faqs'],
    queryFn: async () => {
      const response = await fetch('/api/content/faqs')
      if (!response.ok) throw new Error()
      return response.json() as Promise<
        Array<{ question: string; answer: string }>
      >
    },
    enabled: typeof window !== 'undefined',
  })

  const homeFaqs: Array<[string, string]> = liveFaqs?.length
    ? liveFaqs.map((item) => [item.question, item.answer])
    : (faqs as Array<[string, string]>)

  return (
    <SiteLayout>
      <main id="main-content">
        <section className="kg-hero">
          <div className="kg-wrap kg-hero-grid">
            <div className="kg-hero-copy">
              <h1>
                Structure.
                <br />
                Surface.
                <br />
                <span>Finish.</span>
              </h1>
              <div className="kg-hero-bottom">
                <p>
                  Five construction and finishing services. One clearer way to
                  move the work forward.
                </p>
                <div className="kg-hero-actions">
                  <Link className="kg-button kg-button-signal" to="/contact">
                    Contact us
                    <IconArrowUpRight size={18} />
                  </Link>
                  <a className="kg-text-link" href="tel:+16723771944">
                    <IconPhone size={17} />
                    672-377-1944
                  </a>
                </div>
              </div>
            </div>

            <HeroGraphic />
          </div>
        </section>

        <section className="kg-service-rail" id="services">
          <div className="kg-service-track">
            {[...serviceNames, ...serviceNames].map((service, index) => (
              <span key={`${service}-${index}`}>
                {service}
                <i aria-hidden="true" />
              </span>
            ))}
          </div>
        </section>

        <section className="kg-capabilities">
          <div className="kg-wrap kg-capabilities-heading">
            <h2>Five trades. One connected view of the work.</h2>
            <p>
              Move through the services to see how structure, preparation, and
              finish fit together.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="kg-wrap kg-lab-loading">
                <span />
                Preparing the workbench
              </div>
            }
          >
            <CapabilityLab />
          </Suspense>
        </section>

        <section className="kg-manifesto">
          <div className="kg-wrap kg-manifesto-grid">
            <div>
              <h2>
                Good finishes start
                <br />
                <span>before the finish.</span>
              </h2>
              <p className="kg-manifesto-lead">
                Framing affects board. Board affects mud. Preparation affects
                paint. Khangura Group brings the connected parts of the work
                into the same conversation.
              </p>
            </div>
          </div>

          <div className="kg-wrap kg-value-grid">
            <article>
              <span>01</span>
              <div className="kg-value-icon">
                <IconCheck size={23} stroke={1.7} />
              </div>
              <h3>One point of contact</h3>
              <p>
                Start with the complete scope, even when the project needs more
                than one service.
              </p>
            </article>
            <article>
              <span>02</span>
              <div className="kg-value-icon">
                <IconCheck size={23} stroke={1.7} />
              </div>
              <h3>Handoffs made visible</h3>
              <p>
                See how preparation and sequence connect instead of treating
                each trade as an isolated step.
              </p>
            </article>
            <article>
              <span>03</span>
              <div className="kg-value-icon">
                <IconCheck size={23} stroke={1.7} />
              </div>
              <h3>A useful first enquiry</h3>
              <p>
                Project type, site, timing, requested services, and attachments
                arrive in one structured brief.
              </p>
            </article>
          </div>
        </section>

        <section className="kg-process-section">
          <div className="kg-wrap">
            <div className="kg-section-heading">
              <h2>From first detail to final pass.</h2>
            </div>

            <div className="kg-process-grid">
              <div className="kg-process-list">
                {process.map((item) => (
                  <article key={item.number}>
                    <span>{item.number}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.copy}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="kg-project-types">
          <div className="kg-wrap">
            <div className="kg-section-heading kg-section-heading-light">
              <h2>Different sites. Same attention to the handoff.</h2>
            </div>
            <div className="kg-path-grid">
              <Link className="kg-path-card" to="/contact">
                <div className="kg-path-icon">
                  <IconHome size={31} stroke={1.5} />
                </div>
                <span>Residential</span>
                <h3>Homes, additions, renovations, and interior work.</h3>
                <p>
                  Share the address or city, current project stage, services,
                  and the timing you are working toward.
                </p>
                <b>
                  Discuss residential work
                  <IconArrowUpRight size={19} />
                </b>
              </Link>
              <Link className="kg-path-card kg-path-card-orange" to="/contact">
                <div className="kg-path-icon">
                  <IconBuilding size={31} stroke={1.5} />
                </div>
                <span>Commercial</span>
                <h3>Buildouts, multi-unit work, and commercial interiors.</h3>
                <p>
                  Bring the drawings, location, site constraints, requested
                  services, and schedule into the first review.
                </p>
                <b>
                  Discuss commercial work
                  <IconArrowUpRight size={19} />
                </b>
              </Link>
            </div>
          </div>
        </section>

        <section className="kg-faq-section">
          <div className="kg-wrap kg-faq-grid">
            <div className="kg-faq-intro">
              <h2>Straight answers help good projects start.</h2>
              <p>
                The basics, before the first call. Project-specific details are
                confirmed during enquiry review.
              </p>
              <Link className="kg-text-link" to="/faq">
                Read every question
                <IconArrowUpRight size={18} />
              </Link>
            </div>
            <div className="kg-faq-list">
              {homeFaqs.slice(0, 4).map(([question, answer], index) => (
                <details key={question}>
                  <summary>
                    <span>0{index + 1}</span>
                    {question}
                    <i aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="kg-careers">
          <div className="kg-wrap kg-careers-grid">
            <div className="kg-careers-icon">
              <IconBriefcase2 size={34} stroke={1.5} />
            </div>
            <h2>Know the trade? Build the next project with us.</h2>
            <p>
              Explore current opportunities across Surrey and the Lower
              Mainland, then send a structured application online.
            </p>
            <Link className="kg-button kg-button-dark" to="/careers">
              View careers
              <IconArrowUpRight size={18} />
            </Link>
          </div>
        </section>

        <section className="kg-final-cta">
          <div className="kg-wrap">
            <div className="kg-final-copy">
              <p>Have a site, a scope, or just the first set of questions?</p>
              <h2>Let’s get the work moving.</h2>
            </div>
            <div className="kg-final-actions">
              <Link className="kg-button kg-button-signal" to="/contact">
                Contact us
                <IconArrowUpRight size={19} />
              </Link>
              <a href="tel:+16723771944">
                <IconPhone size={18} />
                672-377-1944
              </a>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
