import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { PageHero, SiteLayout } from '../components/site-shell'
import { faqs as fallbackFaqs } from '../lib/content'

export const Route = createFileRoute('/faq')({ component: Faq })
type FaqItem = { question: string; answer: string }

function Faq() {
  const [query, setQuery] = useState('')
  const { data } = useQuery({
    queryKey: ['published-faqs'],
    queryFn: async () => {
      const response = await fetch('/api/content/faqs')
      if (!response.ok) throw new Error()
      return response.json() as Promise<FaqItem[]>
    },
    enabled: typeof window !== 'undefined',
  })
  const faqs = data?.length
    ? data.map((item) => [item.question, item.answer] as [string, string])
    : fallbackFaqs
  const found = useMemo(
    () =>
      faqs.filter(([question, answer]) =>
        `${question} ${answer}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [faqs, query],
  )

  return (
    <SiteLayout>
      <main id="main-content">
        <PageHero
          title={<>Straight answers. No runaround.</>}
          description="Search published answers about project fit, scope, service areas, attachments, and the enquiry process."
        />
        <section className="kg-content-section kg-faq-page">
          <div className="kg-wrap">
            <label className="kg-search-field" htmlFor="faq-search">
              <IconSearch size={22} stroke={1.6} />
              <input
                id="faq-search"
                placeholder="Search questions"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <span>{found.length} answers</span>
            </label>
            <div className="kg-faq-list">
              {found.map(([question, answer], index) => (
                <details key={question}>
                  <summary>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {question}
                    <i aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  )
}
