import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, OrbitControls, Edges } from '@react-three/drei'
import * as THREE from 'three'

// ── Wall Dimensions (in scene units) ─────────────────────────────────────────
const WALL_W = 6.0
const WALL_H = 3.4
const STUD_W = 0.12
const STUD_D = 0.28
const PLATE_H = 0.12

const NUM_STUDS = 5
const STUD_NET_H = WALL_H - PLATE_H * 2
const BAY_W = (WALL_W - NUM_STUDS * STUD_W) / (NUM_STUDS - 1)

const STUD_X = Array.from(
  { length: NUM_STUDS },
  (_, i) => -WALL_W / 2 + (i / (NUM_STUDS - 1)) * WALL_W,
)

const BAY_X = Array.from(
  { length: NUM_STUDS - 1 },
  (_, i) => STUD_X[i] + STUD_W / 2 + BAY_W / 2,
)

const FLOOR_Y = -WALL_H / 2 - PLATE_H / 2

// ── Colors ───────────────────────────────────────────────────────────────────
const BG_COLOR = '#f0ebe0'
const WOOD_COLOR = '#c0986c'
const PINK_INSUL = '#eda84a'
const PAPER_COL = '#d7b970'
const DARK_EDGE = '#1a1f2c'
const GUN_COL = '#334455'

// ── Materials ────────────────────────────────────────────────────────────────
const WOOD_MAT = { color: WOOD_COLOR, metalness: 0.1, roughness: 0.85 }
const INSUL_MAT = { color: PINK_INSUL, metalness: 0.0, roughness: 1.0 }

// ── Easing & Helpers ─────────────────────────────────────────────────────────
const easeOut = (t) => 1 - (1 - t) ** 3
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const winP = (t, lo, hi) => clamp01((t - lo) / (hi - lo))
const lerp = (a, b, t) => a + (b - a) * t

// ── Cycle Timing ─────────────────────────────────────────────────────────────
const CYCLE = 8
const W_FILL = [0.05, 0.55]
const W_HOLD = [0.55, 0.75]
const W_OUT = [0.75, 0.95]

const BATT_GAP = (W_FILL[1] - W_FILL[0] - 0.2) / (BAY_X.length - 1)
const BATT_DUR = 0.2

// ── Staple Gun ───────────────────────────────────────────────────────────────
function StapleGun({ gunRef, xPos }) {
  return (
    <group ref={gunRef} position={[xPos, 0, STUD_D / 2 + 0.04]}>
      <group rotation={[Math.PI / 8, Math.PI / 4, 0]}>
        {/* Gun Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.2, 0.14, 0.06]} />
          <meshStandardMaterial
            color={GUN_COL}
            metalness={0.7}
            roughness={0.3}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        {/* Handle */}
        <mesh position={[-0.05, 0.1, 0]}>
          <boxGeometry args={[0.06, 0.15, 0.05]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          <Edges color={DARK_EDGE} />
        </mesh>
      </group>
    </group>
  )
}

// ── Main Scene ────────────────────────────────────────────────────────────────
function Scene() {
  const battRefs = useRef([])
  const gunRefs = useRef([])
  const clock = useRef(0)

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE
    const t = clock.current / CYCLE

    const outP = easeInOut(winP(t, W_OUT[0], W_OUT[1]))

    battRefs.current.forEach((batt, i) => {
      if (!batt) return
      const lo = W_FILL[0] + i * BATT_GAP
      const fillP = easeOut(winP(t, lo, lo + BATT_DUR)) * (1 - outP)

      const h = Math.max(0.001, fillP * STUD_NET_H)
      batt.scale.y = h
      batt.position.y = WALL_H / 2 - PLATE_H - h / 2
    })

    gunRefs.current.forEach((gun, i) => {
      if (!gun) return
      const lo = W_FILL[0] + i * BATT_GAP
      const hi = lo + BATT_DUR
      const fillP = easeOut(winP(t, lo, hi)) * (1 - outP)

      // Staple gun swoops down along with the batt
      if (t > lo - 0.02 && t < hi + 0.05) {
        gun.visible = true
        const h = Math.max(0.001, fillP * STUD_NET_H)
        gun.position.y = WALL_H / 2 - PLATE_H - h + 0.1

        // Jitter simulation (stapling)
        const isStapling = t > lo && t < hi
        if (isStapling) {
          gun.position.z = STUD_D / 2 + 0.04 + Math.sin(t * Math.PI * 60) * 0.01
        } else {
          gun.position.z = lerp(gun.position.z, STUD_D / 2 + 0.04, 0.1)
        }
      } else {
        gun.visible = false
      }
    })
  })

  return (
    <>
      <ambientLight intensity={1.4} color="#fff8f0" />
      <directionalLight
        position={[10, 16, 10]}
        intensity={0.65}
        color="#ffe8c8"
      />
      <directionalLight
        position={[-8, 8, -6]}
        intensity={0.35}
        color="#d8e8f8"
      />
      <directionalLight position={[0, -4, 10]} intensity={0.12} />

      <mesh position={[0, -WALL_H / 2 + PLATE_H / 2, 0]}>
        <boxGeometry args={[WALL_W, PLATE_H, STUD_D]} />
        <meshStandardMaterial {...WOOD_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      <mesh position={[0, WALL_H / 2 - PLATE_H / 2, 0]}>
        <boxGeometry args={[WALL_W, PLATE_H, STUD_D]} />
        <meshStandardMaterial {...WOOD_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {STUD_X.map((x, i) => (
        <mesh key={`stud-${i}`} position={[x, 0, 0]}>
          <boxGeometry args={[STUD_W, STUD_NET_H, STUD_D]} />
          <meshStandardMaterial {...WOOD_MAT} />
          <Edges color={DARK_EDGE} />
        </mesh>
      ))}

      {BAY_X.map((x, i) => (
        <group key={`bay-${i}`}>
          {/* Insulation Batt Group */}
          <group
            ref={(el) => {
              battRefs.current[i] = el
            }}
            position={[x, 0, 0]}
          >
            {/* Layered fiberglass volume: its color stays visible between the paper flanges. */}
            <mesh position={[0, 0, -0.01]}>
              <boxGeometry args={[BAY_W - 0.02, 1, STUD_D - 0.02]} />
              <meshStandardMaterial {...INSUL_MAT} />
              <Edges color={DARK_EDGE} />
            </mesh>
            <mesh position={[0.01, 0, -0.03]}>
              <boxGeometry args={[BAY_W - 0.04, 1, STUD_D - 0.04]} />
              <meshStandardMaterial {...INSUL_MAT} />
            </mesh>
            <mesh position={[-0.01, 0, -0.02]}>
              <boxGeometry args={[BAY_W - 0.03, 1, STUD_D - 0.03]} />
              <meshStandardMaterial {...INSUL_MAT} />
            </mesh>

            {/* Kraft-paper flanges—only at the studs, as on a real faced batt. */}
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[
                  side * (BAY_W / 2 + STUD_W / 2 - 0.035),
                  0,
                  STUD_D / 2 - 0.005,
                ]}
              >
                <boxGeometry args={[0.07, 1, 0.008]} />
                <meshStandardMaterial color={PAPER_COL} roughness={0.9} />
                <Edges color={DARK_EDGE} />
              </mesh>
            ))}
            {[0.25, 0.5, 0.75].map((fraction) => (
              <mesh
                key={fraction}
                position={[0, 0.5 - fraction, STUD_D / 2 + 0.001]}
              >
                <boxGeometry args={[BAY_W - 0.12, 0.018, 0.006]} />
                <meshBasicMaterial color="#d88832" />
              </mesh>
            ))}
          </group>

          {/* Staple Gun */}
          <StapleGun
            gunRef={(el) => {
              gunRefs.current[i] = el
            }}
            xPos={x}
          />
        </group>
      ))}
    </>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function InsulationScene() {
  return (
    <div style={{ width: '100%', height: '100%', background: BG_COLOR }}>
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        frameloop="always"
      >
        <color attach="background" args={[BG_COLOR]} />

        <OrthographicCamera
          makeDefault
          position={[10, 10, 10]}
          zoom={80}
          near={0.1}
          far={200}
        />

        <Scene />

        <OrbitControls enablePan={false} enableRotate enableZoom={false} />
      </Canvas>
    </div>
  )
}
