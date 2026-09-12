import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * OrbitalSystem — Precision Mathematical Orbital Rings & Trailing Nodes
 * Represents AI computational gimbals and tensor coordinates.
 */
export default function OrbitalSystem({ radius = 2.4, isMobile = false }) {
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const ring3Ref = useRef()
  const beacon1Ref = useRef()
  const beacon2Ref = useRef()
  const beacon3Ref = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Counter-rotations across gimbals
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.12
      ring1Ref.current.rotation.x = Math.sin(t * 0.05) * 0.2 + 0.4
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.15
      ring2Ref.current.rotation.z = Math.cos(t * 0.06) * 0.2 - 0.5
    }
    if (ring3Ref.current && !isMobile) {
      ring3Ref.current.rotation.x = t * 0.09
      ring3Ref.current.rotation.y = Math.sin(t * 0.08) * 0.3 + 0.8
    }

    // Satellite Beacon Trajectories along rings
    const r1 = radius * 1.15
    if (beacon1Ref.current) {
      const angle1 = t * 0.8
      beacon1Ref.current.position.set(
        Math.cos(angle1) * r1,
        Math.sin(angle1) * r1,
        0
      )
    }

    const r2 = radius * 0.95
    if (beacon2Ref.current) {
      const angle2 = -t * 0.95
      beacon2Ref.current.position.set(
        Math.cos(angle2) * r2,
        0,
        Math.sin(angle2) * r2
      )
    }

    const r3 = radius * 1.35
    if (beacon3Ref.current && !isMobile) {
      const angle3 = t * 0.65
      beacon3Ref.current.position.set(
        0,
        Math.sin(angle3) * r3,
        Math.cos(angle3) * r3
      )
    }
  })

  return (
    <group>
      {/* ─── Ring 1: Primary Crimson Orbital ───────────────────────── */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[radius * 1.15, 0.009, 12, 64]} />
          <meshBasicMaterial
            color="#FF2A55"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Trailing Node on Ring 1 */}
        <mesh ref={beacon1Ref}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshBasicMaterial color="#FF2A55" />
          <pointLight color="#FF2A55" intensity={0.5} distance={1.2} />
        </mesh>
      </group>

      {/* ─── Ring 2: Secondary Pure White Orbital ─────────────────── */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[radius * 0.95, 0.008, 12, 64]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Trailing Node on Ring 2 */}
        <mesh ref={beacon2Ref}>
          <octahedronGeometry args={[0.035, 0]} />
          <meshBasicMaterial color="#FFFFFF" />
          <pointLight color="#FFFFFF" intensity={0.4} distance={1.0} />
        </mesh>
      </group>

      {/* ─── Ring 3: Deep Ruby Coordinate Ring (Desktop Only) ───────────────── */}
      {!isMobile && (
        <group ref={ring3Ref}>
          <mesh>
            <torusGeometry args={[radius * 1.35, 0.006, 10, 64]} />
            <meshBasicMaterial
              color="#DC2626"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh ref={beacon3Ref}>
            <sphereGeometry args={[0.028, 8, 8]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
      )}
    </group>
  )
}
