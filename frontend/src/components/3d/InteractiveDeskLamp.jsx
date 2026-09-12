import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Procedural Volumetric Light Beam Cone
 * Casts a soft translucent atmospheric glow from the lamp shade
 */
function VolumetricBeam({ intensity = 1 }) {
  const coneGeo = useMemo(() => {
    // Cylinder geometry with top radius matching lamp shade opening, bottom radius wide
    const geo = new THREE.CylinderGeometry(0.35, 1.9, 3.8, 32, 1, true)
    // Translate origin to top of cone so it rotates naturally with the lamp head
    geo.translate(0, -1.9, 0)
    return geo
  }, [])

  return (
    <mesh geometry={coneGeo} position={[0, 0, 0]}>
      <meshBasicMaterial
        color="#FFEEDD"
        transparent
        opacity={0.12 * intensity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Floating Dust Particles suspended within the lamp's light beam
 */
function BeamDustParticles({ count = 65 }) {
  const pointsRef = useRef()

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Cylindrical distribution below lamp
      const r = Math.random() * 1.5
      const theta = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(theta) * r - 0.2
      pos[i * 3 + 1] = -0.4 - Math.random() * 2.8
      pos[i * 3 + 2] = Math.sin(theta) * r + 0.4

      spd[i * 3] = (Math.random() - 0.5) * 0.1
      spd[i * 3 + 1] = 0.05 + Math.random() * 0.1
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.1
    }

    return [pos, spd]
  }, [count])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position

    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) - speeds[i * 3 + 1] * delta * 0.6
      if (y < -3.2) y = -0.4
      posAttr.setY(i, y)

      let x = posAttr.getX(i) + Math.sin(state.clock.elapsedTime + i) * 0.002
      let z = posAttr.getZ(i) + Math.cos(state.clock.elapsedTime + i) * 0.002
      posAttr.setX(i, x)
      posAttr.setZ(i, z)
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#FFF6EE"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Distant Subtle Bio-Constellation Nodes
 * Extremely faint, almost hidden molecular background network
 */
function SubtleBioNodes({ count = 35 }) {
  const points = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16 - 2
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10 + 1
      pos[i * 3 + 2] = -4 - Math.random() * 4
    }
    return pos
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={points} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#38BDF8"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * Pixar-Style Articulated Futuristic 3D Desk Lamp
 * - Weighted beveled base with glowing indicator ring
 * - Articulated dual-strut lower arm & tension elbow
 * - Slender upper beam & wrist gimbal
 * - Flaring conical lamp shade with recessed high-lumen optical bulb
 * - Intelligent cursor tracking & input focus reactivity
 */
export default function InteractiveDeskLamp({ isFocused = false, isMobile = false }) {
  // References for kinematic joints
  const baseGroupRef = useRef()
  const lowerArmRef = useRef()
  const elbowRef = useRef()
  const upperArmRef = useRef()
  const headGroupRef = useRef()
  const spotLightRef = useRef()

  // Materials (Anodized Matte Obsidian + Titanium Chrome Hardware)
  const materials = useMemo(() => {
    return {
      bodyMat: new THREE.MeshStandardMaterial({
        color: '#1E232B',
        roughness: 0.35,
        metalness: 0.85,
      }),
      accentMat: new THREE.MeshStandardMaterial({
        color: '#E2E8F0',
        roughness: 0.15,
        metalness: 0.95,
      }),
      darkMat: new THREE.MeshStandardMaterial({
        color: '#0D1117',
        roughness: 0.5,
        metalness: 0.7,
      }),
      innerShadeMat: new THREE.MeshStandardMaterial({
        color: '#FFF8F0',
        roughness: 0.1,
        metalness: 0.9,
      }),
      bulbMat: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#FFF2E0',
        emissiveIntensity: 3.5,
        roughness: 0.1,
      }),
      statusRingMat: new THREE.MeshStandardMaterial({
        color: '#FF2A55',
        emissive: '#FF2A55',
        emissiveIntensity: 1.8,
        roughness: 0.2,
      }),
      deskMat: new THREE.MeshStandardMaterial({
        color: '#0A0E14',
        roughness: 0.65,
        metalness: 0.2,
      }),
    }
  }, [])

  // Geometries
  const geometries = useMemo(() => {
    return {
      baseGeo: new THREE.CylinderGeometry(1.05, 1.15, 0.18, 48),
      statusRingGeo: new THREE.TorusGeometry(0.85, 0.018, 16, 48),
      bracketGeo: new THREE.BoxGeometry(0.28, 0.45, 0.36),
      strutGeo: new THREE.CylinderGeometry(0.042, 0.042, 1.9, 16),
      elbowDiscGeo: new THREE.CylinderGeometry(0.2, 0.2, 0.28, 28),
      pinGeo: new THREE.CylinderGeometry(0.06, 0.06, 0.34, 16),
      wristGeo: new THREE.SphereGeometry(0.13, 24, 24),
      socketCapGeo: new THREE.CylinderGeometry(0.22, 0.25, 0.32, 32),
      // Lamp shade: flaring conical hood
      shadeGeo: new THREE.CylinderGeometry(0.68, 0.26, 0.95, 36, 1, true),
      bulbGeo: new THREE.SphereGeometry(0.22, 24, 24),
    }
  }, [])

  // Frame animation loop for organic personality
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { x: px, y: py } = state.pointer

    // 1. Idle breathing micro-nod (gentle, living companion vibe)
    const breath = Math.sin(t * 1.5) * 0.025

    // 2. Intelligent head tracking target calculation
    let targetHeadYaw = 0
    let targetHeadPitch = 0
    let targetHeadRoll = 0

    if (isFocused) {
      // When user focuses on input: turn attentively towards the right (the form)
      targetHeadYaw = 0.45 + px * 0.15
      targetHeadPitch = -0.15 - py * 0.12 + breath
      targetHeadRoll = 0.08
    } else {
      // Natural curious cursor tracking
      targetHeadYaw = px * 0.55
      targetHeadPitch = -py * 0.4 + breath
      targetHeadRoll = -px * 0.12
    }

    // Smooth spring lerp for Pixar-like organic responsiveness
    if (headGroupRef.current) {
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        targetHeadYaw,
        0.045
      )
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.x,
        targetHeadPitch,
        0.045
      )
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.z,
        targetHeadRoll,
        0.045
      )
    }

    // Subtle lower arm flex during movement
    if (lowerArmRef.current) {
      const targetArmTilt = -0.15 + px * 0.08
      lowerArmRef.current.rotation.z = THREE.MathUtils.lerp(
        lowerArmRef.current.rotation.z,
        targetArmTilt,
        0.03
      )
    }

    // Dynamic light intensity shift on input focus
    if (spotLightRef.current) {
      const targetIntensity = isFocused ? 4.6 : 3.0
      spotLightRef.current.intensity = THREE.MathUtils.lerp(
        spotLightRef.current.intensity,
        targetIntensity,
        0.06
      )
    }
  })

  return (
    <group position={isMobile ? [0, -0.6, 0] : [-0.3, -0.4, 0]} scale={isMobile ? 0.78 : 1.0}>
      {/* ─── Desk Surface Plane ────────────────────────────────────────── */}
      <mesh
        position={[0, -2.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={materials.deskMat}
        receiveShadow
      >
        <planeGeometry args={[16, 16]} />
      </mesh>

      {/* Subtle Radial Light Pool decal on desk surface */}
      <mesh position={[0.2, -2.09, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 2.4, 32]} />
        <meshBasicMaterial
          color="#FFE8D6"
          transparent
          opacity={isFocused ? 0.22 : 0.14}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ─── Subtle Bio-Molecular Nodes in Distant Background ──────────── */}
      <SubtleBioNodes count={35} />

      {/* ─── 1. Heavy Weighted Base Assembly ──────────────────────────── */}
      <group ref={baseGroupRef} position={[-0.8, -2.0, 0]}>
        {/* Main Base Disc */}
        <mesh geometry={geometries.baseGeo} material={materials.bodyMat} castShadow receiveShadow />

        {/* Embedded Crimson/White Glowing Telemetry Ring */}
        <mesh
          position={[0, 0.095, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={geometries.statusRingGeo}
          material={materials.statusRingMat}
        />

        {/* Lower Pivot Axle Mount */}
        <mesh
          position={[0, 0.26, 0]}
          geometry={geometries.bracketGeo}
          material={materials.accentMat}
          castShadow
        />

        {/* ─── 2. Articulated Lower Arm (Dual Struts) ─────────────────── */}
        <group ref={lowerArmRef} position={[0, 0.4, 0]} rotation={[0, 0, 0.22]}>
          {/* Lower Pivot Pin */}
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            geometry={geometries.pinGeo}
            material={materials.darkMat}
          />

          {/* Left Parallel Strut */}
          <mesh
            position={[-0.09, 0.95, 0]}
            geometry={geometries.strutGeo}
            material={materials.bodyMat}
            castShadow
          />
          {/* Right Parallel Strut */}
          <mesh
            position={[0.09, 0.95, 0]}
            geometry={geometries.strutGeo}
            material={materials.bodyMat}
            castShadow
          />

          {/* ─── 3. Elbow Articulation Joint ──────────────────────────── */}
          <group ref={elbowRef} position={[0, 1.9, 0]} rotation={[0, 0, -0.45]}>
            {/* Elbow Central Hinge Disc */}
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              geometry={geometries.elbowDiscGeo}
              material={materials.accentMat}
              castShadow
            />
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              geometry={geometries.pinGeo}
              material={materials.darkMat}
            />

            {/* ─── 4. Articulated Upper Arm Beam ──────────────────────── */}
            <group ref={upperArmRef} position={[0, 0, 0]} rotation={[0, 0, -0.2]}>
              {/* Upper Strut Pair */}
              <mesh
                position={[-0.08, 0.8, 0]}
                geometry={geometries.strutGeo}
                material={materials.bodyMat}
                scale={[0.9, 0.85, 0.9]}
                castShadow
              />
              <mesh
                position={[0.08, 0.8, 0]}
                geometry={geometries.strutGeo}
                material={materials.bodyMat}
                scale={[0.9, 0.85, 0.9]}
                castShadow
              />

              {/* ─── 5. Lamp Wrist Gimbal & Shade Head ────────────────── */}
              <group position={[0, 1.55, 0]}>
                {/* Wrist Ball Joint */}
                <mesh geometry={geometries.wristGeo} material={materials.accentMat} />

                {/* Intelligent Dynamic Head Group (rotates & pitches) */}
                <group ref={headGroupRef} position={[0, 0.15, 0]}>
                  {/* Socket Connector Cap */}
                  <mesh
                    position={[0, 0.2, 0]}
                    geometry={geometries.socketCapGeo}
                    material={materials.darkMat}
                  />

                  {/* Main Flaring Conical Shade */}
                  <group position={[0, 0.45, 0]} rotation={[Math.PI, 0, 0]}>
                    <mesh
                      geometry={geometries.shadeGeo}
                      material={materials.bodyMat}
                      castShadow
                      receiveShadow
                    />
                    {/* Inner Reflective High-Gloss Lining */}
                    <mesh
                      geometry={geometries.shadeGeo}
                      material={materials.innerShadeMat}
                      scale={[0.98, 0.98, 0.98]}
                    />

                    {/* Recessed High-Lumen Bulb */}
                    <mesh
                      position={[0, 0.15, 0]}
                      geometry={geometries.bulbGeo}
                      material={materials.bulbMat}
                    />

                    {/* ─── Active Illumination ───────────────────────── */}
                    {/* Primary Downward Focused Spotlight */}
                    <spotLight
                      ref={spotLightRef}
                      position={[0, 0.2, 0]}
                      target-position={[0, -5, 0]}
                      color="#FFF5EA"
                      intensity={3.2}
                      angle={Math.PI / 4.8}
                      penumbra={0.65}
                      distance={9}
                      castShadow
                      shadow-mapSize-width={1024}
                      shadow-mapSize-height={1024}
                    />

                    {/* Soft Warm Bulb Ambient Radiance */}
                    <pointLight
                      position={[0, 0.2, 0]}
                      color="#FFE6CC"
                      intensity={1.2}
                      distance={2.8}
                    />

                    {/* Volumetric Soft Light Cone */}
                    <VolumetricBeam intensity={isFocused ? 1.4 : 1.0} />

                    {/* Floating Dust Particles Dancing in Light Beam */}
                    <BeamDustParticles count={isMobile ? 40 : 65} />
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
