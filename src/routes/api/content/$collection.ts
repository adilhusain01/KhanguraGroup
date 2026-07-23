import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import {
  getPublishedContent,
  isPublicCollection,
} from '../../../server/public-content'

export const Route = createFileRoute('/api/content/$collection')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        if (!isPublicCollection(params.collection))
          return json({ error: 'Unknown collection.' }, { status: 404 })
        const slug = new URL(request.url).searchParams.get('slug') ?? undefined
        try {
          return json(await getPublishedContent(params.collection, slug), {
            headers: {
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
          })
        } catch {
          return json(
            { error: 'Content is temporarily unavailable.' },
            { status: 503 },
          )
        }
      },
    },
  },
})
