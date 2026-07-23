import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, OrbitControls, Edges } from '@react-three/drei'

// A vertical wall makes the service read as drywall finishing—not flooring.
const BOARD_W = 3.1
const BOARD_H = 5.6
const BOARD_T = 0.15
const SEAM_GAP = 0.075
const MUD_W = 0.9
const KNIFE_W = 1.18
const KNIFE_H = 0.45
const KNIFE_T = 0.035

const BG_COLOR = '#f0ebe0'
const DRYWALL_COL = '#a99f92'
const MUD_COL = '#f7f3ea'
const TAPE_COL = '#edbf38'
const BLADE_COL = '#8ca5b8'
const HANDLE_COL = '#cc5520'
const DARK_EDGE = '#1a1f2c'

const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const easeIn = (t) => t ** 3
const clamp01 = (value) => Math.max(0, Math.min(1, value))
const winP = (t, lo, hi) => clamp01((t - lo) / (hi - lo))
const lerp = (a, b, t) => a + (b - a) * t

const CYCLE = 8
const W_SWEEP = [0.04, 0.5]
const W_HOLD = [0.5, 0.67]
const W_RESET = [0.67, 0.77]
const W_RETURN = [0.77, 1.0]

function Boards() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (BOARD_W / 2 + SEAM_GAP / 2), 0, 0]}>
          <boxGeometry args={[BOARD_W, BOARD_H, BOARD_T]} />
          <meshStandardMaterial color={DRYWALL_COL} roughness={0.95} />
          <Edges color={DARK_EDGE} />
        </mesh>
      ))}
    </group>
  )
}

function TapingKnife({ groupRef }) {
  return (
    <group ref={groupRef}>
      <group position={[0, 0, BOARD_T / 2 + 0.12]} rotation={[0.12, 0, 0]}>
        <mesh position={[0, KNIFE_H / 2, 0]}>
          <boxGeometry args={[KNIFE_W, KNIFE_H, KNIFE_T]} />
          <meshStandardMaterial
            color={BLADE_COL}
            metalness={0.78}
            roughness={0.26}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, KNIFE_H + 0.09, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.1]} />
          <meshStandardMaterial
            color={BLADE_COL}
            metalness={0.72}
            roughness={0.25}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, KNIFE_H + 0.38, 0]}>
          <boxGeometry args={[0.28, 0.46, 0.15]} />
          <meshStandardMaterial color={HANDLE_COL} roughness={0.76} />
          <Edges color={DARK_EDGE} />
        </mesh>
      </group>
    </group>
  )
}

function MudScene() {
  const knifeRef = useRef()
  const mudRef = useRef()
  const tapeRef = useRef()
  const mudMats = useRef([])
  const tapeMat = useRef()
  const clock = useRef(0)
  const Y_START = -BOARD_H / 2 - 0.65
  const Y_END = BOARD_H / 2 + 0.38

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE
    const t = clock.current / CYCLE
    const knifeY =
      t <= W_SWEEP[1]
        ? lerp(Y_START, Y_END, easeInOut(winP(t, W_SWEEP[0], W_SWEEP[1])))
        : t <= W_RETURN[0]
          ? Y_END
          : lerp(Y_END, Y_START, easeInOut(winP(t, W_RETURN[0], W_RETURN[1])))

    if (knifeRef.current) knifeRef.current.position.y = knifeY

    const mudStart = -BOARD_H / 2
    const mudEnd = Math.min(BOARD_H / 2, knifeY)
    const mudLength = Math.max(0.001, mudEnd - mudStart)
    const tapeEnd = Math.min(BOARD_H / 2, knifeY + 0.42)
    const tapeLength = Math.max(0.001, tapeEnd - mudStart)

    if (mudRef.current) {
      mudRef.current.scale.y = mudLength
      mudRef.current.position.y = mudStart + mudLength / 2
    }
    if (tapeRef.current) {
      tapeRef.current.scale.y = tapeLength
      tapeRef.current.position.y = mudStart + tapeLength / 2
    }

    const resetP = easeIn(winP(t, W_RESET[0], W_RESET[1]))
    mudMats.current.forEach((material, index) => {
      if (material) material.opacity = [0.52, 0.72, 0.95][index] * (1 - resetP)
    })
    if (tapeMat.current) tapeMat.current.opacity = 0.9 * (1 - resetP)
  })

  return (
    <>
      <ambientLight intensity={1.4} color="#fff8f0" />
      <directionalLight
        position={[10, 16, 10]}
        intensity={0.68}
        color="#ffe8c8"
      />
      <directionalLight
        position={[-8, 8, 7]}
        intensity={0.35}
        color="#d8e8f8"
      />
      <Boards />

      <mesh ref={tapeRef} position={[0, 0, BOARD_T / 2 + 0.007]}>
        <boxGeometry args={[0.38, 1, 0.008]} />
        <meshStandardMaterial
          ref={tapeMat}
          color={TAPE_COL}
          transparent
          opacity={0.9}
          roughness={0.8}
        />
      </mesh>

      <group ref={mudRef} position={[0, 0, BOARD_T / 2 + 0.015]}>
        {[1, 0.7, 0.4].map((width, index) => (
          <mesh key={width} position={[0, 0, index * 0.006]}>
            <boxGeometry args={[MUD_W * width, 1, 0.012]} />
            <meshStandardMaterial
              ref={(element) => {
                mudMats.current[index] = element
              }}
              color={MUD_COL}
              transparent
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        ))}
      </group>

      <TapingKnife groupRef={knifeRef} />
    </>
  )
}

export default function MuddingScene() {
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
          position={[9, 6.5, 11]}
          zoom={78}
          near={0.1}
          far={200}
        />
        <MudScene />
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
