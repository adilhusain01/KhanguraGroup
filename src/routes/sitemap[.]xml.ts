import { createFileRoute } from '@tanstack/react-router'
import { getPublishedContent } from '../server/public-content'

const fixed = [
  '/',
  '/services',
  '/projects',
  '/about',
  '/service-areas',
  '/faq',
  '/careers',
  '/contact',
  '/privacy',
  '/accessibility',
]
const escape = (value: string) =>
  value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character]!,
  )
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = (
          process.env.VITE_SITE_URL ?? 'http://localhost:3000'
        ).replace(/\/$/, '')
        const [projects, services, jobs] = await Promise.all([
          getPublishedContent('projects').catch(() => []),
          getPublishedContent('services').catch(() => []),
          getPublishedContent('jobOpenings').catch(() => []),
        ])
        const urls = [
          ...fixed,
          ...(services as Array<{ slug?: unknown }>).flatMap((item) =>
            item.slug ? [`/services/${String(item.slug)}`] : [],
          ),
          ...(projects as Array<{ slug?: unknown }>).flatMap((item) =>
            item.slug ? [`/projects/${String(item.slug)}`] : [],
          ),
          ...(jobs as Array<{ slug?: unknown }>).flatMap((item) =>
            item.slug ? [`/careers/${String(item.slug)}`] : [],
          ),
        ]
        const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${escape(`${base}${path}`)}</loc></url>`).join('')}</urlset>`
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
