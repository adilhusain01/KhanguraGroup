import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera, OrbitControls, Edges } from '@react-three/drei'

// ── Dimensions ────────────────────────────────────────────────────────
const FORM_W = 5.0
const FORM_D = 5.0
const FORM_H = 1.0
const WOOD_T = 0.2
const SUPPORT_W = 0.2

const TROWEL_W = 1.2
const TROWEL_D = 0.4
const TROWEL_T = 0.02

// ── Colors ────────────────────────────────────────────────────────────
const BG_COLOR = '#f0ebe0'
const WOOD_COLOR = '#c0986c'
const CONCRETE_COL = '#90959c'
const STEEL_COL = '#8ca5b8'
const HANDLE_COL = '#cc5520'
const REBAR_COL = '#6b584d'
const HOSE_COL = '#2a2d34'
const DARK_EDGE = '#1a1f2c'

// ── Easing helpers ────────────────────────────────────────────────────
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const easeOut = (t) => 1 - (1 - t) ** 3
const easeIn = (t) => t ** 3
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const winP = (t, lo, hi) => clamp01((t - lo) / (hi - lo))
const lerp = (a, b, t) => a + (b - a) * t

// ── Cycle timing ──────────────────────────────────────────────────────
const CYCLE = 8
const W_POUR = [0.05, 0.4]
const W_TROWEL = [0.45, 0.7]
const W_HOLD = [0.7, 0.85]
const W_RESET = [0.85, 1.0]

// ── Formwork (Wooden Mold + Supports + Kickers) ───────────────────────
function Formwork() {
  const supportsX = [-1.8, 0, 1.8]

  return (
    <group>
      <mesh position={[0, FORM_H / 2, FORM_D / 2 + WOOD_T / 2]}>
        <boxGeometry args={[FORM_W + WOOD_T * 2, FORM_H, WOOD_T]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        <Edges color={DARK_EDGE} />
      </mesh>
      <mesh position={[0, FORM_H / 2, -FORM_D / 2 - WOOD_T / 2]}>
        <boxGeometry args={[FORM_W + WOOD_T * 2, FORM_H, WOOD_T]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        <Edges color={DARK_EDGE} />
      </mesh>
      <mesh position={[-FORM_W / 2 - WOOD_T / 2, FORM_H / 2, 0]}>
        <boxGeometry args={[WOOD_T, FORM_H, FORM_D]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        <Edges color={DARK_EDGE} />
      </mesh>
      <mesh position={[FORM_W / 2 + WOOD_T / 2, FORM_H / 2, 0]}>
        <boxGeometry args={[WOOD_T, FORM_H, FORM_D]} />
        <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {/* Vertical Stakes */}
      {supportsX.map((sx, i) => (
        <group key={`sf-${i}`}>
          <mesh
            position={[sx, FORM_H / 2, FORM_D / 2 + WOOD_T + SUPPORT_W / 2]}
          >
            <boxGeometry args={[SUPPORT_W, FORM_H + 0.2, SUPPORT_W]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
            <Edges color={DARK_EDGE} />
          </mesh>
          {/* Angled Kickers Front */}
          <mesh
            position={[sx, FORM_H / 4, FORM_D / 2 + WOOD_T + SUPPORT_W + 0.2]}
            rotation={[-Math.PI / 6, 0, 0]}
          >
            <boxGeometry args={[SUPPORT_W, 0.8, SUPPORT_W]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
            <Edges color={DARK_EDGE} />
          </mesh>
        </group>
      ))}

      {supportsX.map((sx, i) => (
        <group key={`sb-${i}`}>
          <mesh
            position={[sx, FORM_H / 2, -FORM_D / 2 - WOOD_T - SUPPORT_W / 2]}
          >
            <boxGeometry args={[SUPPORT_W, FORM_H + 0.2, SUPPORT_W]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
            <Edges color={DARK_EDGE} />
          </mesh>
          {/* Angled Kickers Back */}
          <mesh
            position={[sx, FORM_H / 4, -FORM_D / 2 - WOOD_T - SUPPORT_W - 0.2]}
            rotation={[Math.PI / 6, 0, 0]}
          >
            <boxGeometry args={[SUPPORT_W, 0.8, SUPPORT_W]} />
            <meshStandardMaterial color={WOOD_COLOR} roughness={0.9} />
            <Edges color={DARK_EDGE} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Rebar Grid ────────────────────────────────────────────────────────
function RebarGrid() {
  const SPACING = 0.6
  const numRebarX = Math.floor(FORM_W / SPACING)
  const numRebarZ = Math.floor(FORM_D / SPACING)
  const startX = -((numRebarX - 1) * SPACING) / 2
  const startZ = -((numRebarZ - 1) * SPACING) / 2

  const rebars = []
  for (let i = 0; i < numRebarX; i++) {
    rebars.push(
      <mesh
        key={`rx-${i}`}
        position={[startX + i * SPACING, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.03, 0.03, FORM_D - 0.2, 8]} />
        <meshStandardMaterial color={REBAR_COL} roughness={1} metalness={0.2} />
        <Edges color={DARK_EDGE} />
      </mesh>,
    )
  }
  for (let i = 0; i < numRebarZ; i++) {
    rebars.push(
      <mesh
        key={`rz-${i}`}
        position={[0, 0.06, startZ + i * SPACING]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.03, 0.03, FORM_W - 0.2, 8]} />
        <meshStandardMaterial color={REBAR_COL} roughness={1} metalness={0.2} />
        <Edges color={DARK_EDGE} />
      </mesh>,
    )
  }

  return <group position={[0, FORM_H * 0.4, 0]}>{rebars}</group>
}

// ── Concrete Float / Trowel ───────────────────────────────────────────
function Trowel({ groupRef }) {
  return (
    <group ref={groupRef}>
      <group position={[0, FORM_H + TROWEL_T / 2 + 0.02, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[TROWEL_W, TROWEL_T, TROWEL_D]} />
          <meshStandardMaterial
            color={STEEL_COL}
            metalness={0.7}
            roughness={0.3}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, TROWEL_T + 0.02, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.1]} />
          <meshStandardMaterial
            color={STEEL_COL}
            metalness={0.7}
            roughness={0.3}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, TROWEL_T + 0.1, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial
            color={STEEL_COL}
            metalness={0.7}
            roughness={0.3}
          />
          <Edges color={DARK_EDGE} />
        </mesh>
        <mesh position={[0, TROWEL_T + 0.18, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.14]} />
          <meshStandardMaterial color={HANDLE_COL} roughness={0.8} />
          <Edges color={DARK_EDGE} />
        </mesh>
      </group>
    </group>
  )
}

// ── Main Scene ────────────────────────────────────────────────────────
function ConcreteLogic() {
  const concreteRef = useRef()
  const trowelRef = useRef()
  const concreteMatRef = useRef()
  const hoseRef = useRef()
  const streamRef = useRef()
  const clock = useRef(0)

  const TROWEL_START = -FORM_D / 2 + TROWEL_D / 2 + 0.1
  const TROWEL_END = FORM_D / 2 - TROWEL_D / 2 - 0.1

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE
    const t = clock.current / CYCLE

    // ── Concrete Pour (Scale Y) ──
    if (concreteRef.current) {
      let fillP = 0
      if (t <= W_POUR[1]) {
        fillP = easeOut(winP(t, W_POUR[0], W_POUR[1]))
      } else if (t <= W_RESET[0]) {
        fillP = 1
      } else {
        fillP = 1 - easeInOut(winP(t, W_RESET[0], W_RESET[1]))
      }
      const h = Math.max(0.001, fillP * FORM_H)
      concreteRef.current.scale.y = h
      concreteRef.current.position.y = h / 2
    }

    // ── Concrete Hose & Stream ──
    if (hoseRef.current && streamRef.current) {
      if (t > W_POUR[0] - 0.05 && t < W_POUR[1] + 0.05) {
        // Hose swoops in
        hoseRef.current.position.y = lerp(
          8,
          3.5,
          easeOut(winP(t, W_POUR[0] - 0.05, W_POUR[0] + 0.02)),
        )

        if (t > W_POUR[0] && t < W_POUR[1]) {
          streamRef.current.visible = true
          // Pulsating stream
          streamRef.current.scale.y = 1 + Math.sin(t * Math.PI * 40) * 0.15
          streamRef.current.scale.x = 1 + Math.cos(t * Math.PI * 30) * 0.1
          streamRef.current.scale.z = 1 + Math.sin(t * Math.PI * 30) * 0.1
        } else {
          streamRef.current.visible = false
        }
      } else {
        // Hose swoops out
        hoseRef.current.position.y = lerp(
          3.5,
          8,
          easeIn(winP(t, W_POUR[1] + 0.05, W_POUR[1] + 0.1)),
        )
        streamRef.current.visible = false
      }
    }

    // ── Trowel Sweep (Position Z) ──
    if (trowelRef.current) {
      const W_IN = [0.4, 0.45]
      const W_OUT = [0.7, 0.75]

      if (t > W_IN[0] && t < W_OUT[1]) {
        trowelRef.current.visible = true
        let tz = TROWEL_START
        let ty = 5.0

        if (t <= W_IN[1]) {
          tz = TROWEL_START
          ty = lerp(5.0, 0.0, easeOut(winP(t, W_IN[0], W_IN[1])))
        } else if (t <= W_TROWEL[1]) {
          tz = lerp(
            TROWEL_START,
            TROWEL_END,
            easeInOut(winP(t, W_TROWEL[0], W_TROWEL[1])),
          )
          ty = 0.0
        } else {
          tz = TROWEL_END
          ty = lerp(0.0, 5.0, easeIn(winP(t, W_OUT[0], W_OUT[1])))
        }

        trowelRef.current.position.z = tz
        trowelRef.current.position.y = ty

        if (t > W_TROWEL[0] && t < W_TROWEL[1]) {
          trowelRef.current.rotation.x = -0.06
        } else {
          trowelRef.current.rotation.x = 0
        }
      } else {
        trowelRef.current.visible = false
      }
    }

    // ── Finish Transition (Rough -> Smooth) ──
    if (concreteMatRef.current) {
      const finishP = winP(t, W_TROWEL[0], W_TROWEL[1])
      const resetP = winP(t, W_RESET[0], W_RESET[1])
      // Roughness interpolates from 0.8 (raw) down to 0.15 (glass smooth)
      concreteMatRef.current.roughness =
        lerp(0.8, 0.15, finishP) + 0.65 * resetP
      // Add slight metallic sheen when finished
      concreteMatRef.current.metalness =
        lerp(0.05, 0.25, finishP) - 0.2 * resetP
    }
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

      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[FORM_W + 1.5, 0.04, FORM_D + 1.5]} />
        <meshStandardMaterial color="#d0c8c0" roughness={1} />
        <Edges color={DARK_EDGE} />
      </mesh>

      <Formwork />
      <RebarGrid />

      {/* ── Concrete Hose ── */}
      <group ref={hoseRef} position={[0, 8, 0]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 4, 12]} />
          <meshStandardMaterial color={HOSE_COL} roughness={0.8} />
          <Edges color={DARK_EDGE} />
        </mesh>
        {/* Metal nozzle */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.2, 12]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Stream */}
        <mesh ref={streamRef} position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 3.6, 8]} />
          <meshStandardMaterial color={CONCRETE_COL} roughness={0.8} />
        </mesh>
      </group>

      {/* Concrete Block */}
      <mesh ref={concreteRef}>
        <boxGeometry args={[FORM_W - 0.02, 1, FORM_D - 0.02]} />
        <meshStandardMaterial
          ref={concreteMatRef}
          color={CONCRETE_COL}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>

      <Trowel groupRef={trowelRef} />
    </>
  )
}

// ── Root ──────────────────────────────────────────────────────────────
export default function ConcreteScene() {
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
          position={[14, 12, 14]}
          zoom={65}
          near={0.1}
          far={200}
        />

        <ConcreteLogic />

        <OrbitControls enablePan={false} enableRotate enableZoom={false} />
      </Canvas>
    </div>
  )
}
