import { useEffect, useState } from 'react'
import { IconCamera, IconCube } from '@tabler/icons-react'
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

const photosByService = {
  framing: {
    src: '/services/steel-stud-framing-01.webp',
    alt: 'Illustrative view of steel stud framing inside a construction interior.',
  },
  mudding: {
    src: '/services/drywall-taping-mudding-01.webp',
    alt: 'Illustrative view of drywall taping and mudding work.',
  },
  insulation: {
    src: '/services/insulation-01.webp',
    alt: 'Illustrative view of insulation being installed between framing.',
  },
  painting: {
    src: '/services/painting-01.webp',
    alt: 'Illustrative view of a wall being painted with a roller.',
  },
  concrete: {
    src: '/services/concrete-services-01.webp',
    alt: 'Illustrative view of a concrete surface being finished.',
  },
} satisfies Record<ServiceKey, { src: string; alt: string }>

const alternatePhotoByService = {
  framing: {
    src: '/services/steel-stud-framing-02.webp',
    alt: 'Illustrative alternate view of steel stud framing in a construction interior.',
  },
  mudding: {
    src: '/services/drywall-taping-mudding-02.webp',
    alt: 'Illustrative alternate view of drywall taping and mudding work.',
  },
  insulation: {
    src: '/services/insulation-02.webp',
    alt: 'Illustrative alternate view of insulation being installed between framing.',
  },
  painting: {
    src: '/services/painting-02.webp',
    alt: 'Illustrative alternate view of professional interior painting.',
  },
  concrete: {
    src: '/services/concrete-services-02.webp',
    alt: 'Illustrative alternate view of concrete finishing work.',
  },
} satisfies Record<ServiceKey, { src: string; alt: string }>

export const servicePhotoSources = [
  ...Object.values(photosByService),
  ...Object.values(alternatePhotoByService),
].map(({ src }) => src)

export function isServiceKey(value: string): value is ServiceKey {
  return value in photosByService
}

export function ServiceMediaToggle({
  serviceKey,
  variant,
}: {
  serviceKey: ServiceKey
  variant: 'stage' | 'detail'
}) {
  const [view, setView] = useState<'photo' | 'process'>('photo')
  const [photoIndex, setPhotoIndex] = useState(0)
  const photos = [
    photosByService[serviceKey],
    alternatePhotoByService[serviceKey],
  ]
  const ActiveScene = sceneByService[serviceKey]

  useEffect(() => {
    setPhotoIndex(0)
    if (
      view !== 'photo' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return

    const timer = window.setInterval(() => {
      setPhotoIndex((current) => (current + 1) % photos.length)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [photos.length, serviceKey, view])

  return (
    <div className={`kg-service-media kg-service-media--${variant}`}>
      <div
        className="kg-service-view-switch"
        role="group"
        aria-label="View mode"
      >
        <button
          type="button"
          aria-pressed={view === 'photo'}
          onClick={() => setView('photo')}
        >
          <IconCamera size={15} stroke={1.8} />
          Site view
        </button>
        <button
          type="button"
          aria-pressed={view === 'process'}
          onClick={() => setView('process')}
        >
          <IconCube size={15} stroke={1.8} />
          Process view
        </button>
      </div>
      <div
        className={`kg-service-media-frame ${view === 'process' ? 'kg-original-effect' : ''}`}
        aria-label={
          view === 'photo'
            ? photos[photoIndex].alt
            : `${serviceKey} construction process animation`
        }
      >
        {view === 'photo' ? (
          <div className="kg-service-media-photo-stack">
            {photos.map((photo, index) => (
              <img
                className="kg-service-media-photo"
                key={photo.src}
                src={photo.src}
                alt={index === photoIndex ? photo.alt : ''}
                aria-hidden={index !== photoIndex}
                data-active={index === photoIndex}
              />
            ))}
          </div>
        ) : (
          <ActiveScene key={serviceKey} />
        )}
      </div>
    </div>
  )
}
