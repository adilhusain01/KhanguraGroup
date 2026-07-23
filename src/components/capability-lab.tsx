import { useEffect, useRef, useState } from 'react'
import { services } from '../lib/content'
import type { ServiceKey } from '../lib/content'
import FramingScene from './effects/IsometricBlueprintScene.jsx'
import MuddingScene from './effects/MuddingScene.jsx'
import InsulationScene from './effects/InsulationScene.jsx'
import PaintingScene from './effects/PaintingScene.jsx'
import ConcreteScene from './effects/ConcreteScene.jsx'

const sceneByService = {
  framing: FramingScene,
  mudding: MuddingScene,
  insulation: InsulationScene,
  painting: PaintingScene,
  concrete: ConcreteScene,
} satisfies Record<ServiceKey, React.ComponentType>

export function CapabilityLab() {
  const [active, setActive] = useState<ServiceKey>('framing')
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const current = services.find((service) => service.key === active)!
  const CurrentIcon = current.icon
  const ActiveScene = sceneByService[active]

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.innerWidth < 861) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
          .at(0)
        if (!visible) return
        const key = visible.target.getAttribute(
          'data-service',
        ) as ServiceKey | null
        if (key) setActive(key)
      },
      { rootMargin: '-34% 0px -34% 0px', threshold: [0.15, 0.45, 0.7] },
    )

    itemRefs.current.forEach((item) => item && observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="kg-capability-showcase kg-wrap">
      <div className="kg-lab">
        <div className="kg-lab-stage">
          <div className="kg-stage-number" aria-hidden="true">
            {current.number}
          </div>
          <div className="kg-stage-title">
            <CurrentIcon size={21} stroke={1.5} />
            <div>
              <span>{current.short}</span>
              <strong>{current.name}</strong>
            </div>
          </div>
          <div
            className="kg-stage-canvas kg-original-effect"
            aria-label={`${current.name} process animation`}
          >
            <ActiveScene key={active} />
          </div>
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
