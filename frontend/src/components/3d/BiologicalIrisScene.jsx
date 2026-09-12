import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import BiologicalIris from './BiologicalIris'

/**
 * BiologicalIrisScene — Interactive 3D Biological Iris Canvas Container
 * 
 * Features:
 * - Subtly tracks user cursor coordinates for organic parallax
 * - Responds to Email / Password field focus from the authentication form
 * - Supports Awakening trigger (click on iris toggles state)
 * - White & Red / Crimson Hematology illumination
 */
export default function BiologicalIrisScene({
  isAwakened = false,
  onToggleAwaken,
  focusMode = null, // null | 'email' | 'password'
  animState = 'idle', // 'idle' | 'login' | 'signup'
  className = 'w-full h-full',
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Track cursor movement across window with gentle damping
  useEffect(() => {
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      setMousePos({ x: nx, y: ny })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div ref={containerRef} className={`relative overflow-hidden select-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          {/* ─── Cinematic Lighting: White & Crimson Hematology ───────────── */}
          <ambientLight intensity={animState === 'transition' ? 0.7 : (isAwakened ? 0.5 : 0.28)} color="#18040A" />

          {/* Key Specular Front Light (Pure White) */}
          <directionalLight
            position={[4, 5, 6]}
            intensity={animState === 'transition' ? 2.5 : (isAwakened ? 1.8 : 0.9)}
            color="#FFFFFF"
          />

          {/* Biological Crimson Rim Light */}
          <pointLight
            position={[-5, 3, 2]}
            color="#FF2A55"
            intensity={animState === 'transition' ? 4.5 : (isAwakened ? 3.4 : 1.4)}
            distance={14}
          />

          {/* Deep Ruby Volumetric Accent */}
          <pointLight
            position={[3, -4, 2]}
            color="#DC2626"
            intensity={isAwakened ? 2.2 : 0.9}
            distance={12}
          />

          {/* Centered Optical Spotlight */}
          <spotLight
            position={[0, 0, 7]}
            angle={0.5}
            penumbra={0.7}
            intensity={isAwakened ? 2.2 : 1.0}
            color="#FFFFFF"
          />

          {/* ─── The Biological Iris / Eye Model ──────────────────────────── */}
          <BiologicalIris
            isAwakened={isAwakened}
            onToggleAwaken={onToggleAwaken}
            focusMode={focusMode}
            animState={animState}
            mousePos={mousePos}
          />

          {/* ─── Ambient Cellular Spores / Neural Dust (Performance-aware) ─── */}
          <Sparkles
            count={typeof window !== 'undefined' && window.innerWidth < 768 ? (isAwakened ? 20 : 8) : (isAwakened ? 40 : 15)}
            scale={[5, 5, 3]}
            size={1.4}
            speed={0.15}
            color="#FF2A55"
            opacity={isAwakened ? 0.45 : 0.2}
          />
          <Sparkles
            count={typeof window !== 'undefined' && window.innerWidth < 768 ? (isAwakened ? 12 : 5) : (isAwakened ? 25 : 10)}
            scale={[4, 4, 2]}
            size={1.1}
            speed={0.12}
            color="#FFFFFF"
            opacity={isAwakened ? 0.35 : 0.15}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
