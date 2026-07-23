import { useEffect, useRef, useState } from 'react'
import { services } from '../lib/content'
import type { ServiceKey } from '../lib/content'
import { servicePhotoSources, ServiceMediaToggle } from './service-media-toggle'

export function CapabilityLab() {
  const [active, setActive] = useState<ServiceKey>('framing')
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = services.find((service) => service.key === active)!

  useEffect(() => {
    let frame: number | null = null
    const syncActiveService = () => {
      frame = null
      const guide = window.innerHeight * 0.5
      let nearest: { key: ServiceKey; distance: number } | null = null

      for (const item of itemRefs.current) {
        if (!item) continue
        const key = item.dataset.service as ServiceKey | undefined
        if (!key) continue
        const bounds = item.getBoundingClientRect()
        const distance = Math.abs(bounds.top + bounds.height / 2 - guide)

        if (!nearest || distance < nearest.distance) {
          nearest = { key, distance }
        }
      }

      if (nearest) setActive(nearest.key)
    }
    const requestSync = () => {
      if (frame === null)
        frame = window.requestAnimationFrame(syncActiveService)
    }

    requestSync()
    window.addEventListener('scroll', requestSync, { passive: true })
    window.addEventListener('resize', requestSync)
    return () => {
      window.removeEventListener('scroll', requestSync)
      window.removeEventListener('resize', requestSync)
      if (frame !== null) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const images = servicePhotoSources.map((src) => {
      const image = new Image()
      image.src = src
      return image
    })

    return () =>
      images.forEach((image) => {
        image.src = ''
      })
  }, [])

  return (
    <div className="kg-capability-showcase kg-wrap">
      <div className="kg-lab">
        <div className="kg-lab-stage">
          <div className="kg-stage-number" aria-hidden="true">
            {current.number}
          </div>
          <ServiceMediaToggle serviceKey={active} variant="stage" />
        </div>
      </div>

      <div
        className="kg-capability-list"
        role="tablist"
        aria-label="Explore services"
      >
        {services.map((service, index) => {
          const ServiceIcon = service.icon
          return (
            <button
              className="kg-capability-card"
              data-service={service.key}
              key={service.key}
              ref={(element) => {
                itemRefs.current[index] = element
              }}
              type="button"
              role="tab"
              aria-selected={active === service.key}
              onClick={() => setActive(service.key)}
            >
              <span>{service.number}</span>
              <ServiceIcon size={30} stroke={1.5} />
              <div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
