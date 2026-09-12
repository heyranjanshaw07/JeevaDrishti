import { useRef, useState, useEffect, Suspense, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import CellSwarm from './CellSwarm'

/**
 * ParallaxSceneController — Inner Scene Logic
 * Handles smooth mouse-responsive parallax, camera dampening, and gentle biological floating motion.
 */
function ParallaxSceneController({ isMobile }) {
  const sceneGroupRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { x: pointerX, y: pointerY } = state.pointer

    // 1. Slow Gentle Fluid Floating Motion
    if (sceneGroupRef.current) {
      sceneGroupRef.current.position.y = Math.sin(t * 0.6) * 0.14
      sceneGroupRef.current.position.x = Math.cos(t * 0.45) * 0.1

      // 2. Subtle Parallax Tilt on Scene Group
      const targetRotX = -pointerY * (isMobile ? 0.08 : 0.18)
      const targetRotY = pointerX * (isMobile ? 0.1 : 0.22)
      sceneGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.x,
        targetRotX,
        0.035
      )
      sceneGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        sceneGroupRef.current.rotation.y,
        targetRotY,
        0.035
      )
    }

    // 3. Subtle Camera Parallax Dampening
    const targetCamX = pointerX * (isMobile ? 0.22 : 0.55)
    const targetCamY = pointerY * (isMobile ? 0.16 : 0.4)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.03)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.03)
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <>
      {/* ─── Optical Microscopy Lighting System (Crimson & Pure White) ─── */}
      <ambientLight color="#1A030A" intensity={1.6} />

      {/* Crisp Pure White Key Light */}
      <directionalLight
        position={[-5, 7, 6]}
        color="#FFFFFF"
        intensity={2.8}
      />

      {/* Vivid Crimson Specular Rim Light */}
      <directionalLight
        position={[6, -4, 4]}
        color="#FF2A55"
        intensity={3.2}
      />

      {/* Deep Scarlet Transillumination Subsurface Light */}
      <directionalLight
        position={[0, -5, -6]}
        color="#DC2626"
        intensity={2.4}
      />

      {/* Soft Ice-White Front Light */}
      <pointLight
        position={[0, 2, 5]}
        color="#FFF5F7"
        intensity={1.4}
        distance={14}
      />

      {/* ─── Biological Cell Swarm System ─────────────────────────────────── */}
      <group ref={sceneGroupRef} scale={isMobile ? 0.8 : 1.0}>
        <CellSwarm isMobile={isMobile} />
      </group>
    </>
  )
}

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/**
 * AbstractScene — High-Performance Reusable 3D Visual System
 * Blends seamlessly into the obsidian canvas with clamped DPR and mobile adaptability.
 */
function AbstractScene({ className = '' }) {
  const [isMobile, setIsMobile] = useState(false)
  const [hasWebGL, setHasWebGL] = useState(true)
  const containerRef = useRef()

  useEffect(() => {
    setHasWebGL(checkWebGLSupport())
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!hasWebGL) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: isMobile ? 55 : 44 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        style={{ pointerEvents: 'none' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
        }}
      >
        <Suspense fallback={null}>
          <ParallaxSceneController isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default memo(AbstractScene)
