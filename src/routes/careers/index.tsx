import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowUpRight } from '@tabler/icons-react'
import { FinalCta, PageHero, SiteLayout } from '../../components/site-shell'
import { jobs as fallbackJobs } from '../../lib/content'

export const Route = createFileRoute('/careers/')({ component: Careers })

type Job = {
  slug: string
  title: string
  type?: string
  location: string
  summary: string
}

function Careers() {
  const { data } = useQuery({
    queryKey: ['published-jobs'],
    queryFn: async () => {
      const response = await fetch('/api/content/jobOpenings')
      if (!response.ok) throw new Error()
      return response.json() as Promise<Job[]>
    },
    enabled: typeof window !== 'undefined',
  })
  const jobs = data?.length ? data : fallbackJobs

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={
            <>
              Bring craft to the <em>crew.</em>
            </>
          }
          description="Current opportunities for construction and finishing professionals across Surrey and the Lower Mainland."
        />
        <section className="kg-content-section">
          <div className="kg-wrap">
            <div className="kg-jobs-grid">
              {jobs.map((job, index) => (
                <Link
                  className="kg-job-card"
                  to="/careers/$slug"
                  params={{ slug: job.slug }}
                  key={job.slug}
                >
                  <span>0{index + 1}</span>
                  <div>
                    <p>
                      {job.type} · {job.location}
                    </p>
                    <h2>{job.title}</h2>
                    <p>{job.summary}</p>
                  </div>
                  <IconArrowUpRight size={26} />
                </Link>
              ))}
            </div>
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
