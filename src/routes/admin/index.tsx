import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  IconArrowUpRight,
  IconBriefcase,
  IconDatabase,
  IconFileText,
  IconLayoutDashboard,
  IconLock,
  IconLogout,
  IconMessage2,
  IconPhoto,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'
import { authClient } from '../../lib/auth-client'

export const Route = createFileRoute('/admin/')({ component: Admin })
type Tab =
  | 'dashboard'
  | 'enquiries'
  | 'applications'
  | 'projects'
  | 'faqs'
  | 'jobs'
  | 'services'
  | 'media'
  | 'testimonials'
  | 'settings'
const nav: Array<[Tab, string, typeof IconLayoutDashboard]> = [
  ['dashboard', 'Dashboard', IconLayoutDashboard],
  ['enquiries', 'Enquiries', IconMessage2],
  ['applications', 'Applications', IconUsers],
  ['projects', 'Projects', IconPhoto],
  ['faqs', 'FAQs', IconFileText],
  ['jobs', 'Job openings', IconBriefcase],
  ['services', 'Services', IconDatabase],
  ['media', 'Media library', IconPhoto],
  ['testimonials', 'Testimonials', IconMessage2],
  ['settings', 'Site settings', IconDatabase],
]
type Overview = {
  metrics: {
    newEnquiries: number
    newApplications: number
    publishedProjects: number
    failedWhatsapp: number
  }
  recentEnquiries: Array<{
    id: string
    reference: string
    name: string
    company?: string
    projectType: string
    status: string
  }>
}
type RecordItem = Record<string, unknown> & {
  id: string
  state?: string
  title?: string
  slug?: string
  question?: string
  answer?: string
  summary?: string
}
type InboxItem = Record<string, unknown> & {
  id: string
  reference: string
  name: string
  email: string
  phone: string
  status: string
  notes?: Array<{ body: string; createdAt: string }>
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error ?? 'Request failed.')
  return body
}

function Login() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsCode, setNeedsCode] = useState(false)
  return (
    <main className="admin">
      <section
        className="form-panel"
        style={{ maxWidth: '28rem', margin: '10vh auto' }}
      >
        <h1 className="admin-title">Content Console</h1>
        {needsCode ? (
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setBusy(true)
              const result = await authClient.twoFactor.verifyTotp({
                code: String(new FormData(event.currentTarget).get('code')),
                trustDevice: false,
              })
              setBusy(false)
              if (result.error)
                setError('That authentication code was not accepted.')
            }}
          >
            <p className="body-copy">
              Enter the code from your authenticator app to finish signing in.
            </p>
            <div className="field">
              <label htmlFor="admin-code">Authenticator code</label>
              <input
                id="admin-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
              />
            </div>
            <button
              className="button orange"
              type="submit"
              disabled={busy}
              style={{ marginTop: '1rem' }}
            >
              <IconLock size={15} /> Verify code
            </button>
          </form>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              setBusy(true)
              setError('')
              const result = await authClient.signIn.email({
                email: String(data.get('email')),
                password: String(data.get('password')),
              })
              setBusy(false)
              if (result.error)
                setError('We could not sign you in with those details.')
              else if (
                (result.data as { twoFactorRedirect?: boolean } | null)
                  ?.twoFactorRedirect
              )
                setNeedsCode(true)
            }}
          >
            <p className="body-copy">
              Sign in with your invited staff account. Two-factor authentication
              is required before the console opens.
            </p>
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="field" style={{ marginTop: '.8rem' }}>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              className="button orange"
              type="submit"
              disabled={busy}
              style={{ marginTop: '1rem' }}
            >
              <IconLock size={15} /> {busy ? 'Signing in…' : 'Sign in securely'}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" style={{ color: '#a83d1c', fontSize: '.8rem' }}>
            {error}
          </p>
        )}
      </section>
    </main>
  )
}

function TwoFactorSetup() {
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [uri, setUri] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  return (
    <main className="admin">
      <section
        className="form-panel"
        style={{ maxWidth: '34rem', margin: '8vh auto' }}
      >
        <h1 className="admin-title">Set up two-factor authentication.</h1>
        {!uri ? (
          <>
            <p className="body-copy">
              Enter your current password to generate a time-based authenticator
              code.
            </p>
            <div className="field">
              <label htmlFor="setup-password">Current password</label>
              <input
                id="setup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button
              className="button orange"
              type="button"
              onClick={async () => {
                const result = await authClient.twoFactor.enable({ password })
                if (result.error)
                  setError('We could not begin two-factor setup.')
                else {
                  setUri(result.data.totpURI)
                  setBackupCodes(result.data.backupCodes)
                }
              }}
              style={{ marginTop: '1rem' }}
            >
              Generate secure setup
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                background: '#fff',
                padding: '1rem',
                width: 'fit-content',
                margin: '1rem 0',
              }}
            >
              <QRCodeSVG value={uri} size={180} />
            </div>
            <details>
              <summary className="mono">Show recovery codes</summary>
              <p className="mono" style={{ lineHeight: 1.8 }}>
                {backupCodes.join(' · ')}
              </p>
            </details>
            <div className="field" style={{ marginTop: '1rem' }}>
              <label htmlFor="setup-code">Authenticator code</label>
              <input
                id="setup-code"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            <button
              className="button orange"
              type="button"
              onClick={async () => {
                const result = await authClient.twoFactor.verifyTotp({
                  code,
                  trustDevice: false,
                })
                if (result.error)
                  setError('That authentication code was not accepted.')
                else await authClient.getSession()
              }}
              style={{ marginTop: '1rem' }}
            >
              Verify and continue
            </button>
          </>
        )}
        {error && (
          <p role="alert" style={{ color: '#a83d1c', fontSize: '.8rem' }}>
            {error}
          </p>
        )}
      </section>
    </main>
  )
}

function Dashboard() {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => request<Overview>('/api/admin/overview'),
  })
  const metrics = data?.metrics ?? {
    newEnquiries: '—',
    newApplications: '—',
    publishedProjects: '—',
    failedWhatsapp: '—',
  }
  return (
    <>
      <div className="dashboard-grid">
        {[
          ['New enquiries', metrics.newEnquiries],
          ['New applications', metrics.newApplications],
          ['Published projects', metrics.publishedProjects],
          ['WhatsApp failures', metrics.failedWhatsapp],
        ].map(([label, value]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </article>
        ))}
      </div>
      <section className="admin-card" style={{ marginTop: '1rem' }}>
        <div className="admin-top">
          <h2>Latest enquiries</h2>
          <button className="button light" onClick={() => refetch()}>
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
        {isPending ? (
          <p>Loading inbox…</p>
        ) : error ? (
          <p className="notice">{error.message}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Contact</th>
                  <th>Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEnquiries.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.reference}</td>
                    <td>{lead.company || lead.name}</td>
                    <td>{lead.projectType}</td>
                    <td>
                      <span className="pill">{lead.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

function PrivateAttachments({ item }: { item: InboxItem }) {
  const files = [
    ...(Array.isArray(item.attachments) ? item.attachments : []),
    ...(item.resume ? [item.resume] : []),
    ...(Array.isArray(item.supportingFiles) ? item.supportingFiles : []),
  ] as Array<{
    publicId?: string
    originalFilename?: string
    resourceType?: 'image' | 'raw'
  }>
  if (!files.length) return null
  return (
    <div className="attachment-links">
      {files.map((file) => (
        <button
          key={file.publicId}
          className="button light"
          type="button"
          onClick={async () => {
            if (!file.publicId) return
            const result = await request<{ url: string }>(
              `/api/admin/private-url?publicId=${encodeURIComponent(file.publicId)}&resourceType=${file.resourceType ?? 'raw'}`,
            )
            window.open(result.url, '_blank', 'noopener,noreferrer')
          }}
        >
          Open {file.originalFilename ?? 'attachment'}
        </button>
      ))}
    </div>
  )
}

function Inbox({
  collection,
}: {
  collection: 'inquiries' | 'careerApplications'
}) {
  const client = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const statuses =
    collection === 'inquiries'
      ? ['new', 'contacted', 'quoting', 'won', 'lost', 'spam']
      : ['new', 'reviewing', 'interview', 'offer', 'hired', 'rejected']
  const label = collection === 'inquiries' ? 'Enquiries' : 'Applications'
  const {
    data = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['inbox', collection],
    queryFn: () => request<InboxItem[]>(`/api/admin/inbox/${collection}`),
  })
  const update = useMutation({
    mutationFn: (input: { id: string; status?: string; note?: string }) =>
      request(`/api/admin/inbox/${collection}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['inbox', collection] }),
  })
  return (
    <section className="admin-card">
      <div className="admin-top">
        <div>
          <h2>{label}</h2>
        </div>
        <span className="pill">{data.length} records</span>
      </div>
      {isPending ? (
        <p>Loading {label.toLowerCase()}…</p>
      ) : error ? (
        <p className="notice">{error.message}</p>
      ) : (
        <div className="inbox-list">
          {data.map((item) => (
            <article className="inbox-row" key={item.id}>
              <button
                className="inbox-summary"
                onClick={() =>
                  setExpanded(expanded === item.id ? null : item.id)
                }
                aria-expanded={expanded === item.id}
              >
                <span>
                  <b>{item.reference}</b>
                  <small>
                    {item.name} · {String(item.email)}
                  </small>
                </span>
                <span className="pill">{item.status}</span>
              </button>
              {expanded === item.id && (
                <div className="inbox-detail">
                  <p className="body-copy">
                    {collection === 'inquiries'
                      ? `${String(item.projectType ?? 'Project')} · ${String(item.location ?? '')} · ${Array.isArray(item.services) ? item.services.join(', ') : ''}`
                      : `${String(item.openingSlug ?? 'Application')} · ${String(item.city ?? '')} · ${String(item.years ?? '')}`}
                  </p>
                  <p className="body-copy">
                    {String(item.description ?? item.experience ?? '')}
                  </p>
                  <div className="form-grid two">
                    <Select
                      label="Workflow status"
                      value={item.status}
                      onChange={(status) =>
                        update.mutate({ id: item.id, status })
                      }
                      options={statuses}
                    />
                    <NoteInput
                      onSave={(note) => update.mutate({ id: item.id, note })}
                    />
                  </div>
                  {update.error && (
                    <p className="notice">{update.error.message}</p>
                  )}
                  <PrivateAttachments item={item} />
                  <a
                    className="button light"
                    href={`mailto:${String(item.email)}`}
                  >
                    Email contact <IconArrowUpRight size={14} />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

const contentConfig = {
  projects: {
    label: 'Projects',
    fields: [
      ['title', 'Title'],
      ['slug', 'URL slug'],
      ['summary', 'Overview'],
      ['city', 'City'],
      ['projectType', 'Residential / commercial'],
      ['services', 'Services (comma separated)'],
    ],
  },
  faqs: {
    label: 'FAQs',
    fields: [
      ['question', 'Question'],
      ['answer', 'Answer'],
    ],
  },
  jobs: {
    label: 'Job openings',
    collection: 'jobOpenings',
    fields: [
      ['title', 'Role'],
      ['slug', 'URL slug'],
      ['summary', 'Summary'],
      ['location', 'Location'],
      ['type', 'Employment type'],
    ],
  },
  services: {
    label: 'Services',
    fields: [
      ['title', 'Service name'],
      ['slug', 'URL slug'],
      ['summary', 'Description'],
    ],
  },
  testimonials: {
    label: 'Testimonials',
    fields: [
      ['title', 'Client name / attribution'],
      ['summary', 'Quote'],
      ['role', 'Project context (optional)'],
    ],
  },
  settings: {
    label: 'Site settings',
    collection: 'siteSettings',
    fields: [
      ['title', 'Company name'],
      ['phone', 'Public phone'],
      ['email', 'Public email'],
      ['summary', 'Service-area summary'],
    ],
  },
} as const
function Content({
  kind,
}: {
  kind: 'projects' | 'faqs' | 'jobs' | 'services' | 'testimonials' | 'settings'
}) {
  const client = useQueryClient()
  const config = contentConfig[kind]
  const collection = 'collection' in config ? config.collection : kind
  const [editing, setEditing] = useState<RecordItem | null>(null)
  const {
    data = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['content', collection],
    queryFn: () => request<RecordItem[]>(`/api/admin/content/${collection}`),
  })
  const save = useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      request(`/api/admin/content/${collection}`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['content', collection] })
      setEditing(null)
    },
  })
  const trash = useMutation({
    mutationFn: (id: string) =>
      request(`/api/admin/content/${collection}`, {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['content', collection] }),
  })
  return (
    <section className="content-layout">
      <div className="admin-card">
        <div className="admin-top">
          <div>
            <h2>{config.label}</h2>
          </div>
          <button
            className="button orange"
            onClick={() => setEditing({ id: '' })}
          >
            <IconPlus size={14} /> New
          </button>
        </div>
        {isPending ? (
          <p>Loading content…</p>
        ) : error ? (
          <p className="notice">{error.message}</p>
        ) : (
          <div className="content-list">
            {data.map((item) => (
              <article key={item.id} className="content-row">
                <button onClick={() => setEditing(item)}>
                  <b>{String(item.title ?? item.question ?? 'Untitled')}</b>
                  <small>
                    /{String(item.slug ?? 'no-slug')} ·{' '}
                    {String(item.state ?? 'draft')}
                  </small>
                </button>
                <button
                  className="icon-button"
                  aria-label="Move to trash"
                  onClick={() => {
                    if (confirm('Move this item to trash?'))
                      trash.mutate(item.id)
                  }}
                >
                  <IconTrash size={15} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
      {editing && (
        <ContentForm
          key={editing.id || 'new-content'}
          config={config}
          item={editing}
          saving={save.isPending}
          error={save.error?.message}
          onCancel={() => setEditing(null)}
          onSave={(input) =>
            save.mutate({ ...input, id: editing.id || undefined })
          }
        />
      )}
    </section>
  )
}
function ContentForm({
  config,
  item,
  saving,
  error,
  onCancel,
  onSave,
}: {
  config: (typeof contentConfig)[keyof typeof contentConfig]
  item: RecordItem
  saving: boolean
  error?: string
  onCancel: () => void
  onSave: (input: Record<string, unknown>) => void
}) {
  const { data: media = [] } = useQuery({
    queryKey: ['media'],
    queryFn: () =>
      request<Array<{ publicId: string; secureUrl: string; alt: string }>>(
        '/api/admin/media',
      ),
    enabled: config.label === 'Projects',
  })
  const [gallery, setGallery] = useState<
    Array<{
      publicId: string
      secureUrl: string
      alt: string
      caption?: string
    }>
  >(() =>
    Array.isArray(item.gallery)
      ? (item.gallery as Array<{
          publicId: string
          secureUrl: string
          alt: string
          caption?: string
        }>)
      : [],
  )
  return (
    <form
      className="admin-card content-editor"
      onSubmit={(event) => {
        event.preventDefault()
        const raw = Object.fromEntries(new FormData(event.currentTarget))
        const services =
          typeof raw.services === 'string'
            ? raw.services
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
            : raw.services
        onSave({ ...raw, services, gallery })
      }}
    >
      <div className="admin-top">
        <h2>{item.id ? 'Edit entry' : 'New entry'}</h2>
        <button className="button light" type="button" onClick={onCancel}>
          Close
        </button>
      </div>
      {config.fields.map(([name, label]) => (
        <div className="field" key={name} style={{ marginBottom: '.8rem' }}>
          <label htmlFor={`content-${name}`}>{label}</label>
          {name === 'summary' || name === 'answer' ? (
            <textarea
              id={`content-${name}`}
              name={name}
              defaultValue={String(item[name] ?? '')}
            />
          ) : (
            <input
              id={`content-${name}`}
              name={name}
              defaultValue={
                Array.isArray(item[name])
                  ? item[name].join(', ')
                  : String(item[name] ?? '')
              }
              required={name === 'title' || name === 'question'}
            />
          )}
        </div>
      ))}
      {config.label === 'Projects' && (
        <fieldset className="gallery-picker">
          <legend className="mono">PROJECT GALLERY</legend>
          <p className="body-copy">
            Select images in case-study order. Every image retains the
            media-library alt text.
          </p>
          <div className="gallery-picker-grid">
            {media.map((asset) => {
              const selected = gallery.some(
                (image) => image.publicId === asset.publicId,
              )
              return (
                <label
                  key={asset.publicId}
                  className={selected ? 'selected' : ''}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      setGallery((current) =>
                        selected
                          ? current.filter(
                              (image) => image.publicId !== asset.publicId,
                            )
                          : [...current, { ...asset }],
                      )
                    }
                  />
                  <img src={asset.secureUrl} alt="" />
                  <span>{asset.alt}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      <Select
        label="Publication state"
        name="state"
        defaultValue={String(item.state ?? 'draft')}
        options={['draft', 'published', 'archived']}
      />
      {error && <p className="notice">{error}</p>}
      <button
        className="button orange"
        type="submit"
        disabled={saving}
        style={{ marginTop: '1rem' }}
      >
        {saving ? 'Saving…' : 'Save entry'}
      </button>
    </form>
  )
}
function Select({
  label,
  options,
  value,
  defaultValue,
  onChange,
  name,
}: {
  label: string
  options: string[]
  value?: string
  defaultValue?: string
  onChange?: (nextValue: string) => void
  name?: string
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
function NoteInput({ onSave }: { onSave: (value: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="field">
      <label htmlFor="note">Internal note</label>
      <div className="note-input">
        <input
          id="note"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Visible to staff only"
        />
        <button
          className="button light"
          type="button"
          onClick={() => {
            if (value.trim()) {
              onSave(value)
              setValue('')
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

type MediaAsset = {
  id: string
  publicId: string
  secureUrl: string
  alt: string
  width?: number
  height?: number
  bytes?: number
}
function Media() {
  const client = useQueryClient()
  const [alt, setAlt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { data = [] } = useQuery({
    queryKey: ['media'],
    queryFn: () => request<MediaAsset[]>('/api/admin/media'),
  })
  const upload = async (file: File) => {
    if (!alt.trim())
      return setError('Add a descriptive alt text before uploading.')
    if (!file.type.startsWith('image/'))
      return setError('Only image files belong in the public project library.')
    setBusy(true)
    setError('')
    try {
      const signature = await request<{
        apiKey: string
        cloudName: string
        timestamp: number
        signature: string
        folder: string
      }>('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({ action: 'sign' }),
      })
      const body = new FormData()
      body.set('file', file)
      body.set('api_key', signature.apiKey)
      body.set('timestamp', String(signature.timestamp))
      body.set('signature', signature.signature)
      body.set('folder', signature.folder)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
        { method: 'POST', body },
      )
      const uploaded = await response.json()
      if (!response.ok)
        throw new Error(uploaded.error?.message ?? 'Upload failed.')
      await request('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          action: 'record',
          publicId: uploaded.public_id,
          secureUrl: uploaded.secure_url,
          width: uploaded.width,
          height: uploaded.height,
          bytes: uploaded.bytes,
          originalFilename: file.name,
          alt,
        }),
      })
      setAlt('')
      client.invalidateQueries({ queryKey: ['media'] })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="admin-card">
      <div className="admin-top">
        <div>
          <h2>Media library</h2>
        </div>
        <span className="pill">{data.length} assets</span>
      </div>
      <div className="form-grid two">
        <div className="field">
          <label htmlFor="media-alt">Required alt text</label>
          <input
            id="media-alt"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Describe what is visible in the image"
          />
        </div>
        <div className="field">
          <label htmlFor="media-file">Project image</label>
          <input
            id="media-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
          />
        </div>
      </div>
      {error && <p className="notice">{error}</p>}
      <div className="media-grid">
        {data.map((asset) => (
          <figure key={asset.id}>
            <img src={asset.secureUrl} alt={asset.alt} loading="lazy" />
            <figcaption>
              <b>{asset.alt}</b>
              <span className="mono">{asset.publicId}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function Admin() {
  const session = authClient.useSession()
  const [tab, setTab] = useState<Tab>('dashboard')
  if (session.isPending)
    return (
      <main className="admin">
        <p className="mono" style={{ padding: '3rem' }}>
          Checking secure session…
        </p>
      </main>
    )
  if (!session.data) return <Login />
  if (!session.data.user.twoFactorEnabled) return <TwoFactorSetup />
  return (
    <main className="admin">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <a className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <img src="/brand/khangura-client-logo-v1.png" alt="" />
            </span>
            <span className="admin-brand-copy">
              <b>Khangura</b>
              <small>Content Console</small>
            </span>
          </a>
          <nav>
            {nav.map(([id, label, Icon]) => (
              <button
                className={tab === id ? 'active' : ''}
                onClick={() => setTab(id)}
                key={id}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="admin-main">
          <header className="admin-top">
            <div>
              <h1 className="admin-title">
                {nav.find(([id]) => id === tab)?.[1]}
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <button
                className="button light"
                onClick={() => authClient.signOut()}
              >
                <IconLogout size={15} /> Sign out
              </button>
              <a className="button" href="/">
                View public site <IconArrowUpRight size={15} />
              </a>
            </div>
          </header>
          {tab === 'dashboard' && <Dashboard />}
          {tab === 'enquiries' && <Inbox collection="inquiries" />}
          {tab === 'applications' && <Inbox collection="careerApplications" />}
          {tab === 'projects' && <Content kind="projects" />}
          {tab === 'faqs' && <Content kind="faqs" />}
          {tab === 'jobs' && <Content kind="jobs" />}
          {tab === 'services' && <Content kind="services" />}
          {tab === 'media' && <Media />}
          {tab === 'testimonials' && <Content kind="testimonials" />}
          {tab === 'settings' && <Content kind="settings" />}
        </section>
      </div>
    </main>
  )
}
