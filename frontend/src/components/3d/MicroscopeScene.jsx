import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Futuristic microscope-inspired 3D object
 */
export default function MicroscopeScene({ scale = 1 }) {
  const groupRef = useRef()
  const lensRef = useRef()
  const ringRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.12
    }
    if (lensRef.current) {
      lensRef.current.rotation.z = t * 0.4
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.2
      ringRef.current.rotation.z = -t * 0.15
    }
  })

  const crimsonMat = (
    <meshPhysicalMaterial
      color="#FF2A55"
      emissive="#BE123C"
      emissiveIntensity={0.35}
      roughness={0.2}
      metalness={0.8}
      transparent
      opacity={0.85}
    />
  )

  const glassMat = (
    <meshPhysicalMaterial
      color="#FFFFFF"
      transparent
      opacity={0.15}
      roughness={0}
      metalness={0}
      transmission={0.95}
      thickness={1}
    />
  )

  return (
    <Float speed={1.0} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={scale}>

        {/* Main body — vertical cylinder */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 2.4, 16]} />
          {crimsonMat}
        </mesh>

        {/* Objective lens housing */}
        <mesh position={[0, -1.4, 0]} ref={lensRef}>
          <cylinderGeometry args={[0.22, 0.18, 0.35, 24]} />
          {crimsonMat}
        </mesh>

        {/* Lens glass */}
        <mesh position={[0, -1.62, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 32]} />
          {glassMat}
        </mesh>

        {/* Eye piece top */}
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.16, 0.1, 0.3, 16]} />
          {crimsonMat}
        </mesh>

        {/* Stage platform */}
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[1.2, 0.04, 1.0]} />
          {crimsonMat}
        </mesh>

        {/* Stage aperture ring */}
        <mesh position={[0, -0.48, 0]}>
          <torusGeometry args={[0.25, 0.025, 8, 32]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
        </mesh>

        {/* Rotating orbital rings */}
        <group ref={ringRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.1, 0.012, 8, 60]} />
            <meshStandardMaterial color="#FF2A55" emissive="#FF2A55" emissiveIntensity={0.5} transparent opacity={0.45} />
          </mesh>
          <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
            <torusGeometry args={[0.9, 0.008, 8, 60]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} transparent opacity={0.35} />
          </mesh>
        </group>

        {/* Focus knobs */}
        {[-0.3, 0.3].map((z, i) => (
          <mesh key={i} position={[0.5, -0.2, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.3, 12]} rotation={[0, 0, Math.PI / 2]} />
            {crimsonMat}
          </mesh>
        ))}

        {/* Glow center */}
        <pointLight color="#FF2A55" intensity={1.5} distance={4} position={[0, 0, 0]} />
        <pointLight color="#FFFFFF" intensity={0.8} distance={3} position={[0, -1.5, 0]} />
      </group>
    </Float>
  )
}
