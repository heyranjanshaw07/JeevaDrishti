import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Procedural Biconcave Red Blood Cell (Erythrocyte) Geometry
 * Mathematical Evans-Fung erythrocyte cross-section profile
 */
function createBiconcaveCurve(radius = 0.5, maxThickness = 0.22) {
  const points = []
  const segments = 20

  // Top surface from center dimple to outer rim
  for (let i = 0; i <= segments; i++) {
    const u = i / segments // 0 at center, 1 at rim
    const r = u * radius
    // Evans-Fung formula for biconcave profile
    const h = (maxThickness * 0.5) * (0.35 + 1.6 * Math.pow(u, 2) - 0.95 * Math.pow(u, 4)) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2)))
    points.push(new THREE.Vector2(r, h))
  }

  // Smooth outer rim
  points.push(new THREE.Vector2(radius * 1.02, 0))

  // Bottom surface from rim back to center dimple
  for (let i = segments; i >= 0; i--) {
    const u = i / segments
    const r = u * radius
    const h = (maxThickness * 0.5) * (0.35 + 1.6 * Math.pow(u, 2) - 0.95 * Math.pow(u, 4)) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2)))
    points.push(new THREE.Vector2(r, -h))
  }

  return points
}

/**
 * Floating Micro Plasma Particles (Red & Soft White)
 */
function MicroPlasmaField({ count = 120 }) {
  const pointsRef = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const crimson = new THREE.Color('#FF2A55')
    const white = new THREE.Color('#FFFFFF')
    const ruby = new THREE.Color('#DC2626')

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8

      const rand = Math.random()
      const c = rand > 0.65 ? white : rand > 0.3 ? crimson : ruby
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return [pos, col]
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.025
      pointsRef.current.rotation.x = Math.sin(t * 0.02) * 0.03
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Tiny Blood Cell Swarm ("Bahut Chotha Cells")
 * Realistic high-magnification field with 80+ delicate, small red blood cells floating and tumbling
 */
function MicroscopicBloodField({ count = 85, radius = 6.0 }) {
  const lathePoints = useMemo(() => createBiconcaveCurve(0.42, 0.20), [])
  const geometry = useMemo(() => new THREE.LatheGeometry(lathePoints, 18), [lathePoints])

  // Generate delicate, small-scale cell positions
  const cells = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      // Natural distribution across microscope field
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.8
      const dist = 0.6 + Math.random() * (radius - 0.6)
      const x = Math.cos(angle) * dist + (Math.random() - 0.5) * 0.6
      const y = (Math.random() - 0.5) * 6.5
      const z = (Math.random() - 0.5) * 5.0 - 0.2

      // "Bahut chotha size" (very small): scale between 0.12 and 0.28
      const scale = 0.12 + Math.random() * 0.16

      const rot = [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ]

      // Natural tumble speed
      const speed = 0.18 + Math.random() * 0.35

      // Rich vibrant hematology color palette: bright crimson to deep blood red
      const palette = ['#FF2A55', '#FF1E4B', '#E11D48', '#DC2626', '#F43F5E']
      const color = palette[Math.floor(Math.random() * palette.length)]
      const emissive = '#38000A'

      data.push({ x, y, z, scale, rot, speed, color, emissive, id: i })
    }
    return data
  }, [count, radius])

  const groupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      // Gentle overall fluid convection flow
      groupRef.current.rotation.y = t * 0.04
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {cells.map((c) => (
        <Float
          key={c.id}
          speed={c.speed * 1.6}
          rotationIntensity={0.6}
          floatIntensity={0.5}
        >
          <mesh
            position={[c.x, c.y, c.z]}
            scale={c.scale}
            rotation={c.rot}
            geometry={geometry}
          >
            {/* Clean, artifact-free glowing cell material (no glitchy transmission artifacts) */}
            <meshStandardMaterial
              color={c.color}
              emissive={c.emissive}
              emissiveIntensity={0.55}
              roughness={0.22}
              metalness={0.08}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

/**
 * Delicate Tiny Platelets (Thrombocytes)
 */
function TinyPlatelets({ count = 28 }) {
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.08, 0), [])

  const platelets = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 8.5,
        y: (Math.random() - 0.5) * 6.5,
        z: (Math.random() - 0.5) * 5.0,
        scale: 0.04 + Math.random() * 0.05,
        speed: 0.25 + Math.random() * 0.4,
        id: i,
      })
    }
    return data
  }, [count])

  return (
    <group>
      {platelets.map((p) => (
        <Float key={p.id} speed={p.speed * 2} rotationIntensity={0.8} floatIntensity={0.6}>
          <mesh position={[p.x, p.y, p.z]} scale={p.scale} geometry={geometry}>
            <meshStandardMaterial
              color="#FFF1F3"
              emissive="#FF2A55"
              emissiveIntensity={0.6}
              roughness={0.2}
              transparent
              opacity={0.85}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

/**
 * CellSwarm — Completely Refactored for Small Cells ("Bahut Chotha Cells")
 * 
 * - REMOVED the large grey/white ball spheres
 * - REMOVED the giant overlapping RBCs
 * - 80+ delicate, small-scale erythrocytes drifting gracefully in plasma fluid
 * - Clean, glitch-free materials with glowing specular rims
 */
export default function CellSwarm({ isMobile = false }) {
  return (
    <group scale={isMobile ? 0.85 : 1.0}>
      {/* ─── High-Density Swarm of Small Red Blood Cells ("Bahut Chotha Cells") ─── */}
      <MicroscopicBloodField count={isMobile ? 70 : 115} radius={7.2} />

      {/* ─── Tiny Micro-Platelet Specks ────────────────────────────────────────── */}
      <TinyPlatelets count={isMobile ? 22 : 40} />

      {/* ─── Bio-Luminescent Sparkling Micro Plasma Particles ─────────────────── */}
      <MicroPlasmaField count={isMobile ? 80 : 150} />
    </group>
  )
}
