import {
  IconArrowUpRight,
  IconCheck,
  IconFileUpload,
  IconLoader2,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { services, whatsappHref } from '../lib/content'
import { track } from '../lib/analytics'

const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  description: z.string().min(12),
  consent: z.literal(true),
})
const applicationSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  experience: z.string().min(8),
  consent: z.literal(true),
})
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
type PrivateAsset = {
  publicId: string
  originalFilename: string
  bytes: number
  resourceType?: 'image' | 'raw'
}

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => string
      remove: (id: string) => void
    }
  }
}

function Turnstile({ onToken }: { onToken: (value: string) => void }) {
  const element = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!siteKey || !element.current) return
    let widget: string | undefined
    const render = () => {
      if (element.current && window.turnstile)
        widget = window.turnstile.render(element.current, {
          sitekey: siteKey,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
        })
    }
    if (window.turnstile) render()
    else {
      const script = document.createElement('script')
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = render
      document.head.appendChild(script)
    }
    return () => {
      if (widget && window.turnstile) window.turnstile.remove(widget)
    }
  }, [onToken])
  if (!siteKey)
    return (
      <p className="kg-form-warning">
        Form verification is not configured yet.
      </p>
    )
  return <div className="kg-turnstile" ref={element} />
}

async function uploadPrivateFiles(
  files: File[],
  kind: 'inquiry' | 'application',
  token: string,
) {
  if (files.some((file) => file.size > 10_000_000))
    throw new Error('Each attachment must be 10MB or smaller.')
  return Promise.all(
    files.map(async (file): Promise<PrivateAsset> => {
      const resourceType = file.type.startsWith('image/') ? 'image' : 'raw'
      const signResponse = await fetch('/api/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, resourceType, turnstileToken: token }),
      })
      const signature = await signResponse.json()
      if (!signResponse.ok)
        throw new Error(signature.error ?? 'Unable to prepare an attachment.')
      const form = new FormData()
      form.set('file', file)
      form.set('api_key', signature.apiKey)
      form.set('timestamp', String(signature.timestamp))
      form.set('signature', signature.signature)
      form.set('folder', signature.folder)
      form.set('type', signature.type)
      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`,
        { method: 'POST', body: form },
      )
      const uploaded = await uploadResponse.json()
      if (!uploadResponse.ok)
        throw new Error(uploaded.error?.message ?? 'Attachment upload failed.')
      return {
        publicId: uploaded.public_id,
        originalFilename: file.name,
        bytes: uploaded.bytes,
        resourceType,
      }
    }),
  )
}

function SubmitNote({
  kind,
  reference,
}: {
  kind: 'enquiry' | 'application'
  reference?: string
}) {
  return (
    <div className="kg-form-success">
      <IconCheck />
      <h3>
        {kind === 'enquiry'
          ? 'Your enquiry has been saved.'
          : 'Your application has been saved.'}
      </h3>
      <p>
        {reference ? (
          <>
            Reference: <strong>{reference}</strong>.{' '}
          </>
        ) : null}
        The record is saved before any WhatsApp notification attempt. Any
        documents are kept in the private application workspace.
      </p>
      {kind === 'enquiry' && (
        <a
          className="kg-button kg-button-signal"
          href={`${whatsappHref}%0AReference%3A%20${encodeURIComponent(reference ?? '')}`}
        >
          Continue on WhatsApp <IconArrowUpRight size={15} />
        </a>
      )}
    </div>
  )
}

function SubmitButton({
  busy,
  children,
}: {
  busy: boolean
  children: React.ReactNode
}) {
  return (
    <button
      className="kg-button kg-button-signal"
      type="submit"
      disabled={busy}
    >
      {busy ? (
        <>
          <IconLoader2 className="spin" size={15} /> Securing files…
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function EnquiryForm() {
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [busy, setBusy] = useState(false)
  if (reference) return <SubmitNote kind="enquiry" reference={reference} />
  return (
    <form
      className="kg-form-panel"
      onSubmit={async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        const result = enquirySchema.safeParse({
          ...Object.fromEntries(data),
          consent: data.get('consent') === 'on',
        })
        if (!result.success)
          return setError(
            'Please complete your name, phone, email, project description, and privacy consent.',
          )
        if (siteKey && !turnstileToken)
          return setError('Please complete the verification check.')
        setError('')
        setBusy(true)
        try {
          const attachments = await uploadPrivateFiles(
            Array.from(data.getAll('attachments')).filter(
              (file): file is File => file instanceof File && file.size > 0,
            ),
            'inquiry',
            turnstileToken,
          )
          const payload = {
            name: String(data.get('name')),
            company: String(data.get('company') || '') || undefined,
            phone: String(data.get('phone')),
            email: String(data.get('email')),
            preferredContact: String(data.get('contactMethod')).toLowerCase(),
            projectType: String(data.get('projectType')).toLowerCase(),
            stage: String(data.get('stage')),
            services: data.getAll('services'),
            location: String(data.get('location')),
            timeline: String(data.get('timeline')),
            budget: String(data.get('budget') || '') || undefined,
            description: String(data.get('description')),
            attachments,
            turnstileToken: turnstileToken || undefined,
            attribution: { referrer: document.referrer || undefined },
          }
          const response = await fetch('/api/inquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const body = await response.json()
          if (!response.ok)
            throw new Error(body.error || 'Unable to save enquiry.')
          setReference(body.reference)
          track('inquiry_submitted', {
            project_type: payload.projectType,
            service_count: payload.services.length,
          })
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : 'Unable to save enquiry.',
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <header className="kg-form-head">
        <h2>Tell us about the work.</h2>
        <p>
          The essentials are grouped so the first review can be useful. Your
          record is saved before any WhatsApp notification attempt.
        </p>
      </header>
      <div className="kg-form-grid">
        <Field label="Name" name="name" />
        <Field label="Company (optional)" name="company" />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Email" name="email" type="email" />
        <Select
          label="Project type"
          name="projectType"
          options={['Residential', 'Commercial']}
        />
        <Select
          label="Project stage"
          name="stage"
          options={['Planning', 'Ready for quote', 'In progress', 'Other']}
        />
        <Field label="Project city / postal code" name="location" />
        <Select
          label="Desired timeline"
          name="timeline"
          options={[
            'As soon as possible',
            'Within 1 month',
            '1–3 months',
            'Flexible',
          ]}
        />
      </div>
      <fieldset className="kg-service-fields">
        <legend>Requested services</legend>
        <div>
          {services.map((service) => (
            <label key={service.key}>
              <input type="checkbox" name="services" value={service.key} />
              {service.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="kg-form-grid">
        <Select
          label="Preferred contact"
          name="contactMethod"
          options={['Phone', 'Email', 'WhatsApp']}
        />
        <Select
          label="Budget range (optional)"
          name="budget"
          options={[
            'Not sure yet',
            'Under $5,000',
            '$5,000–$20,000',
            '$20,000+',
            'Prefer to discuss',
          ]}
        />
      </div>
      <div className="kg-field kg-field-wide">
        <label htmlFor="description">Project description</label>
        <textarea
          id="description"
          name="description"
          placeholder="Scope, access, drawings, or anything else useful for the review."
        />
      </div>
      <div className="kg-field kg-field-wide">
        <label htmlFor="attachments">
          Private attachments — up to five files, 10MB each
        </label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
        />
      </div>
      <Turnstile onToken={setTurnstileToken} />
      <label className="kg-consent">
        <input name="consent" type="checkbox" /> I agree that Khangura Group may
        use this information to respond to my enquiry and process it as
        described in the privacy policy.
      </label>
      {error && (
        <p className="kg-form-error" role="alert">
          {error}
        </p>
      )}
      <SubmitButton busy={busy}>
        Save my enquiry <IconArrowUpRight size={15} />
      </SubmitButton>
    </form>
  )
}

export function CareerForm({
  opening = 'General application',
}: {
  opening?: string
}) {
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [busy, setBusy] = useState(false)
  if (reference) return <SubmitNote kind="application" reference={reference} />
  return (
    <form
      className="kg-form-panel"
      onSubmit={async (event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const result = applicationSchema.safeParse({
          ...Object.fromEntries(data),
          consent: data.get('consent') === 'on',
        })
        if (!result.success)
          return setError(
            'Please complete your contact information, experience details, and consent.',
          )
        const resumeFile = data.get('resume')
        if (!(resumeFile instanceof File) || !resumeFile.size)
          return setError('Please attach your resume.')
        if (siteKey && !turnstileToken)
          return setError('Please complete the verification check.')
        setError('')
        setBusy(true)
        try {
          const [resume] = await uploadPrivateFiles(
            [resumeFile],
            'application',
            turnstileToken,
          )
          const supportingFiles = await uploadPrivateFiles(
            Array.from(data.getAll('supportingFiles')).filter(
              (file): file is File => file instanceof File && file.size > 0,
            ),
            'application',
            turnstileToken,
          )
          const payload = {
            openingSlug: opening.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: String(data.get('name')),
            phone: String(data.get('phone')),
            email: String(data.get('email')),
            city: String(data.get('city')),
            experience: String(data.get('experience')),
            years: String(data.get('years')),
            availability: String(data.get('availability')),
            workAuthorization: String(data.get('authorization')).startsWith(
              'Authorized',
            ),
            transport: String(data.get('transport')),
            resume,
            supportingFiles,
            turnstileToken: turnstileToken || undefined,
          }
          const response = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const body = await response.json()
          if (!response.ok)
            throw new Error(body.error || 'Unable to save application.')
          setReference(body.reference)
          track('career_application_submitted', {
            opening: payload.openingSlug,
          })
        } catch (submitError) {
          setError(
            submitError instanceof Error
              ? submitError.message
              : 'Unable to save application.',
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <header className="kg-form-head">
        <h2>{opening}</h2>
        <p>Share your experience, availability, and documents securely.</p>
      </header>
      <div className="kg-form-grid">
        <Field label="Full name" name="name" />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Email" name="email" type="email" />
        <Field label="City" name="city" />
        <Select
          label="Years of experience"
          name="years"
          options={['Less than 1 year', '1–3 years', '4–7 years', '8+ years']}
        />
        <Select
          label="Availability"
          name="availability"
          options={['Immediately', 'Within 2 weeks', 'Within 1 month', 'Other']}
        />
      </div>
      <div className="kg-field kg-field-wide">
        <label htmlFor="experience">
          Trade experience and relevant services
        </label>
        <textarea
          id="experience"
          name="experience"
          placeholder="Describe relevant drywall, framing, insulation, painting, concrete, or other construction experience."
        />
      </div>
      <div className="kg-form-grid">
        <Select
          label="Work authorization"
          name="authorization"
          options={[
            'Authorized to work in Canada',
            'Will need sponsorship / authorization',
            'Prefer to discuss',
          ]}
        />
        <Select
          label="Driving / transport"
          name="transport"
          options={[
            'Own reliable transport',
            'Valid licence, no vehicle',
            'Prefer to discuss',
          ]}
        />
      </div>
      <div className="kg-field kg-field-wide">
        <label htmlFor="resume">Resume (PDF, DOC, or DOCX)</label>
        <input id="resume" name="resume" type="file" accept=".pdf,.doc,.docx" />
      </div>
      <div className="kg-field kg-field-wide">
        <label htmlFor="supportingFiles">
          Optional certifications / portfolio — up to three files
        </label>
        <input
          id="supportingFiles"
          name="supportingFiles"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </div>
      <Turnstile onToken={setTurnstileToken} />
      <label className="kg-consent">
        <input name="consent" type="checkbox" /> I consent to the collection and
        use of my application information for recruitment.
      </label>
      {error && (
        <p className="kg-form-error" role="alert">
          {error}
        </p>
      )}
      <SubmitButton busy={busy}>
        <IconFileUpload size={15} /> Submit application
      </SubmitButton>
    </form>
  )
}
function Field({
  label,
  name,
  type = 'text',
}: {
  label: string
  name: string
  type?: string
}) {
  return (
    <div className="kg-field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} />
    </div>
  )
}
function Select({
  label,
  name,
  options,
}: {
  label: string
  name: string
  options: string[]
}) {
  return (
    <div className="kg-field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}
