import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  IconArrowUpRight,
  IconMail,
  IconMenu2,
  IconPhone,
  IconX,
} from '@tabler/icons-react'
import type { ReactNode } from 'react'

const navLinks = [
  { label: 'Services', to: '/services' as const },
  { label: 'Projects', to: '/projects' as const },
  { label: 'About', to: '/about' as const },
  { label: 'Careers', to: '/careers' as const },
]

type Settings = {
  title?: string
  phone?: string
  email?: string
  summary?: string
}

function Brand({
  company = 'Khangura',
  useMonogram = false,
}: {
  company?: string
  useMonogram?: boolean
}) {
  return (
    <>
      <span className="kg-brand-mark" aria-hidden="true">
        {useMonogram ? (
          <img src="/brand/khangura-monogram-v2.png" alt="" />
        ) : (
          <>
            <span>K</span>
            <span>G</span>
          </>
        )}
      </span>
      <span className="kg-brand-name">
        {company}
        <small>Group of Companies Inc.</small>
      </span>
    </>
  )
}

export function SiteHeader() {
  return (
    <header className="kg-header">
      <Link className="kg-brand" to="/" aria-label="Khangura Group home">
        <Brand useMonogram />
      </Link>

      <nav className="kg-nav" aria-label="Primary navigation">
        {navLinks.map((link) => (
          <Link key={link.to} to={link.to} preload="intent">
            {link.label}
          </Link>
        ))}
      </nav>

      <Link className="kg-quote-link" to="/contact" preload="intent">
        Start a project
        <IconArrowUpRight size={17} stroke={1.8} />
      </Link>

      <details className="kg-mobile-menu">
        <summary aria-label="Open navigation">
          <IconMenu2 className="menu-open" size={22} />
          <IconX className="menu-close" size={22} />
        </summary>
        <nav aria-label="Mobile navigation">
          {navLinks.map((link, index) => (
            <Link key={link.to} to={link.to} preload="intent">
              <span>0{index + 1}</span>
              {link.label}
              <IconArrowUpRight size={18} />
            </Link>
          ))}
          <Link to="/contact">
            <span>05</span>
            Start a project
            <IconArrowUpRight size={18} />
          </Link>
        </nav>
      </details>
    </header>
  )
}

export function SiteFooter() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const response = await fetch('/api/content/siteSettings')
      if (!response.ok) throw new Error()
      return response.json() as Promise<Settings[]>
    },
    enabled: typeof window !== 'undefined',
  })

  const settings = data?.[0]
  const company = settings?.title ?? 'Khangura'
  const phone = settings?.phone ?? '672-377-1944'
  const email = settings?.email ?? 'khangura.group.of.companies.inc@gmail.com'

  return (
    <footer className="kg-footer">
      <div className="kg-wrap kg-footer-panel">
        <div className="kg-footer-column">
          <h2>Services</h2>
          <Link to="/services/framing">Steel stud framing</Link>
          <Link to="/services/mudding">Drywall taping & mudding</Link>
          <Link to="/services/insulation">Insulation</Link>
          <Link to="/services/painting">Painting</Link>
          <Link to="/services/concrete">Concrete services</Link>
        </div>
        <div className="kg-footer-column">
          <h2>Company</h2>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="kg-footer-column">
          <h2>Project help</h2>
          <Link to="/contact">Request a quote</Link>
          <Link to="/faq">Common questions</Link>
          <Link to="/service-areas">Service areas</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/accessibility">Accessibility</Link>
        </div>
        <div className="kg-footer-column kg-footer-contact">
          <h2>Talk to the team</h2>
          <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            <IconPhone size={17} />
            {phone}
          </a>
          <a href={`mailto:${email}`}>
            <IconMail size={17} />
            Email Khangura Group
          </a>
          <p>
            {settings?.summary ??
              'Professional construction and finishing solutions for Surrey and the Lower Mainland.'}
          </p>
        </div>
        <div className="kg-footer-brandline">
          <Link className="kg-brand kg-brand-footer" to="/">
            <Brand company={company} />
          </Link>
          <span>Surrey, British Columbia</span>
        </div>
        <div className="kg-footer-copyright">
          © {new Date().getFullYear()} Khangura Group of Companies Inc.
        </div>
      </div>
    </footer>
  )
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="kg-site">
      <a className="kg-skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  )
}

export function PageHero({
  title,
  description,
}: {
  title: ReactNode
  description: string
}) {
  return (
    <section className="kg-page-hero">
      <div className="kg-wrap">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="kg-final-cta">
      <div className="kg-wrap">
        <div className="kg-final-copy">
          <p>Have a site, a scope, or just the first set of questions?</p>
          <h2>Let’s get the work moving.</h2>
        </div>
        <div className="kg-final-actions">
          <Link className="kg-button kg-button-signal" to="/contact">
            Request a quote
            <IconArrowUpRight size={19} />
          </Link>
          <a href="tel:+16723771944">
            <IconPhone size={18} />
            672-377-1944
          </a>
        </div>
      </div>
    </section>
  )
}
