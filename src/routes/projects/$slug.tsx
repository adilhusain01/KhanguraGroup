import useEmblaCarousel from 'embla-carousel-react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { FinalCta, PageHero, SiteLayout } from '../../components/site-shell'
import { projects as fallbackProjects } from '../../lib/content'

export const Route = createFileRoute('/projects/$slug')({
  component: ProjectDetail,
})
type GalleryAsset = {
  publicId: string
  secureUrl: string
  alt: string
  caption?: string
}
type Project = {
  slug: string
  title: string
  city: string
  projectType?: string
  type?: string
  summary?: string
  overview?: string
  scope?: string
  challenge?: string
  execution?: string
  result?: string
  services?: string[]
  gallery?: GalleryAsset[]
}
function Gallery({ assets }: { assets: GalleryAsset[] }) {
  const [ref, api] = useEmblaCarousel({ loop: false, align: 'start' })
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!api) return
    const select = () => setSelected(api.selectedScrollSnap())
    select()
    api.on('select', select)
    return () => {
      api.off('select', select)
    }
  }, [api])
  return (
    <section className="kg-gallery">
      <div className="kg-gallery-viewport" ref={ref}>
        <div className="kg-gallery-track">
          {assets.map((asset, index) => (
            <figure className="kg-gallery-slide" key={asset.publicId}>
              <img
                src={asset.secureUrl}
                alt={asset.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              <figcaption>{asset.caption || asset.alt}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="kg-gallery-controls">
        <button
          className="kg-icon-button"
          aria-label="Previous image"
          onClick={() => api?.scrollPrev()}
        >
          <IconChevronLeft size={18} />
        </button>
        <span>
          {selected + 1} / {assets.length}
        </span>
        <button
          className="kg-icon-button"
          aria-label="Next image"
          onClick={() => api?.scrollNext()}
        >
          <IconChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
function ProjectDetail() {
  const { slug } = Route.useParams()
  const fallback: Project | undefined = fallbackProjects.find(
    (entry) => entry.slug === slug,
  )
  const { data, isPending } = useQuery({
    queryKey: ['published-project', slug],
    queryFn: async () => {
      const response = await fetch(
        `/api/content/projects?slug=${encodeURIComponent(slug)}`,
      )
      if (!response.ok) throw new Error()
      return response.json() as Promise<Project[]>
    },
    enabled: typeof window !== 'undefined',
  })
  const project = data?.[0] ?? fallback
  if (!project && !isPending) throw notFound()
  if (!project)
    return (
      <SiteLayout>
        <main id="main-content" className="kg-loading-page">
          <div className="kg-wrap">Loading project…</div>
        </main>
      </SiteLayout>
    )
  const type = project.projectType ?? project.type ?? 'Project'
  const description = project.summary ?? project.overview ?? ''
  const cards = [
    ['Scope', project.scope],
    ['Challenge', project.challenge],
    ['Execution', project.execution],
    ['Result', project.result],
  ].filter(([, value]) => Boolean(value))
  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero title={project.title} description={description} />
        {project.gallery?.length ? (
          <section className="kg-content-section">
            <div className="kg-wrap">
              <Gallery assets={project.gallery} />
            </div>
          </section>
        ) : null}
        <section className="kg-content-section">
          <div className="kg-wrap">
            <div className="kg-case-grid">
              {cards.length ? (
                cards.map(([label, value]) => (
                  <article className="kg-case-card" key={label}>
                    <span>{label}</span>
                    <p>{value}</p>
                  </article>
                ))
              ) : (
                <article className="kg-case-card">
                  <span>Scope</span>
                  <p>
                    Approved project details will be added as the case study is
                    completed.
                  </p>
                </article>
              )}
              {project.services?.length ? (
                <article className="kg-case-card kg-case-services">
                  <span>Services</span>
                  <h2>{project.services.join(' · ')}</h2>
                </article>
              ) : null}
            </div>
          </div>
        </section>
        <FinalCta />
      </main>
    </SiteLayout>
  )
}
