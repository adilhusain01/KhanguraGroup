import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${process.env.VITE_SITE_URL ?? 'http://localhost:3000'}/sitemap.xml\n`,
          { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
        ),
    },
  },
})
