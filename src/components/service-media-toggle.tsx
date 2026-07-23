import { useState } from 'react'
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

const photoByService = {
  framing: {
    src: '/services/steel-stud-framing.png',
    alt: 'Illustrative view of steel stud framing inside a construction interior.',
  },
  mudding: {
    src: '/services/drywall-taping-mudding.png',
    alt: 'Illustrative view of drywall taping and mudding work.',
  },
  insulation: {
    src: '/services/insulation.png',
    alt: 'Illustrative view of insulation being installed between framing.',
  },
  painting: {
    src: '/services/painting.png',
    alt: 'Illustrative view of a wall being painted with a roller.',
  },
  concrete: {
    src: '/services/concrete-services.png',
    alt: 'Illustrative view of a concrete surface being finished.',
  },
} satisfies Record<ServiceKey, { src: string; alt: string }>

export function isServiceKey(value: string): value is ServiceKey {
  return value in photoByService
}

export function ServiceMediaToggle({
  serviceKey,
  variant,
}: {
  serviceKey: ServiceKey
  variant: 'stage' | 'detail'
}) {
  const [view, setView] = useState<'photo' | 'process'>('photo')
  const photo = photoByService[serviceKey]
  const ActiveScene = sceneByService[serviceKey]

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
            ? photo.alt
            : `${serviceKey} construction process animation`
        }
      >
        {view === 'photo' ? (
          <img
            className="kg-service-media-photo"
            src={photo.src}
            alt={photo.alt}
          />
        ) : (
          <ActiveScene key={serviceKey} />
        )}
      </div>
    </div>
  )
}
