import { useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, Sphere, Cylinder, Torus, Ring } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Procedural Living Biological Cell
 * Revealed when zooming through the microscope lens.
 * Features:
 * - Translucent fluid membrane with undulating organic motion
 * - Glowing chromatic nucleus
 * - Floating mitochondria & organelles
 * - Streaming bioluminescent cytoplasm particles
 * - Neural data network connections forming the biological intelligence mark
 */
function LivingCell({ active = false, transitionProgress = 0 }) {
  const cellGroupRef = useRef()
  const membraneRef = useRef()
  const nucleusRef = useRef()
  const organellesRef = useRef()
  const particlesRef = useRef()
  const networkRef = useRef()

  // Generate cytoplasmic streaming particles
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(60 * 3)
    for (let i = 0; i < 60; i++) {
      const r = 0.4 + Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  // Organelle coordinates
  const organelles = useMemo(() => [
    { pos: [0.65, 0.35, 0.4], rot: [0.4, 0.2, 0.8], scale: [0.22, 0.12, 0.12], color: '#FF2A55' },
    { pos: [-0.6, -0.4, 0.3], rot: [-0.3, 0.6, 0.2], scale: [0.25, 0.14, 0.12], color: '#DC2626' },
    { pos: [0.3, -0.7, -0.3], rot: [0.8, -0.4, 0.3], scale: [0.2, 0.11, 0.11], color: '#FFA0B4' },
    { pos: [-0.45, 0.6, -0.35], rot: [-0.5, -0.3, 0.7], scale: [0.24, 0.13, 0.12], color: '#FF2A55' },
    { pos: [0.75, -0.2, -0.4], rot: [0.2, 0.8, -0.4], scale: [0.18, 0.1, 0.1], color: '#FFFFFF' },
  ], [])

  // Neural network connections (connecting organelles to nucleus)
  const networkLines = useMemo(() => {
    const lines = []
    organelles.forEach((org) => {
      const p1 = new THREE.Vector3(0, 0, 0)
      const p2 = new THREE.Vector3(...org.pos)
      const curve = new THREE.QuadraticBezierCurve3(
        p1,
        new THREE.Vector3(org.pos[0] * 0.5, org.pos[1] * 0.5 + 0.2, org.pos[2] * 0.5),
        p2
      )
      lines.push(curve.getPoints(16))
    })
    return lines
  }, [organelles])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!cellGroupRef.current) return

    // Organic cellular breathing
    const pulse = 1 + Math.sin(t * 1.8) * 0.04
    cellGroupRef.current.scale.set(pulse, pulse, pulse)
    cellGroupRef.current.rotation.y = t * 0.15
    cellGroupRef.current.rotation.z = Math.sin(t * 0.1) * 0.08

    // Nucleus inner luminescence rotation
    if (nucleusRef.current) {
      nucleusRef.current.rotation.x = t * 0.25
      nucleusRef.current.rotation.y = -t * 0.35
    }

    // Organelle gentle drift
    if (organellesRef.current) {
      organellesRef.current.rotation.y = t * 0.1
    }
  })

  return (
    <group ref={cellGroupRef} visible={active}>
      {/* ─── 1. Outer Translucent Cell Membrane ─────────────────────────── */}
      <mesh ref={membraneRef}>
        <sphereGeometry args={[1.35, 48, 48]} />
        <meshPhysicalMaterial
          color="#FF2A55"
          emissive="#5A0012"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.05}
          transmission={0.85}
          thickness={1.4}
          ior={1.38}
          transparent
          opacity={0.7}
          wireframe={false}
        />
      </mesh>

      {/* Outer Membrane Halo / Atmospheric Sheen */}
      <mesh scale={1.04}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial
          color="#FF4D73"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ─── 2. Glowing Core Nucleus ────────────────────────────────────── */}
      <group ref={nucleusRef}>
        <mesh>
          <sphereGeometry args={[0.52, 36, 36]} />
          <meshPhysicalMaterial
            color="#FFFFFF"
            emissive="#FF2A55"
            emissiveIntensity={1.0}
            roughness={0.2}
            metalness={0.1}
            transmission={0.4}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* Nucleolus Core */}
        <mesh scale={0.55}>
          <sphereGeometry args={[0.52, 24, 24]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#FF2A55"
            emissiveIntensity={2.0}
          />
        </mesh>

        {/* Nuclear chromatin ring */}
        <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
          <torusGeometry args={[0.62, 0.02, 16, 48]} />
          <meshStandardMaterial color="#FF2A55" emissive="#FF2A55" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* ─── 3. Organelles & Mitochondria ───────────────────────────────── */}
      <group ref={organellesRef}>
        {organelles.map((org, i) => (
          <group key={i} position={org.pos} rotation={org.rot} scale={org.scale}>
            <mesh>
              <capsuleGeometry args={[0.8, 1.4, 16, 16]} />
              <meshPhysicalMaterial
                color={org.color}
                emissive={org.color}
                emissiveIntensity={0.8}
                roughness={0.2}
                metalness={0.1}
                transmission={0.6}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Inner Cristae fold */}
            <mesh scale={[0.6, 0.7, 0.6]}>
              <capsuleGeometry args={[0.8, 1.4, 8, 8]} />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive={org.color}
                emissiveIntensity={1.4}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ─── 4. Cytoplasmic Streaming Particles ─────────────────────────── */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#FF2A55"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ─── 5. Neural Biological Data Network (JeevaDrishti Vision Mark) ── */}
      <group ref={networkRef}>
        {networkLines.map((pts, idx) => {
          const geom = new THREE.BufferGeometry().setFromPoints(pts)
          return (
            <line key={idx} geometry={geom}>
              <lineBasicMaterial
                color={idx % 2 === 0 ? '#FF2A55' : '#FFFFFF'}
                transparent
                opacity={0.65}
                linewidth={1.5}
              />
            </line>
          )
        })}
      </group>
    </group>
  )
}

/**
 * Futuristic 3D Laboratory Microscope
 * 
 * Crafted to communicate:
 * Premium modern laboratory microscope with matte white / dark titanium body,
 * subtle crimson illumination, realistic glass optics, and interactive lens.
 */
export default function FuturisticMicroscope({
  stage = 'idle', // 'idle' | 'zooming' | 'cell' | 'auth'
  onLensClick,
  onHoverLens,
}) {
  const groupRef = useRef()
  const turretRef = useRef()
  const coarseKnobRef = useRef()
  const fineKnobRef = useRef()
  const lensTargetRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Material tokens
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#E2E8F0', // Clean matte clinical white/light platinum
        roughness: 0.28,
        metalness: 0.15,
      }),
    []
  )

  const darkTitaniumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0F172A', // Deep dark slate / titanium
        roughness: 0.2,
        metalness: 0.85,
      }),
    []
  )

  const brushedGoldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FF2A55',
        emissive: '#DC2626',
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.8,
      }),
    []
  )

  const crimsonEmissiveMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FF2A55',
        emissive: '#FF2A55',
        emissiveIntensity: 1.2,
        roughness: 0.1,
      }),
    []
  )

  const glassOpticMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        transmission: 0.96,
        roughness: 0.02,
        ior: 1.52,
        thickness: 0.8,
        transparent: true,
        opacity: 0.25,
      }),
    []
  )

  // Animation Loop
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Subtle breathing rotation when in idle mode
    if (groupRef.current) {
      if (stage === 'idle') {
        groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.08
        groupRef.current.position.y = -0.15 + Math.sin(t * 0.8) * 0.02
      } else if (stage === 'zooming') {
        // Focus ring turns rapidly during zoom
        if (fineKnobRef.current) fineKnobRef.current.rotation.x = t * 6.0
        if (turretRef.current) turretRef.current.rotation.y = Math.sin(t * 2) * 0.15
      }
    }

    // Coarse & fine knobs gentle idle rotation
    if (coarseKnobRef.current && stage === 'idle') {
      coarseKnobRef.current.rotation.x = Math.sin(t * 0.5) * 0.1
    }
  })

  const isCellActive = stage === 'cell' || stage === 'auth'
  const isMicroscopeVisible = stage !== 'cell' && stage !== 'auth'

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* ─── 3D MICROSCOPE (Visible in Stages 1 & 2) ───────────────────── */}
      {isMicroscopeVisible && (
        <group scale={1.15}>
          {/* 1. Heavy Laboratory Base Stand */}
          <mesh position={[0, -1.8, 0]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[1.3, 1.45, 0.28, 36]} />
          </mesh>

          {/* Base Inset Accent Ring (Soft Crimson Glow) */}
          <mesh position={[0, -1.64, 0]} material={crimsonEmissiveMaterial}>
            <torusGeometry args={[1.15, 0.02, 16, 48]} />
          </mesh>

          {/* Base Beveled Anti-Vibration Footpads */}
          {[-0.9, 0.9].map((x) =>
            [-0.7, 0.7].map((z) => (
              <mesh key={`${x}-${z}`} position={[x, -1.95, z]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.18, 0.2, 0.08, 16]} />
              </mesh>
            ))
          )}

          {/* 2. Sub-Stage Light Collector / Field Diaphragm */}
          <mesh position={[0, -1.5, 0.15]} material={darkTitaniumMaterial}>
            <cylinderGeometry args={[0.38, 0.45, 0.35, 24]} />
          </mesh>
          <mesh position={[0, -1.32, 0.15]} material={glassOpticMaterial}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
          </mesh>
          {/* Light emitter ring */}
          <mesh position={[0, -1.33, 0.15]} material={crimsonEmissiveMaterial}>
            <torusGeometry args={[0.26, 0.015, 16, 32]} />
          </mesh>

          {/* 3. Ergonomic Curved C-Arm (Upright Column) */}
          <mesh position={[0, -0.35, -0.65]} material={bodyMaterial}>
            <boxGeometry args={[0.48, 2.3, 0.55]} />
          </mesh>
          {/* Upper Arm Curve forward toward optical head */}
          <mesh position={[0, 0.9, -0.25]} rotation={[0.42, 0, 0]} material={bodyMaterial}>
            <boxGeometry args={[0.46, 0.8, 0.52]} />
          </mesh>

          {/* 4. Dual Coaxial Focus Knobs (Coarse & Fine) */}
          <group position={[-0.32, -0.6, -0.65]}>
            {/* Coarse Knob Left */}
            <mesh ref={coarseKnobRef} rotation={[0, 0, Math.PI / 2]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.34, 0.34, 0.12, 24]} />
            </mesh>
            {/* Fine Knob Left */}
            <mesh ref={fineKnobRef} position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={brushedGoldMaterial}>
              <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
            </mesh>
          </group>

          <group position={[0.32, -0.6, -0.65]}>
            {/* Coarse Knob Right */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.34, 0.34, 0.12, 24]} />
            </mesh>
            {/* Fine Knob Right */}
            <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={brushedGoldMaterial}>
              <cylinderGeometry args={[0.2, 0.2, 0.08, 24]} />
            </mesh>
          </group>

          {/* 5. Precision Specimen Mechanical Stage */}
          <mesh position={[0, -0.55, 0.18]} material={darkTitaniumMaterial}>
            <boxGeometry args={[1.5, 0.08, 1.3]} />
          </mesh>
          {/* Stage Optical Aperture Hole */}
          <mesh position={[0, -0.5, 0.18]} material={brushedGoldMaterial}>
            <torusGeometry args={[0.28, 0.02, 16, 32]} />
          </mesh>
          {/* Specimen Slide Plate with Grid Calibration */}
          <mesh position={[0, -0.49, 0.18]} material={glassOpticMaterial}>
            <boxGeometry args={[0.75, 0.02, 0.35]} />
          </mesh>

          {/* 6. Revolving Objective Turret / Nosepiece */}
          <group ref={turretRef} position={[0, 0.45, 0.18]}>
            <mesh material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.55, 0.48, 0.22, 28]} />
            </mesh>
            <mesh position={[0, 0.12, 0]} material={brushedGoldMaterial}>
              <torusGeometry args={[0.52, 0.02, 16, 32]} />
            </mesh>

            {/* Objective Lens 1: Primary Working Lens (Pointing Down directly to stage) */}
            <group
              ref={lensTargetRef}
              position={[0, -0.4, 0]}
              onClick={(e) => {
                e.stopPropagation()
                if (onLensClick) onLensClick()
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(true)
                if (onHoverLens) onHoverLens(true)
              }}
              onPointerOut={() => {
                setHovered(false)
                if (onHoverLens) onHoverLens(false)
              }}
              className="cursor-pointer"
            >
              {/* Stepped Optical Barrel */}
              <mesh material={bodyMaterial}>
                <cylinderGeometry args={[0.22, 0.18, 0.45, 24]} />
              </mesh>
              <mesh position={[0, -0.25, 0]} material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.16, 0.12, 0.18, 24]} />
              </mesh>

              {/* Gold Magnification Band (e.g. 100x Oil Immersion) */}
              <mesh position={[0, 0.05, 0]} material={brushedGoldMaterial}>
                <torusGeometry args={[0.21, 0.015, 12, 24]} />
              </mesh>

              {/* Front Optic Glass Element */}
              <mesh position={[0, -0.34, 0]} material={glassOpticMaterial}>
                <cylinderGeometry args={[0.1, 0.1, 0.03, 24]} />
              </mesh>

              {/* ─── INTERACTION RING: “Touch to Explore” ─────────────────── */}
              <group position={[0, -0.42, 0]}>
                <mesh material={crimsonEmissiveMaterial} scale={hovered ? 1.25 : 1.0}>
                  <torusGeometry args={[0.22, hovered ? 0.03 : 0.018, 16, 36]} />
                </mesh>
                {/* Secondary Ruby Radiant Halo */}
                <mesh position={[0, -0.02, 0]} scale={hovered ? 1.4 : 1.15}>
                  <torusGeometry args={[0.28, 0.01, 16, 36]} />
                  <meshBasicMaterial
                    color="#DC2626"
                    transparent
                    opacity={hovered ? 0.85 : 0.45}
                  />
                </mesh>
              </group>
            </group>

            {/* Objective Lens 2: Angled Secondary (40x) */}
            <group position={[0.34, -0.3, -0.15]} rotation={[0.4, 0.6, 0]}>
              <mesh material={bodyMaterial}>
                <cylinderGeometry args={[0.18, 0.15, 0.38, 20]} />
              </mesh>
              <mesh position={[0, 0.02, 0]} material={crimsonEmissiveMaterial}>
                <torusGeometry args={[0.17, 0.01, 12, 20]} />
              </mesh>
            </group>

            {/* Objective Lens 3: Angled Tertiary (10x) */}
            <group position={[-0.34, -0.3, -0.15]} rotation={[0.4, -0.6, 0]}>
              <mesh material={bodyMaterial}>
                <cylinderGeometry args={[0.18, 0.15, 0.32, 20]} />
              </mesh>
              <mesh position={[0, 0.02, 0]} material={brushedGoldMaterial}>
                <torusGeometry args={[0.17, 0.01, 12, 20]} />
              </mesh>
            </group>
          </group>

          {/* 7. Trinocular Optical Viewing Head */}
          <group position={[0, 1.45, -0.12]}>
            {/* Head Base Prism Housing */}
            <mesh material={bodyMaterial}>
              <boxGeometry args={[0.7, 0.38, 0.6]} />
            </mesh>
            <mesh position={[0, 0.15, 0]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.22, 0.28, 0.25, 24]} />
            </mesh>

            {/* Left Binocular Eyepiece Tube */}
            <group position={[-0.26, 0.42, 0.28]} rotation={[-0.55, -0.22, 0]}>
              <mesh material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.14, 0.14, 0.65, 20]} />
              </mesh>
              {/* Rubber Eyecup */}
              <mesh position={[0, 0.34, 0]} material={bodyMaterial}>
                <cylinderGeometry args={[0.17, 0.14, 0.12, 20]} />
              </mesh>
              {/* Eyepiece Glass */}
              <mesh position={[0, 0.38, 0]} material={glassOpticMaterial}>
                <cylinderGeometry args={[0.13, 0.13, 0.02, 20]} />
              </mesh>
            </group>

            {/* Right Binocular Eyepiece Tube */}
            <group position={[0.26, 0.42, 0.28]} rotation={[-0.55, 0.22, 0]}>
              <mesh material={darkTitaniumMaterial}>
                <cylinderGeometry args={[0.14, 0.14, 0.65, 20]} />
              </mesh>
              {/* Rubber Eyecup */}
              <mesh position={[0, 0.34, 0]} material={bodyMaterial}>
                <cylinderGeometry args={[0.17, 0.14, 0.12, 20]} />
              </mesh>
              {/* Eyepiece Glass */}
              <mesh position={[0, 0.38, 0]} material={glassOpticMaterial}>
                <cylinderGeometry args={[0.13, 0.13, 0.02, 20]} />
              </mesh>
            </group>

            {/* Vertical Phototube (Camera / AI Sensor Port) */}
            <mesh position={[0, 0.45, -0.05]} material={darkTitaniumMaterial}>
              <cylinderGeometry args={[0.15, 0.16, 0.4, 20]} />
            </mesh>
            <mesh position={[0, 0.66, -0.05]} material={crimsonEmissiveMaterial}>
              <torusGeometry args={[0.14, 0.015, 12, 24]} />
            </mesh>
          </group>
        </group>
      )}

      {/* ─── 3D LIVING BIOLOGICAL CELL (Revealed in Stages 3 & 4) ──────── */}
      <LivingCell active={isCellActive} />
    </group>
  )
}
