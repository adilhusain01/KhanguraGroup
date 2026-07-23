import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrthographicCamera,
  OrbitControls,
  Edges,
  Grid,
} from '@react-three/drei'
import * as THREE from 'three'

// ── Wall Dimensions (in scene units) ─────────────────────────────────────────
const WALL_W = 6.0 // total wall width
const WALL_H = 3.4 // floor-to-ceiling
const PLATE_T = 0.11 // U-track thickness
const PLATE_D = 0.42 // U-track depth
const STUD_D = 0.4 // stud depth (3.5" real scale)
const FLANGE_W = 0.18 // C-channel flange width
const WEB_T = 0.038 // steel thickness

const NUM_STUDS = 9
const STUD_NET_H = WALL_H - PLATE_T * 2 // stud height between tracks

// X positions for each stud
const STUD_X = Array.from(
  { length: NUM_STUDS },
  (_, i) => -WALL_W / 2 + (i / (NUM_STUDS - 1)) * WALL_W,
)

const FLOOR_Y = -WALL_H / 2 - PLATE_T / 2
const STUD_END_Y = 0
const STUD_START_Y = FLOOR_Y - STUD_NET_H / 2 - 0.1 // starts below floor

// ── Easing & Helpers ─────────────────────────────────────────────────────────
const easeOut = (t) => 1 - (1 - t) ** 3
const easeIn = (t) => t * t * t
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const winP = (t, lo, hi) => clamp01((t - lo) / (hi - lo))

// ── Cycle Timing (normalized 0–1 within CYCLE seconds) ───────────────────────
const CYCLE = 10
const W_BPLATE = [0.0, 0.09]
const W_STUDS = [0.12, 0.6]
const W_TPLATE = [0.62, 0.72]
const W_HOLD = [0.72, 0.84]
const W_OUT = [0.84, 0.98]

const STUD_ANIM_START = W_STUDS[0]
const STUD_GAP = (W_STUDS[1] - W_STUDS[0] - 0.1) / (NUM_STUDS - 1)
const STUD_DUR = 0.1

// ── Colors ────────────────────────────────────────────────────────────────────
const BG_COLOR = '#f0ebe0'
const STUD_COLOR = '#8ca5b8'
const STUD_SHADE = '#6e8fa8'
const TRACK_COLOR = '#c49a5a'
const TRACK_SHADE = '#a07a3a'
const DARK_EDGE = '#1a1f2c'
const BOX_LINE = '#2a55cc'
const LASER_COLOR = '#ff1133'
const SCREW_COLOR = '#e0e0e0'

// ── Shared Materials ──────────────────────────────────────────────────────────
const STUD_MAT = { color: STUD_COLOR, metalness: 0.6, roughness: 0.35 }
const SHADE_MAT = { color: STUD_SHADE, metalness: 0.6, roughness: 0.4 }
const TRACK_MAT = { color: TRACK_COLOR, metalness: 0.5, roughness: 0.5 }

// ── Fastener (Screw Head) ─────────────────────────────────────────────────────
function Screw({ position }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
      <meshStandardMaterial
        color={SCREW_COLOR}
        metalness={0.9}
        roughness={0.2}
      />
      <Edges color={DARK_EDGE} />
    </mesh>
  )
}

// ── C-Stud (web + two flanges + knockouts + screws) ───────────────────────────
function CStud() {
  const knockouts = [-0.8, 0, 0.8] // Y offsets for plumbing/electrical knockouts

  return (
    <group>
      {/* Web (main depth plate along Z) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[WEB_T, STUD_NET_H, STUD_D]} />
        <meshStandardMaterial {...STUD_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {/* Front Flange */}
      <mesh position={[FLANGE_W / 2, 0, STUD_D / 2 - WEB_T / 2]}>
        <boxGeometry args={[FLANGE_W, STUD_NET_H, WEB_T]} />
        <meshStandardMaterial {...SHADE_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {/* Back Flange */}
      <mesh position={[FLANGE_W / 2, 0, -STUD_D / 2 + WEB_T / 2]}>
        <boxGeometry args={[FLANGE_W, STUD_NET_H, WEB_T]} />
        <meshStandardMaterial {...SHADE_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {/* Knockouts (dark simulated holes in the web) */}
      {knockouts.map((ky, i) => (
        <group key={`ko-${i}`} position={[0, ky, 0]}>
          <mesh position={[WEB_T / 2 + 0.002, 0, 0]}>
            <boxGeometry args={[0.001, 0.35, 0.12]} />
            <meshBasicMaterial color={DARK_EDGE} />
          </mesh>
          <mesh position={[-WEB_T / 2 - 0.002, 0, 0]}>
            <boxGeometry args={[0.001, 0.35, 0.12]} />
            <meshBasicMaterial color={DARK_EDGE} />
          </mesh>
        </group>
      ))}

      {/* Screws (Bottom track connection) */}
      <Screw
        position={[
          FLANGE_W / 2,
          -STUD_NET_H / 2 + 0.06,
          STUD_D / 2 + WEB_T / 2,
        ]}
      />
      {/* Screws (Top track connection) */}
      <Screw
        position={[FLANGE_W / 2, STUD_NET_H / 2 - 0.06, STUD_D / 2 + WEB_T / 2]}
      />
    </group>
  )
}

// ── Main Scene ────────────────────────────────────────────────────────────────
function FrameScene() {
  const bPlateRef = useRef()
  const tPlateRef = useRef()
  const studRefs = useRef([])
  const laserRef = useRef()
  const clock = useRef(0)

  useFrame((_, delta) => {
    clock.current = (clock.current + delta) % CYCLE
    const t = clock.current / CYCLE
    const outP = easeInOut(winP(t, W_OUT[0], W_OUT[1]))

    // ── Bottom U-track ──
    if (bPlateRef.current) {
      const sX = Math.max(
        1e-4,
        easeOut(winP(t, W_BPLATE[0], W_BPLATE[1])) * (1 - outP),
      )
      bPlateRef.current.scale.x = sX
      bPlateRef.current.position.x = -WALL_W / 2 + (sX * WALL_W) / 2
    }

    // ── Top U-track ──
    if (tPlateRef.current) {
      const sX = Math.max(
        1e-4,
        easeOut(winP(t, W_TPLATE[0], W_TPLATE[1])) * (1 - outP),
      )
      tPlateRef.current.scale.x = sX
      tPlateRef.current.position.x = -WALL_W / 2 + (sX * WALL_W) / 2
    }

    // ── Studs ──
    studRefs.current.forEach((group, i) => {
      if (!group) return
      const lo = STUD_ANIM_START + i * STUD_GAP
      const rise = easeOut(winP(t, lo, lo + STUD_DUR)) * (1 - outP)
      group.position.y = STUD_START_Y + rise * (STUD_END_Y - STUD_START_Y)
    })

    // ── Laser Level Line ──
    if (laserRef.current) {
      const laserP = easeInOut(winP(t, W_STUDS[1], W_TPLATE[0]))
      laserRef.current.scale.x = Math.max(0.001, laserP * (1 - outP))
    }
  })

  return (
    <>
      <ambientLight intensity={1.4} color="#fff8f0" />
      <directionalLight
        position={[10, 16, 10]}
        intensity={0.6}
        color="#ffe8c8"
      />
      <directionalLight
        position={[-8, 8, -6]}
        intensity={0.35}
        color="#d8e8f8"
      />
      <directionalLight
        position={[0, -4, 10]}
        intensity={0.12}
        color="#ffffff"
      />

      {/* Grid Floor */}
      <Grid
        position={[0, FLOOR_Y - 0.02, 0]}
        args={[40, 40]}
        cellSize={0.4}
        cellThickness={0.5}
        cellColor="#b8ccdf"
        sectionSize={2}
        sectionThickness={1.0}
        sectionColor="#88a8cc"
        fadeDistance={22}
        fadeStrength={1.8}
        followCamera={false}
        infiniteGrid
      />

      {/* Bounding wireframe */}
      <mesh>
        <boxGeometry args={[WALL_W + 1.1, WALL_H + 1.1, PLATE_D + 1.0]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color={BOX_LINE} />
      </mesh>

      {/* Tracks */}
      <mesh ref={bPlateRef} position={[0, -WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_W, PLATE_T, PLATE_D]} />
        <meshStandardMaterial {...TRACK_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      <mesh ref={tPlateRef} position={[0, WALL_H / 2, 0]}>
        <boxGeometry args={[WALL_W, PLATE_T, PLATE_D]} />
        <meshStandardMaterial {...TRACK_MAT} />
        <Edges color={DARK_EDGE} />
      </mesh>

      {/* Studs */}
      {STUD_X.map((x, i) => (
        <group
          key={i}
          ref={(el) => {
            studRefs.current[i] = el
          }}
          position={[x, STUD_START_Y, 0]}
        >
          <CStud />
        </group>
      ))}

      {/* Rotary Laser Level Line */}
      <group position={[0, -0.2, STUD_D / 2 + 0.02]}>
        <mesh ref={laserRef}>
          <boxGeometry args={[WALL_W + 0.5, 0.008, 0.005]} />
          <meshBasicMaterial color={LASER_COLOR} toneMapped={false} />
        </mesh>
      </group>
    </>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function IsometricBlueprintScene() {
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
          zoom={88}
          near={0.1}
          far={200}
        />

        <FrameScene />

        <OrbitControls enablePan={false} enableRotate enableZoom={false} />
      </Canvas>
    </div>
  )
}
