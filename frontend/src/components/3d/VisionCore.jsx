import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import OrbitalSystem from './OrbitalSystem'
import DataNodes from './DataNodes'
import ParticleField from './ParticleField'

/**
 * VisionCore — Abstract Central AI Intelligence Core
 * 
 * Features:
 * - Translucent glass crystalline inner geometry
 * - Precision computational wireframe lattice
 * - Concentric orbital rings & trailing beacons
 * - Neural data nodes & synaptic connections
 * - Latent space particle field
 * - Multi-axis slow rotation & subtle breathing oscillation
 */
export default function VisionCore({ isMobile = false }) {
  const coreGroupRef = useRef()
  const innerGlassRef = useRef()
  const wireframeLatticeRef = useRef()
  const centerEmitterRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Slow multi-axis core rotation
    if (coreGroupRef.current) {
      coreGroupRef.current.rotation.y = t * 0.08
    }

    // Inner crystalline glass counter-rotation
    if (innerGlassRef.current) {
      innerGlassRef.current.rotation.x = t * 0.12
      innerGlassRef.current.rotation.z = -t * 0.09

      // Subtle breathing scale
      const breath = 1 + Math.sin(t * 1.6) * 0.025
      innerGlassRef.current.scale.set(breath, breath, breath)
    }

    // Outer wireframe lattice complex rotation
    if (wireframeLatticeRef.current) {
      wireframeLatticeRef.current.rotation.y = -t * 0.06
      wireframeLatticeRef.current.rotation.x = Math.sin(t * 0.1) * 0.15
    }

    // Center emitter pulse
    if (centerEmitterRef.current) {
      const pulse = 1 + Math.sin(t * 3) * 0.12
      centerEmitterRef.current.scale.set(pulse, pulse, pulse)
      centerEmitterRef.current.rotation.y = t * 0.4
    }
  })

  return (
    <group ref={coreGroupRef}>
      {/* ─── Layer 1: Central Luminance Emitter ──────────────────────── */}
      <mesh ref={centerEmitterRef}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.95}
        />
        <pointLight color="#FF2A55" intensity={1.6} distance={4.5} />
      </mesh>

      {/* ─── Layer 2: Translucent Crystalline Glass Core ─────────────── */}
      <mesh ref={innerGlassRef}>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshPhysicalMaterial
          color="#FF2A55"
          emissive="#610419"
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.1}
          transmission={0.6}
          thickness={0.8}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ─── Layer 3: Wireframe Tensor Lattice ───────────────────────── */}
      <mesh ref={wireframeLatticeRef}>
        <dodecahedronGeometry args={[1.4, 0]} />
        <meshBasicMaterial
          color="#FFFFFF"
          wireframe
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ─── Layer 4: Orbital Rings & Trailing Nodes ─────────────────── */}
      <OrbitalSystem radius={2.2} isMobile={isMobile} />

      {/* ─── Layer 5: Neural Graph Data Nodes ────────────────────────── */}
      <DataNodes count={16} radius={3.1} isMobile={isMobile} />

      {/* ─── Layer 6: Latent Space Particles ─────────────────────────── */}
      <ParticleField count={280} spread={20} isMobile={isMobile} />
    </group>
  )
}
