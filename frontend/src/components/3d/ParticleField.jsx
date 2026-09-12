import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ParticleField — AI Latent Space Point Cloud
 * High-performance buffer geometry points with Vivid Crimson, Ruby, and Pure White specular hues.
 */
export default function ParticleField({ count = 280, spread = 22, isMobile = false }) {
  const pointsRef = useRef()
  const actualCount = isMobile ? Math.floor(count * 0.4) : count

  // Generate buffer data
  const [positions, colors, scales, speeds] = useMemo(() => {
    const pos = new Float32Array(actualCount * 3)
    const col = new Float32Array(actualCount * 3)
    const sca = new Float32Array(actualCount)
    const spd = new Float32Array(actualCount)

    const colorCrimson = new THREE.Color('#FF2A55')
    const colorRuby = new THREE.Color('#DC2626')
    const colorWhite = new THREE.Color('#FFFFFF')
    const tempColor = new THREE.Color()

    for (let i = 0; i < actualCount; i++) {
      // Cylindrical / spherical distribution around central core
      const radius = 2.5 + Math.random() * (spread * 0.5)
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI * 0.8

      pos[i * 3] = radius * Math.cos(theta) * Math.cos(phi)
      pos[i * 3 + 1] = radius * Math.sin(phi) * 0.7
      pos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi)

      // Color interpolation: 60% Crimson, 25% Ruby, 15% Pure White
      const r = Math.random()
      if (r < 0.6) {
        tempColor.copy(colorCrimson).lerp(colorWhite, Math.random() * 0.35)
      } else if (r < 0.85) {
        tempColor.copy(colorRuby).lerp(colorCrimson, 0.5)
      } else {
        tempColor.copy(colorWhite)
      }

      col[i * 3] = tempColor.r
      col[i * 3 + 1] = tempColor.g
      col[i * 3 + 2] = tempColor.b

      sca[i] = Math.random() * 2.2 + 0.8
      spd[i] = (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1)
    }

    return [pos, col, sca, spd]
  }, [actualCount, spread])

  // Gentle orbital drift
  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    const t = clock.getElapsedTime()
    pointsRef.current.rotation.y = t * 0.025
    pointsRef.current.rotation.x = Math.sin(t * 0.015) * 0.05
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={actualCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
