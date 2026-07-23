import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, OrbitControls, OrthographicCamera } from '@react-three/drei'
import { useRef } from 'react'

const INK = '#1a1f2c'
const ORANGE = '#cc5520'
const BLUE = '#2a55cc'
const STEEL = '#8ca5b8'
const BOARD = '#f7f3ea'

const studSpec = [
  [-2.75, 4.9],
  [-1.4, 4.3],
  [0, 5.1],
  [1.4, 4.55],
  [2.75, 4.95],
]

const clamp01 = (value) => Math.max(0, Math.min(1, value))
const easeInOut = (value) =>
  value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
const lerp = (from, to, amount) => from + (to - from) * amount

function Stud({ x, height, reference }) {
  return (
    <mesh ref={reference} position={[x, height / 2 - 2.6, 0]}>
      <boxGeometry args={[0.22, height, 0.22]} />
      <meshStandardMaterial color={INK} roughness={0.75} />
      <Edges color="#0c1018" />
    </mesh>
  )
}

function BuildStack() {
  const base = useRef(null)
  const studs = useRef([])
  const leftBoard = useRef(null)
  const rightBoard = useRef(null)
  const seam = useRef(null)
  const finish = useRef(null)
  const patch = useRef(null)

  useFrame(({ clock }) => {
    const time = (clock.getElapsedTime() % 9.6) / 9.6
    const build =
      time < 0.74 ? time / 0.74 : time < 0.88 ? 1 : 1 - (time - 0.88) / 0.12
    const baseP = easeInOut(clamp01(build / 0.19))
    const boardsP = easeInOut(clamp01((build - 0.2) / 0.34))
    const finishP = easeInOut(clamp01((build - 0.58) / 0.3))

    if (base.current) base.current.position.y = lerp(-4.1, -2.48, baseP)
    studs.current.forEach((stud, index) => {
      if (!stud) return
      const [, height] = studSpec[index]
      const stagger = easeInOut(clamp01((build - 0.04 - index * 0.026) / 0.2))
      stud.position.y = lerp(-3.8, height / 2 - 2.6, stagger)
    })
    if (leftBoard.current)
      leftBoard.current.position.x = lerp(-4.45, -1.63, boardsP)
    if (rightBoard.current)
      rightBoard.current.position.x = lerp(4.45, 1.63, boardsP)
    if (seam.current) seam.current.scale.y = Math.max(0.001, boardsP)
    if (finish.current) finish.current.position.x = lerp(4.7, 0.22, finishP)
    if (patch.current) patch.current.position.x = lerp(-4.4, -2.28, finishP)
  })

  return (
    <group rotation={[-0.22, -0.6, 0]} position={[0, 0.42, 0]}>
      <group>
        <mesh ref={base} position={[0, -2.48, -0.2]}>
          <boxGeometry args={[6.4, 0.24, 0.28]} />
          <meshStandardMaterial color={STEEL} roughness={0.65} />
          <Edges color={INK} />
        </mesh>
        {studSpec.map(([x, height], index) => (
          <Stud
            key={x}
            x={x}
            height={height}
            reference={(element) => {
              studs.current[index] = element
            }}
          />
        ))}
      </group>

      <group position={[0, 0, 0.38]}>
        <mesh ref={leftBoard} position={[-1.63, 0, 0]}>
          <boxGeometry args={[3.12, 4.78, 0.15]} />
          <meshStandardMaterial color={BOARD} roughness={0.92} />
          <Edges color={INK} />
        </mesh>
        <mesh ref={rightBoard} position={[1.63, 0, 0]}>
          <boxGeometry args={[3.12, 4.78, 0.15]} />
          <meshStandardMaterial color={BOARD} roughness={0.92} />
          <Edges color={INK} />
        </mesh>
        <mesh ref={seam} position={[0, 0, 0.09]}>
          <boxGeometry args={[0.22, 4.72, 0.018]} />
          <meshStandardMaterial color={BLUE} roughness={0.62} />
        </mesh>
      </group>

      <group ref={finish} position={[0.22, 0, 0.7]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[5.85, 4.2, 0.1]} />
          <meshStandardMaterial color={ORANGE} roughness={0.78} />
          <Edges color={INK} />
        </mesh>
        <mesh ref={patch} position={[-2.28, -1.45, 0.09]}>
          <boxGeometry args={[0.6, 1.26, 0.06]} />
          <meshStandardMaterial color={BLUE} roughness={0.55} />
          <Edges color={INK} />
        </mesh>
      </group>
    </group>
  )
}

export default function HeroBuildScene() {
  return (
    <div className="kg-hero-scene">
      <Canvas dpr={[1, 1.75]} gl={{ antialias: true }} frameloop="always">
        <color attach="background" args={['#f0ebe0']} />
        <ambientLight intensity={1.25} />
        <directionalLight position={[7, 9, 8]} intensity={1.25} />
        <directionalLight
          position={[-6, 3, 5]}
          intensity={0.38}
          color="#b7d8ff"
        />
        <OrthographicCamera
          makeDefault
          position={[8.5, 7.5, 10]}
          zoom={50}
          near={0.1}
          far={100}
        />
        <BuildStack />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={(Math.PI * 3) / 5}
        />
      </Canvas>
    </div>
  )
}
