import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  IconChecklist,
  IconRulerMeasure,
  IconTimeline,
} from '@tabler/icons-react'
import { FinalCta, PageHero, SiteLayout } from '../../components/site-shell'
import { services as fallbackServices } from '../../lib/content'

export const Route = createFileRoute('/services/$slug')({
  component: ServiceDetail,
})

type Service = {
  slug: string
  title: string
  summary?: string
  description?: string
  short?: string
  number?: string
  process?: string
}

function ServiceDetail() {
  const { slug } = Route.useParams()
  const fallback = fallbackServices.find((entry) => entry.key === slug)
  const { data, isPending } = useQuery({
    queryKey: ['published-service', slug],
    queryFn: async () => {
      const response = await fetch(
        `/api/content/services?slug=${encodeURIComponent(slug)}`,
      )
      if (!response.ok) throw new Error()
      return response.json() as Promise<Service[]>
    },
    enabled: typeof window !== 'undefined',
  })

  const service =
    data?.[0] ??
    (fallback
      ? {
          slug: fallback.key,
          title: fallback.name,
          description: fallback.description,
          short: fallback.short,
          number: fallback.number,
        }
      : undefined)

  if (!service && !isPending) throw notFound()
  if (!service) return null

  const notes =
    service.process ??
    'The team confirms scope, access, sequence, materials, and finish expectations during project review.'

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={service.title}
          description={service.summary ?? service.description ?? ''}
        />
        <section className="kg-content-section">
          <div className="kg-wrap kg-detail-grid">
            <article className="kg-detail-feature">
              <IconTimeline size={32} stroke={1.4} />
              <span>How the scope starts</span>
              <h2>Plan the handoff before the work begins.</h2>
              <p>{notes}</p>
            </article>
            <div className="kg-detail-stack">
              <article>
                <IconRulerMeasure size={25} stroke={1.5} />
                <h3>Project-specific review</h3>
                <p>
                  Location, drawings, access, schedule, and finish requirements
                  shape the quote.
                </p>
              </article>
              <article>
                <IconChecklist size={25} stroke={1.5} />
                <h3>Clear next step</h3>
                <p>
                  Send the useful details once, then continue the conversation
                  with a saved enquiry reference.
                </p>
              </article>
            </div>
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
