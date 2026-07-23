import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowUpRight, IconRulerMeasure } from '@tabler/icons-react'
import { FinalCta, PageHero, SiteLayout } from '../../components/site-shell'
import { services as fallbackServices } from '../../lib/content'

export const Route = createFileRoute('/services/')({ component: Services })

type PublishedService = { slug: string; title: string; summary?: string }

function Services() {
  const { data } = useQuery({
    queryKey: ['published-services'],
    queryFn: async () => {
      const response = await fetch('/api/content/services')
      if (!response.ok) throw new Error()
      return response.json() as Promise<PublishedService[]>
    },
    enabled: typeof window !== 'undefined',
  })

  const services: PublishedService[] = data?.length
    ? data
    : fallbackServices.map((service) => ({
        slug: service.key,
        title: service.name,
        summary: service.description,
      }))

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={<>Five trades. One connected scope.</>}
          description="Explore Khangura Group’s construction and finishing services. Exact scope, materials, availability, and project requirements are confirmed during project review."
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-card-grid kg-service-cards">
            {services.map((service, index) => {
              const Icon =
                fallbackServices.find((item) => item.key === service.slug)
                  ?.icon ?? IconRulerMeasure
              return (
                <Link
                  className="kg-info-card"
                  to="/services/$slug"
                  params={{ slug: service.slug }}
                  key={service.slug}
                >
                  <div className="kg-card-topline">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <Icon size={29} stroke={1.5} />
                  </div>
                  <div>
                    <h2>{service.title}</h2>
                    <p>{service.summary}</p>
                  </div>
                  <b>
                    View capability <IconArrowUpRight size={17} />
                  </b>
                </Link>
              )
            })}
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
