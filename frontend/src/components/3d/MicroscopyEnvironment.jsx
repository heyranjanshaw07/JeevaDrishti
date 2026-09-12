import { useRef, useMemo, useState, useEffect, Suspense, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// ─── Procedural Biconcave Red Blood Cell (RBC) Geometry ──────────────────────
function createBiconcaveCurve(radius = 1.0, maxThickness = 0.45) {
  const points = []
  const segments = 24

  // Top surface from center to rim
  for (let i = 0; i <= segments; i++) {
    const u = i / segments // 0 at center, 1 at rim
    const r = u * radius
    // Classic Evans-Fung erythrocyte cross-section profile
    const h = (maxThickness * 0.5) * (0.35 + 1.6 * Math.pow(u, 2) - 0.95 * Math.pow(u, 4)) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2)))
    points.push(new THREE.Vector2(r, h))
  }

  // Smooth rim around edge
  points.push(new THREE.Vector2(radius * 1.02, 0))

  // Bottom surface from rim back to center
  for (let i = segments; i >= 0; i--) {
    const u = i / segments
    const r = u * radius
    const h = (maxThickness * 0.5) * (0.35 + 1.6 * Math.pow(u, 2) - 0.95 * Math.pow(u, 4)) * Math.sqrt(Math.max(0, 1 - Math.pow(u, 2)))
    points.push(new THREE.Vector2(r, -h))
  }

  return points
}

// ─── Individual 3D Red Blood Cell ───────────────────────────────────────────
function RedBloodCell({ position, scale = 1, rotation = [0, 0, 0], color = '#FF2A55', speed = 0.3 }) {
  const meshRef = useRef()
  const lathePoints = useMemo(() => createBiconcaveCurve(0.75, 0.42), [])
  const geometry = useMemo(() => new THREE.LatheGeometry(lathePoints, 36), [lathePoints])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation[0] + Math.sin(t * speed * 0.8) * 0.2
      meshRef.current.rotation.y = rotation[1] + t * speed * 0.3
      meshRef.current.rotation.z = rotation[2] + Math.cos(t * speed * 0.7) * 0.15
    }
  })

  return (
    <Float speed={1.2 * speed} rotationIntensity={0.4} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        scale={scale}
        rotation={rotation}
        geometry={geometry}
      >
        <meshPhysicalMaterial
          color={color}
          emissive="#38040E"
          emissiveIntensity={0.4}
          roughness={0.12}
          metalness={0.05}
          transmission={0.88}
          thickness={1.1}
          ior={1.35}
          transparent
          opacity={0.82}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  )
}

// ─── Individual 3D White Blood Cell with Internal Nucleus ────────────────────
function WhiteBloodCell({ position, scale = 1, speed = 0.25 }) {
  const outerRef = useRef()
  const nucleusRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (outerRef.current) {
      outerRef.current.rotation.y = t * speed * 0.2
      outerRef.current.rotation.z = Math.sin(t * 0.3) * 0.1
    }
    if (nucleusRef.current) {
      nucleusRef.current.rotation.x = -t * speed * 0.3
      nucleusRef.current.rotation.y = t * speed * 0.4
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.4}>
      <group position={position} scale={scale}>
        {/* Outer Translucent Granular Membrane */}
        <mesh ref={outerRef}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            emissive="#060205"
            emissiveIntensity={0.2}
            roughness={0.25}
            metalness={0.0}
            transmission={0.82}
            thickness={1.4}
            ior={1.38}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Multi-Lobed Chromatin Nucleus */}
        <group ref={nucleusRef} scale={0.42}>
          <mesh position={[0.28, 0.2, 0.1]}>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshStandardMaterial
              color="#DC2626"
              emissive="#FF2A55"
              emissiveIntensity={0.65}
              roughness={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[-0.25, -0.15, -0.1]}>
            <sphereGeometry args={[0.38, 16, 16]} />
            <meshStandardMaterial
              color="#FF2A55"
              emissive="#DC2626"
              emissiveIntensity={0.6}
              roughness={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[0.0, -0.22, 0.2]}>
            <sphereGeometry args={[0.34, 16, 16]} />
            <meshStandardMaterial
              color="#DC2626"
              emissive="#FF2A55"
              emissiveIntensity={0.5}
              roughness={0.4}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>

        {/* Internal Core Glow Point */}
        <pointLight color="#FF2A55" intensity={0.8} distance={2.5} />
      </group>
    </Float>
  )
}

// ─── Individual Platelet Fragment (PLT) ──────────────────────────────────────
function Platelet({ position, scale = 0.22, speed = 0.4 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x = t * speed * 0.8
      meshRef.current.rotation.y = t * speed * 1.2
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={[scale, scale * 0.45, scale * 0.85]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          emissive="#FF2A55"
          emissiveIntensity={0.5}
          roughness={0.2}
          transmission={0.8}
          transparent
          opacity={0.75}
        />
      </mesh>
    </Float>
  )
}

// ─── Floating Biological Fluid Micro-Particles ──────────────────────────────
function FluidParticles({ count = 80 }) {
  const pointsRef = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const crimson = new THREE.Color('#FF2A55')
    const white = new THREE.Color('#FFFFFF')

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8

      const c = Math.random() > 0.4 ? crimson : white
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return [pos, col]
  }, [count])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.02
      pointsRef.current.rotation.x = Math.sin(t * 0.015) * 0.03
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── Parallax Camera & Fluid Illumination Controller ─────────────────────────
function SceneController({ isMobile }) {
  const groupRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { x: px, y: py } = state.pointer

    // Gentle fluid floating motion
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.15
      groupRef.current.position.x = Math.cos(t * 0.4) * 0.1

      // Subtle mouse parallax
      const targetRotX = -py * (isMobile ? 0.05 : 0.18)
      const targetRotY = px * (isMobile ? 0.08 : 0.22)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.04)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.04)
    }

    // Camera smoothing
    const camX = px * (isMobile ? 0.2 : 0.45)
    const camY = py * (isMobile ? 0.15 : 0.35)
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, camX, 0.03)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, camY, 0.03)
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <>
      {/* ─── Cinematic Optical Illumination ──────────────────────────────── */}
      <ambientLight color="#0A0408" intensity={1.6} />

      {/* Crimson Transillumination Condenser Light */}
      <directionalLight position={[-4, 5, 4]} color="#FF2A55" intensity={2.6} />

      {/* Pure White Substage Darkfield Rim Light */}
      <directionalLight position={[5, -4, -3]} color="#FFFFFF" intensity={2.0} />

      {/* Soft Specular Front Field */}
      <pointLight position={[0, 1, 5]} color="#FFA0B4" intensity={1.4} distance={10} />

      {/* ─── 3D Cellular Matrix Layers ───────────────────────────────────── */}
      <group ref={groupRef} scale={isMobile ? 0.8 : 1.0}>
        {/* Midground Hero Cells (In crisp focus, targeted by HUD) */}
        <RedBloodCell position={[-1.2, 0.4, 0.8]} scale={1.15} rotation={[0.4, 0.3, 0.2]} color="#FF2A55" speed={0.25} />
        <WhiteBloodCell position={[1.4, -0.6, 0.3]} scale={1.05} speed={0.2} />
        <RedBloodCell position={[-0.2, -1.4, 0.5]} scale={0.9} rotation={[-0.5, 0.8, -0.3]} color="#FFFFFF" speed={0.28} />

        {/* Foreground Bokeh Cells (Large, close, slow drift) */}
        <RedBloodCell position={[-3.2, 2.2, 2.2]} scale={1.5} rotation={[0.8, -0.4, 0.3]} color="#FF2A55" speed={0.18} />
        <Platelet position={[0.2, 1.8, 1.6]} scale={0.26} speed={0.35} />

        {/* Background Depth Cells (Smaller, deeper in fluid matrix) */}
        <RedBloodCell position={[3.0, 1.6, -2.0]} scale={0.7} rotation={[-0.2, 0.5, 0.6]} color="#DC2626" speed={0.22} />
        <RedBloodCell position={[-2.8, -2.0, -1.8]} scale={0.65} rotation={[0.6, 0.2, -0.5]} color="#FF4D73" speed={0.24} />
        <WhiteBloodCell position={[-3.8, 0.2, -3.0]} scale={0.75} speed={0.16} />
        <RedBloodCell position={[2.5, -2.2, -2.5]} scale={0.6} rotation={[0.1, -0.6, 0.2]} color="#9F1239" speed={0.26} />

        {/* Platelet Clusters */}
        <Platelet position={[-1.8, -0.4, 0.6]} scale={0.18} speed={0.4} />
        <Platelet position={[0.8, 0.9, 0.4]} scale={0.22} speed={0.38} />
        <Platelet position={[1.8, -1.8, 0.2]} scale={0.2} speed={0.42} />
        <Platelet position={[-0.8, 2.1, -0.8]} scale={0.16} speed={0.32} />

        {/* Fluid Micro-Particles */}
        <FluidParticles count={isMobile ? 40 : 90} />
      </group>
    </>
  )
}

/**
 * MicroscopyEnvironment — Realistic Stylized 3D Microscopy Scene
 * Exclusively for Authentication Pages.
 */
function MicroscopyEnvironment({ className = '' }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6.8], fov: isMobile ? 55 : 44 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          depth: true,
        }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <SceneController isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default memo(MicroscopyEnvironment)
