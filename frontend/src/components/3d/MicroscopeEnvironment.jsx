import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import FuturisticMicroscope from './FuturisticMicroscope'

/**
 * Procedural DNA Helix Strand floating in the background depth of field
 */
function FloatingDna({ position = [0, 0, -3], rotation = [0, 0, 0.4], scale = 0.8 }) {
  const groupRef = useRef()
  const strandCount = 18

  const points = useMemo(() => {
    const pts1 = []
    const pts2 = []
    const rungs = []
    const height = 4.5
    const radius = 0.45
    const turns = 2.2

    for (let i = 0; i <= strandCount; i++) {
      const t = i / strandCount
      const angle = t * Math.PI * 2 * turns
      const y = (t - 0.5) * height

      const x1 = Math.cos(angle) * radius
      const z1 = Math.sin(angle) * radius

      const x2 = Math.cos(angle + Math.PI) * radius
      const z2 = Math.sin(angle + Math.PI) * radius

      pts1.push(new THREE.Vector3(x1, y, z1))
      pts2.push(new THREE.Vector3(x2, y, z2))

      if (i % 2 === 0) {
        rungs.push([new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)])
      }
    }
    return { pts1, pts2, rungs }
  }, [strandCount])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Strand 1 (Crimson) */}
      {points.pts1.map((p, i) => (
        <mesh key={`s1-${i}`} position={p}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#FF2A55" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Strand 2 (White) */}
      {points.pts2.map((p, i) => (
        <mesh key={`s2-${i}`} position={p}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Connecting Hydrogen Bond Rungs */}
      {points.rungs.map((rung, i) => {
        const geom = new THREE.BufferGeometry().setFromPoints(rung)
        return (
          <line key={`r-${i}`} geometry={geom}>
            <lineBasicMaterial color="#E2E8F0" transparent opacity={0.18} />
          </line>
        )
      })}
    </group>
  )
}

/**
 * Camera Director: Smoothly interpolates camera position & orientation
 * based on the interactive exploration stage.
 */
function CameraDirector({ stage = 'idle' }) {
  const targetPos = useMemo(() => new THREE.Vector3(), [])
  const targetLook = useMemo(() => new THREE.Vector3(), [])
  const currentLook = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()

    switch (stage) {
      case 'zooming':
        // Camera glides straight down towards the lens
        targetPos.set(0, 0.05, 1.1)
        targetLook.set(0, -0.05, 0.1)
        break

      case 'cell':
        // Camera centers onto the living cell
        targetPos.set(0, 0, 3.4 + Math.sin(t * 0.6) * 0.05)
        targetLook.set(0, 0, 0)
        break

      case 'auth':
        // Camera in stable cinematic position framing cell / network
        targetPos.set(0, 0.1, 3.8 + Math.sin(t * 0.4) * 0.04)
        targetLook.set(0, 0, 0)
        break

      case 'idle':
      default:
        // Elegant 3/4 hero camera with gentle parallax
        targetPos.set(
          2.4 + Math.sin(t * 0.25) * 0.12,
          1.1 + Math.cos(t * 0.3) * 0.08,
          4.4
        )
        targetLook.set(0, 0.15, 0)
        break
    }

    // Smooth lerping
    const factor = stage === 'zooming' ? 0.06 : 0.04
    camera.position.lerp(targetPos, factor)
    currentLook.current.lerp(targetLook, factor)
    camera.lookAt(currentLook.current)
  })

  return null
}

/**
 * MicroscopeEnvironment — R3F Scene Root
 */
export default function MicroscopeEnvironment({
  stage = 'idle',
  onLensClick,
  onHoverLens,
  className = 'w-full h-full',
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [2.4, 1.1, 4.4], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <CameraDirector stage={stage} />

          {/* ─── Cinematic Lighting: Biotech & Laboratory ────────────────── */}
          <ambientLight intensity={0.45} color="#0A1120" />

          {/* Key Studio Light */}
          <directionalLight
            position={[5, 7, 4]}
            intensity={1.6}
            color="#FFFFFF"
          />

          {/* Soft Crimson Biological Rim Light */}
          <pointLight
            position={[-4, 2, 2]}
            color="#FF2A55"
            intensity={2.8}
            distance={12}
          />

          {/* Ruby Accent Fill */}
          <pointLight
            position={[3, -2, 3]}
            color="#DC2626"
            intensity={1.8}
            distance={10}
          />

          {/* Volumetric Stage Downlight */}
          <spotLight
            position={[0, 4, 0.5]}
            target-position={[0, -0.5, 0.2]}
            angle={0.45}
            penumbra={0.8}
            intensity={2.2}
            color="#FFFFFF"
          />

          {/* ─── 3D Microscope + Living Cell ─────────────────────────────── */}
          <FuturisticMicroscope
            stage={stage}
            onLensClick={onLensClick}
            onHoverLens={onHoverLens}
          />

          {/* ─── Background Biological Atmosphere ───────────────────────── */}
          <FloatingDna position={[-2.4, 0.5, -2.5]} rotation={[0.2, 0, 0.5]} scale={0.7} />
          <FloatingDna position={[2.6, -0.8, -3.2]} rotation={[-0.3, 0, -0.4]} scale={0.65} />

          {/* Very subtle floating biological particles */}
          <Sparkles
            count={45}
            scale={[7, 7, 5]}
            size={1.6}
            speed={0.3}
            color="#FF2A55"
            opacity={0.35}
          />
          <Sparkles
            count={25}
            scale={[6, 6, 4]}
            size={1.4}
            speed={0.25}
            color="#FFFFFF"
            opacity={0.25}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
