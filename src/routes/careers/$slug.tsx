import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { CareerForm } from '../../components/forms'
import { PageHero, SiteLayout } from '../../components/site-shell'
import { jobs as fallbackJobs } from '../../lib/content'

export const Route = createFileRoute('/careers/$slug')({
  component: CareerDetail,
})

type Job = {
  slug: string
  title: string
  type?: string
  location: string
  summary: string
  responsibilities?: string
  requirements?: string
}

function CareerDetail() {
  const { slug } = Route.useParams()
  const fallback: Job | undefined = fallbackJobs.find(
    (entry) => entry.slug === slug,
  )
  const { data, isPending } = useQuery({
    queryKey: ['published-job', slug],
    queryFn: async () => {
      const response = await fetch(
        `/api/content/jobOpenings?slug=${encodeURIComponent(slug)}`,
      )
      if (!response.ok) throw new Error()
      return response.json() as Promise<Job[]>
    },
    enabled: typeof window !== 'undefined',
  })
  const job = data?.[0] ?? fallback
  if (!job && !isPending) throw notFound()
  if (!job) return null

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero title={job.title} description={job.summary} />
        <section className="kg-content-section">
          <div className="kg-wrap">
            <div className="kg-job-detail">
              <div className="kg-job-facts">
                <p>{job.type ?? 'Current opening'}</p>
                <strong>{job.location}</strong>
              </div>
              <div className="kg-job-panels">
                {job.responsibilities && (
                  <article>
                    <h2>Responsibilities</h2>
                    <p>{job.responsibilities}</p>
                  </article>
                )}
                {job.requirements && (
                  <article>
                    <h2>Requirements</h2>
                    <p>{job.requirements}</p>
                  </article>
                )}
              </div>
            </div>
            <CareerForm opening={job.title} />
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
