import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'

// An upright wall gives the roller, paint tray, and finished surface a clear first read.
const WALL_W = 6.8
const WALL_H = 4.8
const SURF_T = 0.06
const NUM_STRIPS = 28
const STRIP_W = WALL_W / NUM_STRIPS
const STRIP_X = Array.from(
  { length: NUM_STRIPS },
  (_, index) => -WALL_W / 2 + (index + 0.5) * STRIP_W,
)

const ROLLER_R = 0.24
const ROLLER_L = 2.15
const ROLLER_Z = SURF_T / 2 + ROLLER_R
const RX_START = -WALL_W / 2 - 0.95
const RX_END = WALL_W / 2 + 0.95

const BG_COLOR = '#f0ebe0'
const UNPAINTED = new THREE.Color('#a59c90')
const PAINTED = new THREE.Color('#cc5520')
const ROLLER_COL = '#9ab2c4'
const HANDLE_COL = '#586070'
const GRIP_COL = '#252e3e'
const DARK_EDGE = '#1a1f2c'

const easeOut = (t) => 1 - (1 - t) ** 3
const easeIn = (t) => t ** 3
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (value) => Math.max(0, Math.min(1, value))
const winP = (t, lo, hi) => clamp01((t - lo) / (hi - lo))
const lerp = (a, b, t) => a + (b - a) * t

const CYCLE = 9
const W_SWEEP = [0.04, 0.56]
const W_HOLD = [0.56, 0.69]
const W_RESET = [0.69, 0.82]
const W_RETURN = [0.82, 1]

function Props() {
  const floorY = -WALL_H / 2 - 0.32
  return (
    <group>
      <mesh position={[0, floorY, 1.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WALL_W + 3.4, 3.7]} />
        <meshStandardMaterial color="#e6e1d6" roughness={1} />
        <Edges color={DARK_EDGE} />
      </mesh>
      <group position={[-WALL_W / 2 - 1.05, floorY + 0.08, 1.05]}>
        <mesh>
          <boxGeometry args={[1.15, 0.16, 1.22]} />
          <meshStandardMaterial color="#303540" roughness={0.82} />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.86, 0.025, 0.96]} />
          <meshStandardMaterial color={PAINTED} roughness={0.16} />
        </mesh>
      </group>
    </group>
  )
}

function PaintSurface({ matRefs }) {
  return (
    <group>
      {STRIP_X.map((x, index) => (
        <mesh key={index} position={[x, 0, 0]}>
          <boxGeometry args={[STRIP_W - 0.003, WALL_H, SURF_T]} />
          <meshStandardMaterial
            ref={(element) => {
              matRefs.current[index] = element
            }}
            color={UNPAINTED}
            roughness={0.86}
            metalness={0.02}
          />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[WALL_W + 0.012, WALL_H + 0.012, SURF_T + 0.016]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color={DARK_EDGE} />
      </mesh>
    </group>
  )
}

function PaintRoller({ groupRef }) {
  return (
    <group ref={groupRef}>
      <mesh>
        <cylinderGeometry args={[ROLLER_R, ROLLER_R, ROLLER_L, 28]} />
        <meshStandardMaterial
          color={PAINTED}
          roughness={0.56}
          metalness={0.04}
        />
        <Edges color={DARK_EDGE} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, (side * ROLLER_L) / 2, 0]}>
          <cylinderGeometry
            args={[ROLLER_R + 0.012, ROLLER_R + 0.012, 0.03, 20]}
          />
          <meshStandardMaterial
            color={ROLLER_COL}
            metalness={0.84}
            roughness={0.18}
          />
        </mesh>
      ))}
      <mesh
        position={[0, ROLLER_L / 2 + 0.08, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.035, 0.035, 1.0, 10]} />
        <meshStandardMaterial
          color={HANDLE_COL}
          metalness={0.78}
          roughness={0.28}
        />
        <Edges color={DARK_EDGE} />
      </mesh>
      <mesh
        position={[0, ROLLER_L / 2 + 0.08, 1.18]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.07, 0.07, 0.48, 12]} />
        <meshStandardMaterial color={GRIP_COL} roughness={0.9} />
        <Edges color={DARK_EDGE} />
      </mesh>
    </group>
  )
}

function PaintScene() {
  const rollerRef = useRef()
  const matRefs = useRef([])
  const clock = useRef(0)

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE
    const t = clock.current / CYCLE
    const rx =
      t <= W_SWEEP[1]
        ? lerp(RX_START, RX_END, easeInOut(winP(t, W_SWEEP[0], W_SWEEP[1])))
        : t <= W_RETURN[0]
          ? RX_END
          : lerp(RX_END, RX_START, easeIn(winP(t, W_RETURN[0], W_RETURN[1])))

    if (rollerRef.current) {
      rollerRef.current.position.x = rx
      rollerRef.current.position.z = ROLLER_Z
      rollerRef.current.position.y =
        t <= W_SWEEP[1]
          ? Math.sin(winP(t, W_SWEEP[0], W_SWEEP[1]) * Math.PI * 4) * 0.72
          : 0
    }

    const resetP = easeInOut(winP(t, W_RESET[0], W_RESET[1]))
    matRefs.current.forEach((material, index) => {
      if (!material) return
      const paintP = easeOut(
        clamp01((rx - STRIP_X[index] + STRIP_W) / (STRIP_W * 2)),
      )
      material.color.lerpColors(UNPAINTED, PAINTED, paintP * (1 - resetP))
      const dryFactor = clamp01(Math.max(0, rx - STRIP_X[index]) / 3)
      const paintedRoughness = lerp(0.14, 0.58, dryFactor)
      material.roughness = lerp(0.86, paintedRoughness, paintP * (1 - resetP))
    })
  })

  return (
    <>
      <ambientLight intensity={1.4} color="#fff8f0" />
      <directionalLight
        position={[10, 16, 10]}
        intensity={0.7}
        color="#ffe8c8"
      />
      <directionalLight
        position={[-8, 8, 7]}
        intensity={0.35}
        color="#d8e8f8"
      />
      <Props />
      <PaintSurface matRefs={matRefs} />
      <PaintRoller groupRef={rollerRef} />
    </>
  )
}

export default function PaintingScene() {
  return (
    <div style={{ width: '100%', height: '100vh', background: BG_COLOR }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <color attach="background" args={[BG_COLOR]} />
        <OrthographicCamera
          makeDefault
          position={[9, 6.5, 12]}
          zoom={76}
          near={0.1}
          far={200}
        />
        <PaintScene />
        <OrbitControls
          enablePan={false}
          enableRotate
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
