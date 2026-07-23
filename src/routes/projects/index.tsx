import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { IconArrowUpRight } from '@tabler/icons-react'
import { useState } from 'react'
import { PageHero, SiteLayout } from '../../components/site-shell'
import { projects as fallbackProjects } from '../../lib/content'

export const Route = createFileRoute('/projects/')({ component: Projects })

type Project = {
  id?: string
  slug: string
  title: string
  city: string
  projectType?: string
  type?: string
  services?: string[]
  summary?: string
  overview?: string
}

function Projects() {
  const [filter, setFilter] = useState('All')
  const { data } = useQuery({
    queryKey: ['published-projects'],
    queryFn: async () => {
      const response = await fetch('/api/content/projects')
      if (!response.ok) throw new Error()
      return response.json() as Promise<Project[]>
    },
    enabled: typeof window !== 'undefined',
  })

  const projects: Project[] = data?.length ? data : fallbackProjects
  const shown =
    filter === 'All'
      ? projects
      : projects.filter(
          (project) =>
            (project.projectType ?? project.type) === filter ||
            project.city === filter,
        )

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={<>The work, documented properly.</>}
          description="Browse approved case studies by project type and location. New work appears only after its details and media have been reviewed."
        />
        <section className="kg-content-section">
          <div className="kg-wrap">
            <div className="kg-filter-bar" aria-label="Filter projects">
              {[
                'All',
                'Residential',
                'Commercial',
                'Surrey',
                'Lower Mainland',
              ].map((item) => (
                <button
                  type="button"
                  key={item}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="kg-project-grid">
              {shown.map((project, index) => (
                <Link
                  className="kg-project-card"
                  to="/projects/$slug"
                  params={{ slug: project.slug }}
                  key={project.slug}
                >
                  <div className="kg-project-visual" data-tone={index % 3}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <i aria-hidden="true" />
                  </div>
                  <div className="kg-project-copy">
                    <span>
                      {project.projectType ?? project.type} / {project.city}
                    </span>
                    <h2>{project.title}</h2>
                    <p>{project.summary ?? project.overview}</p>
                    <b>
                      Open case study <IconArrowUpRight size={17} />
                    </b>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
