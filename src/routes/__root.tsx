import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'
import { AppProviders } from '../components/app-providers'
import { AnalyticsConsent } from '../components/analytics-consent'
import '../lib/monitoring'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Khangura Group | Construction & Finishing Solutions',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: RootNotFound,
})

function RootNotFound() {
  return (
    <main className="kg-not-found">
      <h1>That page is not here.</h1>
      <a href="/">Return home</a>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Khangura Group of Companies Inc.',
    description:
      'Professional construction and finishing solutions serving Surrey and the Lower Mainland.',
    telephone: '+1-672-377-1944',
    email: 'khangura.group.of.companies.inc@gmail.com',
    areaServed: ['Surrey, BC', 'Lower Mainland, BC'],
    url: process.env.VITE_SITE_URL ?? 'http://localhost:3000',
  })
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
        <AnalyticsConsent />
        <Scripts />
      </body>
    </html>
  )
}
