import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

/**
 * Specimen Field: Living Biological Cells in Darkfield Microscopy
 */
const MICROSCOPIC_CELLS = [
  { id: 'focal-cell', position: [0, 0, -3.2], radius: 0.84, color: '#FF2A55', isFocal: true },
  { id: 'sat-1', position: [-2.0, 1.1, -3.7], radius: 0.54, color: '#FFFFFF', isFocal: false },
  { id: 'sat-2', position: [1.9, -0.9, -3.4], radius: 0.58, color: '#FF4D73', isFocal: false },
  { id: 'sat-3', position: [-1.5, -1.6, -4.0], radius: 0.48, color: '#DC2626', isFocal: false },
  { id: 'sat-4', position: [1.7, 1.5, -3.6], radius: 0.55, color: '#FFFFFF', isFocal: false },
  { id: 'sat-5', position: [-2.6, -0.4, -4.4], radius: 0.45, color: '#FFA0B4', isFocal: false },
  { id: 'sat-6', position: [2.6, 0.8, -4.1], radius: 0.52, color: '#FF2A55', isFocal: false },
]

/**
 * 3D Microscope Objective Lens Assembly
 * - Dark titanium clinical housing barrel (#0F172A)
 * - Precision knurled fine-adjustment grip collar (#1E293B)
 * - Polished gold DIN magnification band (100x / NA 1.40 Oil Immersion)
 * - Chamfered front nosecone & brass retaining bezel
 * - High-index coated optical glass element with specular refraction
 */
function ObjectiveLensAssembly({ progress = 0 }) {
  const lensGroupRef = useRef()
  const focusCollarRef = useRef()
  const frontGlassRef = useRef()

  const titaniumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0F172A',
        roughness: 0.2,
        metalness: 0.85,
      }),
    []
  )

  const knurledMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1E293B',
        roughness: 0.55,
        metalness: 0.7,
      }),
    []
  )

  const goldBandMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#F59E0B',
        emissive: '#78350F',
        emissiveIntensity: 0.35,
        roughness: 0.22,
        metalness: 0.9,
      }),
    []
  )

  const brassBezelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D97706',
        roughness: 0.3,
        metalness: 0.8,
      }),
    []
  )

  const opticGlassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.92,
        thickness: 0.8,
        ior: 1.52,
        reflectivity: 0.9,
      }),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!lensGroupRef.current) return

    // 0.0s - 0.4s: Subtle focus adjustment rotation
    if (progress < 0.45) {
      lensGroupRef.current.rotation.z = Math.sin(t * 3.5) * 0.08
      if (focusCollarRef.current) {
        focusCollarRef.current.rotation.y = t * 1.6
      }
    }

    if (frontGlassRef.current) {
      frontGlassRef.current.rotation.z = t * 0.2
    }
  })

  // Fade out objective body as camera moves past the front glass
  const lensOpacity = progress > 0.48 ? Math.max(0, 1 - (progress - 0.48) * 8) : 1
  if (lensOpacity <= 0) return null

  return (
    <group ref={lensGroupRef} position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Main Titanium Lens Housing */}
      <mesh material={titaniumMaterial}>
        <cylinderGeometry args={[1.35, 1.15, 1.4, 40]} />
      </mesh>

      {/* Knurled Fine Adjustment Grip Ring */}
      <mesh ref={focusCollarRef} position={[0, 0.35, 0]} material={knurledMaterial}>
        <cylinderGeometry args={[1.42, 1.42, 0.32, 40]} />
      </mesh>

      {/* Polished Gold Magnification Band */}
      <mesh position={[0, 0.05, 0]} material={goldBandMaterial}>
        <cylinderGeometry args={[1.38, 1.38, 0.14, 40]} />
      </mesh>

      {/* Front Nosecone Chamfer */}
      <mesh position={[0, -0.85, 0]} material={titaniumMaterial}>
        <cylinderGeometry args={[1.15, 0.75, 0.45, 40]} />
      </mesh>

      {/* Retaining Brass Bezel Ring */}
      <mesh position={[0, -1.06, 0]} material={brassBezelMaterial}>
        <torusGeometry args={[0.72, 0.035, 16, 40]} />
      </mesh>

      {/* Front Coated Optical Glass Element */}
      <mesh ref={frontGlassRef} position={[0, -1.07, 0]} material={opticGlassMaterial}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 36]} />
      </mesh>

      {/* Specular Crimson Reflection Ring */}
      <mesh position={[0, -1.08, 0]}>
        <ringGeometry args={[0.66, 0.69, 36]} />
        <meshBasicMaterial color="#FF2A55" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/**
 * Realistic 3D Translucent Biological Cell
 */
function SpecimenCell({ position, radius = 0.6, color = '#FF2A55', isFocal = false, progress = 0 }) {
  const groupRef = useRef()
  const membraneRef = useRef()
  const nucleusRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!groupRef.current) return

    const rate = isFocal ? 0.7 : 1.1
    groupRef.current.position.y = position[1] + Math.sin(t * rate + position[0]) * 0.06
    groupRef.current.position.x = position[0] + Math.cos(t * (rate * 0.8) + position[1]) * 0.05

    if (membraneRef.current) {
      membraneRef.current.rotation.y = t * 0.2
      membraneRef.current.rotation.x = t * 0.12
    }

    if (nucleusRef.current) {
      const breath = 1 + Math.sin(t * 2) * 0.05
      nucleusRef.current.scale.set(breath, breath, breath)
    }

    // Zoom outward dissolve at end of transition (progress > 0.82)
    if (progress > 0.82) {
      const exp = (progress - 0.82) / 0.18
      const s = 1 + exp * 1.6
      groupRef.current.scale.set(s, s, s)
    }
  })

  // Visible once camera approaches the front lens element (progress > 0.25)
  const cellVisibility = progress > 0.25 ? Math.min(1, (progress - 0.25) * 4) : 0
  if (cellVisibility <= 0) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Translucent Membrane */}
      <mesh ref={membraneRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={(isFocal ? 0.24 : 0.15) * cellVisibility}
          roughness={0.1}
          metalness={0.05}
          transmission={0.88}
          thickness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Membrane Equatorial Rim */}
      <mesh>
        <torusGeometry args={[radius * 0.98, radius * 0.016, 12, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFocal ? 1.0 : 0.5}
          transparent
          opacity={0.6 * cellVisibility}
        />
      </mesh>

      {/* Inner Chromatin Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[radius * 0.38, 16, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isFocal ? 0.6 : 0.35}
          transparent
          opacity={0.4 * cellVisibility}
          roughness={0.3}
        />
      </mesh>

      <pointLight color={color} intensity={(isFocal ? 0.8 : 0.35) * cellVisibility} distance={2.5} />
    </group>
  )
}

/**
 * Microscopic Specimen Fluid Plasma Particles
 */
function SpecimenMediumParticles({ count = 75, progress = 0 }) {
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const crimson = new THREE.Color('#FF2A55')
    const white = new THREE.Color('#FFFFFF')

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8
      pos[i * 3 + 2] = -2.5 - Math.random() * 3.5

      const c = Math.random() > 0.45 ? crimson : white
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    return [pos, col]
  }, [count])

  const pointsRef = useRef()
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z = clock.getElapsedTime() * 0.02
    }
  })

  if (progress < 0.3) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={Math.min(0.55, (progress - 0.3) * 2.5)}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Subtle Crimson Scanning Focus Effect Across Microscopic Scene
 */
function MicroscopicScanEffect({ progress = 0 }) {
  const planeRef = useRef()

  useFrame(() => {
    if (planeRef.current && progress >= 0.52 && progress <= 0.85) {
      const scanProgress = (progress - 0.52) / 0.33
      planeRef.current.position.y = 2.2 - scanProgress * 4.4
    }
  })

  if (progress < 0.52 || progress > 0.85) return null

  return (
    <group ref={planeRef} position={[0, 2.2, -3.2]}>
      <mesh>
        <planeGeometry args={[7, 0.025]} />
        <meshBasicMaterial color="#FF2A55" transparent opacity={0.85} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <planeGeometry args={[7, 0.3]} />
        <meshBasicMaterial color="#FF2A55" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/**
 * Camera Motion: Travel Smoothly Toward & Through Objective Lens
 */
function MicroscopeCameraTravel({ progress = 0 }) {
  const { camera } = useThree()

  useFrame(() => {
    let zTarget = 4.8
    if (progress > 0.35) {
      const travelProg = (progress - 0.35) / 0.65
      const eased = Math.pow(travelProg, 1.4)
      zTarget = 4.8 - eased * 7.2 // travels from 4.8 through lens to -2.4
    }

    camera.position.z = zTarget
    camera.position.x = Math.sin(progress * Math.PI) * 0.12
    camera.position.y = Math.cos(progress * Math.PI) * 0.08
    camera.lookAt(0, 0, -3.2)
  })

  return null
}

/**
 * MicroscopeLensTransition — Post-Login Cinematic Transition
 * “MICROSCOPE LENS → MICROSCOPIC WORLD → DASHBOARD”
 *
 * Sequence (~2.1s total):
 * 1. Screen smoothly darkens (#060205 deep obsidian)
 * 2. Realistic microscope objective lens appears
 * 3. Lens subtly rotates / adjusts focus
 * 4. Soft optical light passes through the lens
 * 5. Camera smoothly moves TOWARD the lens
 * 6. Lens fills the screen & camera visually passes THROUGH the lens
 * 7. Brief optical blur / defocus
 * 8. Focus rapidly sharpens
 * 9. Realistic microscopic cellular environment is revealed
 * 10. Subtle crimson scanning/focus effect passes across the scene
 * 11. Microscopic scene smoothly dissolves / zooms outward
 * 12. Existing Dashboard appears
 */
export default function MicroscopeLensTransition({
  active = false,
  isActive = false,
  onComplete,
}) {
  const isTriggered = Boolean(active || isActive)
  const [progress, setProgress] = useState(0)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const hasCompletedRef = useRef(false)

  // Optical defocus blur calculation:
  // Peaks when punching through the glass element (progress 0.46 to 0.62)
  const opticalBlur = useMemo(() => {
    if (progress >= 0.46 && progress <= 0.62) {
      const peak = 1 - Math.abs((progress - 0.54) / 0.08)
      return Math.max(0, peak * 9)
    }
    return 0
  }, [progress])

  useEffect(() => {
    if (!isTriggered) {
      setProgress(0)
      setIsFadingOut(false)
      hasCompletedRef.current = false
      return
    }

    const DURATION = 2100 // 2.1s total cinematic timing
    const startTime = performance.now()

    let animationFrameId
    const tick = (now) => {
      const elapsed = now - startTime
      const p = Math.min(1, elapsed / DURATION)
      setProgress(p)

      if (p > 0.86 && !isFadingOut) {
        setIsFadingOut(true)
      }

      if (p < 1) {
        animationFrameId = requestAnimationFrame(tick)
      } else {
        if (onComplete && !hasCompletedRef.current) {
          hasCompletedRef.current = true
          onComplete()
        }
      }
    }

    animationFrameId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isTriggered, onComplete])

  if (!isTriggered) return null

  return (
    <AnimatePresence>
      <motion.div
        key="microscope-lens-transition-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: isFadingOut ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: 'easeInOut' }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-[#060205] overflow-hidden select-none"
        style={{
          filter: opticalBlur > 0.2 ? `blur(${opticalBlur.toFixed(1)}px)` : 'none',
        }}
      >
        {/* Deep Atmospheric Darkfield Radiance */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[850px] h-[850px] rounded-full blur-[160px] pointer-events-none transition-opacity duration-500"
            style={{
              backgroundColor: '#FF2A55',
              opacity: progress > 0.5 ? 0.22 : 0.12,
            }}
          />
        </div>

        {/* ─── React Three Fiber 3D Microscope Lens & Cellular Scene ───────── */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 4.8], fov: 52 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            {/* Laboratory Optics Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[0, 6, 4]} intensity={0.5} color="#FFFFFF" />
            <pointLight position={[3, 3, 4]} color="#FFFFFF" intensity={1.4} distance={10} />
            <pointLight position={[-3, -2, 2]} color="#FF2A55" intensity={1.6} distance={8} />

            {/* Central Optical Beam Passing Through Lens */}
            <pointLight position={[0, 0, 0]} color="#FF2A55" intensity={1.2} distance={6} />

            {/* 1. Realistic Microscope Objective Lens */}
            <ObjectiveLensAssembly progress={progress} />

            {/* 2. Microscopic Cellular Specimen Field */}
            {MICROSCOPIC_CELLS.map((cell) => (
              <SpecimenCell
                key={cell.id}
                position={cell.position}
                radius={cell.radius}
                color={cell.color}
                isFocal={cell.isFocal}
                progress={progress}
              />
            ))}

            {/* 3. Micro Plasma Fluid Particles in Specimen Medium */}
            <SpecimenMediumParticles count={75} progress={progress} />

            {/* 4. Subtle Crimson Scanning/Focus Line */}
            <MicroscopicScanEffect progress={progress} />

            {/* 5. Smooth Camera Flight Through the Lens */}
            <MicroscopeCameraTravel progress={progress} />
          </Canvas>
        </div>

        {/* ─── Soft Optical Lens Flare Streak (When Passing Through Glass) ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: progress >= 0.45 && progress <= 0.6 ? [0, 0.75, 0] : 0,
            scaleX: progress >= 0.45 && progress <= 0.6 ? [0.4, 1.8, 2.2] : 0.4,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-[2px] pointer-events-none z-30"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,42,85,0.2) 20%, #FF2A55 45%, #FFFFFF 50%, #FF2A55 55%, rgba(255,42,85,0.2) 80%, transparent 100%)',
            boxShadow: '0 0 20px 2px #FF2A55, 0 0 35px 4px rgba(255,42,85,0.5)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
