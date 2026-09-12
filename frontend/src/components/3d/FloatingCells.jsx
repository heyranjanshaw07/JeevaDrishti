import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * A single translucent microscopic cell
 */
function Cell({ position, radius = 0.6, color = '#FF2A55', speed = 0.3, rotationAxis = [0,1,0] }) {
  const outerRef = useRef()
  const innerRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (outerRef.current) outerRef.current.rotation.y = t * speed
    if (innerRef.current) {
      innerRef.current.rotation.x = t * speed * 0.7
      innerRef.current.rotation.z = t * speed * 0.5
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <group position={position}>
        {/* Cell membrane */}
        <mesh ref={outerRef}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshPhysicalMaterial
            color={color}
            transparent
            opacity={0.08}
            roughness={0.1}
            metalness={0}
            transmission={0.9}
            thickness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Cell wall rim */}
        <mesh>
          <torusGeometry args={[radius * 0.98, radius * 0.018, 12, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Nucleus */}
        <mesh ref={innerRef}>
          <sphereGeometry args={[radius * 0.35, 16, 16]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.25}
            roughness={0.3}
          />
        </mesh>

        {/* Nucleus glow point */}
        <pointLight color={color} intensity={0.4} distance={2} />
      </group>
    </Float>
  )
}

/**
 * FloatingCells — a cluster of animated translucent cells
 */
export default function FloatingCells({ count = 6 }) {
  const cellConfigs = [
    { position: [-3.5, 1.2, -2], radius: 0.7, color: '#FF2A55', speed: 0.25 },
    { position: [3.2, -1.0, -3], radius: 0.5, color: '#FFFFFF', speed: 0.35 },
    { position: [1.5, 2.5, -1], radius: 0.45, color: '#FF4D73', speed: 0.2 },
    { position: [-2.0, -2.2, -1.5], radius: 0.6, color: '#DC2626', speed: 0.3 },
    { position: [4.0, 0.5, -4], radius: 0.8, color: '#FFFFFF', speed: 0.18 },
    { position: [-4.5, -0.5, -2.5], radius: 0.55, color: '#FFA0B4', speed: 0.28 },
  ]

  return (
    <group>
      {cellConfigs.slice(0, count).map((cfg, i) => (
        <Cell key={i} {...cfg} />
      ))}
    </group>
  )
}
