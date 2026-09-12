import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Closed Sleepy Eye Geometry (◡)
 */
function createSleepyEyeGeometry(radius = 0.08) {
  const curve = new THREE.EllipseCurve(
    0, 0,
    radius, radius * 0.7,
    0, Math.PI,
    false,
    0
  )
  const points = curve.getPoints(24)
  return new THREE.BufferGeometry().setFromPoints(points)
}

/**
 * Original JeevaDrishti Character Desk Lamp (Matching media_1789008351610.png)
 * 
 * Features:
 * - Bucket-shaped charcoal lampshade with expressive eyes:
 *   - Sleeping curved eyes (◡ ◡) when OFF
 *   - Alert open eyes (● ●) with cursor-tracking pupils when ON
 * - Sleek vertical brushed-silver central pole and circular beveled base
 * - Dual Pull Ropes: Both Left & Right side ropes with shiny pearl beads
 * - Elastic spring physics on both ropes (drag or click either rope to toggle)
 * - Soft downward illumination and desk reflection pool
 */
export default function PullCordLamp({
  isLampOn = false,
  onToggle = () => {},
  isInputFocused = false,
  isMobile = false,
}) {
  // Dual-Rope Physics State (Left & Right)
  const [activeRope, setActiveRope] = useState(null) // 'left' | 'right' | null
  const [pullLeft, setPullLeft] = useState(0)
  const [pullRight, setPullRight] = useState(0)

  const pullLeftRef = useRef(0)
  const velocityLeftRef = useRef(0)

  const pullRightRef = useRef(0)
  const velocityRightRef = useRef(0)

  const dragStartYRef = useRef(0)

  // Mesh & Group References
  const shadeRef = useRef()
  const spotLightRef = useRef()
  const innerLightRef = useRef()
  const leftPupilRef = useRef()
  const rightPupilRef = useRef()

  // Left Rope References
  const leftCordRef = useRef()
  const leftBeadRef = useRef()

  // Right Rope References
  const rightCordRef = useRef()
  const rightBeadRef = useRef()

  // Rope origin anchors under the lampshade rim
  const restCordLength = 0.95
  const ropeLeftOrigin = { x: -0.65, y: -0.15, z: 0.10 }
  const ropeRightOrigin = { x: 0.65, y: -0.15, z: 0.10 }

  // ─── Materials ─────────────────────────────────────────────────────────────
  const materials = useMemo(() => {
    return {
      // Charcoal matte outer bucket shade (exactly matching reference image)
      shadeOuterMat: new THREE.MeshStandardMaterial({
        color: '#1E232B',
        roughness: 0.45,
        metalness: 0.15,
      }),
      // Soft light cream inner shade reflector
      shadeInnerMat: new THREE.MeshStandardMaterial({
        color: '#E2E8F0',
        roughness: 0.25,
        metalness: 0.10,
      }),
      // Brushed silver / aluminum stem pole
      stemMat: new THREE.MeshStandardMaterial({
        color: '#94A3B8',
        roughness: 0.28,
        metalness: 0.75,
      }),
      // Circular base plate
      baseMat: new THREE.MeshStandardMaterial({
        color: '#64748B',
        roughness: 0.35,
        metalness: 0.65,
      }),
      // Frosted warm bulb
      bulbMat: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: isLampOn ? '#FFF2DF' : '#000000',
        emissiveIntensity: isLampOn ? 4.0 : 0.0,
        roughness: 0.15,
      }),
      // Face materials
      eyeClosedMat: new THREE.LineBasicMaterial({
        color: '#080B10',
        linewidth: 3,
      }),
      eyeOpenBaseMat: new THREE.MeshBasicMaterial({
        color: '#090D14',
      }),
      pupilMat: new THREE.MeshBasicMaterial({
        color: '#05070A',
      }),
      glintMat: new THREE.MeshBasicMaterial({
        color: '#FFFFFF',
      }),
      // Pull cords (clean white / silver rope)
      cordMat: new THREE.MeshStandardMaterial({
        color: '#CBD5E1',
        roughness: 0.35,
        metalness: 0.25,
      }),
      // Shiny pearl beads
      beadMat: new THREE.MeshStandardMaterial({
        color: '#F8FAFC',
        roughness: 0.12,
        metalness: 0.90,
      }),
      // Desk surface
      deskMat: new THREE.MeshStandardMaterial({
        color: '#070A10',
        roughness: 0.65,
        metalness: 0.20,
      }),
    }
  }, [isLampOn])

  // ─── Geometries ────────────────────────────────────────────────────────────
  const geometries = useMemo(() => {
    return {
      baseGeo: new THREE.CylinderGeometry(0.75, 0.82, 0.08, 48),
      stemGeo: new THREE.CylinderGeometry(0.065, 0.065, 2.2, 32),
      // Tapered bucket lampshade matching original screenshot
      shadeGeo: new THREE.CylinderGeometry(0.68, 0.98, 1.42, 48, 1, true),
      bulbGeo: new THREE.SphereGeometry(0.20, 24, 24),
      closedEyeGeo: createSleepyEyeGeometry(0.085),
      openEyeGeo: new THREE.CircleGeometry(0.075, 24),
      pupilGeo: new THREE.CircleGeometry(0.045, 24),
      glintGeo: new THREE.CircleGeometry(0.015, 16),
      cordSegmentGeo: new THREE.CylinderGeometry(0.012, 0.012, 1, 12),
      beadGeo: new THREE.SphereGeometry(0.09, 24, 24),
    }
  }, [])

  // Trigger switch toggle
  const triggerSwitch = () => {
    onToggle(!isLampOn)
  }

  // Pointer drag on Left or Right rope
  const handlePointerDownRope = (ropeSide) => (e) => {
    e.stopPropagation()
    setActiveRope(ropeSide)
    dragStartYRef.current = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)
  }

  // Instant click on Left or Right bead
  const handleClickBead = (ropeSide) => (e) => {
    e.stopPropagation()
    if (ropeSide === 'left') {
      pullLeftRef.current = 0.55
      setPullLeft(0.55)
      velocityLeftRef.current = -14
    } else {
      pullRightRef.current = 0.55
      setPullRight(0.55)
      velocityRightRef.current = -14
    }
    triggerSwitch()
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!activeRope) return
      const currentY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)
      const diffPx = currentY - dragStartYRef.current
      const dragUnits = Math.max(0, Math.min(1.4, diffPx * 0.009))

      if (activeRope === 'left') {
        pullLeftRef.current = dragUnits
        setPullLeft(dragUnits)
      } else if (activeRope === 'right') {
        pullRightRef.current = dragUnits
        setPullRight(dragUnits)
      }
    }

    const handlePointerUp = () => {
      if (!activeRope) return

      const currentPull = activeRope === 'left' ? pullLeftRef.current : pullRightRef.current
      if (currentPull > 0.20 || currentPull === 0) {
        triggerSwitch()
      }

      if (activeRope === 'left') {
        velocityLeftRef.current = -pullLeftRef.current * 28
      } else {
        velocityRightRef.current = -pullRightRef.current * 28
      }
      setActiveRope(null)
    }

    if (activeRope) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('touchmove', handlePointerMove)
      window.addEventListener('touchend', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
    }
  }, [activeRope, isLampOn])

  // Physics loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    const { x: px, y: py } = state.pointer
    const k = 220
    const damping = 16

    // 1. Spring physics for Left Rope
    if (activeRope !== 'left' && (pullLeftRef.current > 0.001 || Math.abs(velocityLeftRef.current) > 0.01)) {
      const force = -k * pullLeftRef.current - damping * velocityLeftRef.current
      velocityLeftRef.current += force * delta
      pullLeftRef.current += velocityLeftRef.current * delta
      if (pullLeftRef.current < 0 && Math.abs(velocityLeftRef.current) < 0.1) {
        pullLeftRef.current = 0
        velocityLeftRef.current = 0
      }
      setPullLeft(Math.max(0, pullLeftRef.current))
    }

    // 2. Spring physics for Right Rope
    if (activeRope !== 'right' && (pullRightRef.current > 0.001 || Math.abs(velocityRightRef.current) > 0.01)) {
      const force = -k * pullRightRef.current - damping * velocityRightRef.current
      velocityRightRef.current += force * delta
      pullRightRef.current += velocityRightRef.current * delta
      if (pullRightRef.current < 0 && Math.abs(velocityRightRef.current) < 0.1) {
        pullRightRef.current = 0
        velocityRightRef.current = 0
      }
      setPullRight(Math.max(0, pullRightRef.current))
    }

    // Update Left Rope Mesh & Bead
    const lenLeft = restCordLength + pullLeftRef.current
    if (leftCordRef.current) {
      leftCordRef.current.scale.set(1, lenLeft, 1)
      leftCordRef.current.position.set(ropeLeftOrigin.x, ropeLeftOrigin.y - lenLeft / 2, ropeLeftOrigin.z)
    }
    if (leftBeadRef.current) {
      leftBeadRef.current.position.set(ropeLeftOrigin.x, ropeLeftOrigin.y - lenLeft, ropeLeftOrigin.z)
    }

    // Update Right Rope Mesh & Bead
    const lenRight = restCordLength + pullRightRef.current
    if (rightCordRef.current) {
      rightCordRef.current.scale.set(1, lenRight, 1)
      rightCordRef.current.position.set(ropeRightOrigin.x, ropeRightOrigin.y - lenRight / 2, ropeRightOrigin.z)
    }
    if (rightBeadRef.current) {
      rightBeadRef.current.position.set(ropeRightOrigin.x, ropeRightOrigin.y - lenRight, ropeRightOrigin.z)
    }

    // 3. Lampshade gentle breathing and responsive tilt
    if (shadeRef.current) {
      if (isLampOn) {
        const breath = Math.sin(t * 1.8) * 0.02
        const targetRotX = isInputFocused ? -0.06 : -py * 0.10 + breath
        const targetRotY = isInputFocused ? 0.25 : px * 0.18
        shadeRef.current.rotation.x = THREE.MathUtils.lerp(shadeRef.current.rotation.x, targetRotX, 0.05)
        shadeRef.current.rotation.y = THREE.MathUtils.lerp(shadeRef.current.rotation.y, targetRotY, 0.05)
      } else {
        // Sleepy droop
        shadeRef.current.rotation.x = THREE.MathUtils.lerp(shadeRef.current.rotation.x, 0.05, 0.04)
        shadeRef.current.rotation.y = THREE.MathUtils.lerp(shadeRef.current.rotation.y, 0.0, 0.04)
      }
    }

    // 4. Eyes pupil tracking cursor
    if (isLampOn && leftPupilRef.current && rightPupilRef.current) {
      const pupilX = THREE.MathUtils.clamp(px * 0.025, -0.02, 0.02)
      const pupilY = THREE.MathUtils.clamp(-py * 0.02, -0.018, 0.018)
      leftPupilRef.current.position.x = -0.28 + pupilX
      leftPupilRef.current.position.y = 0.08 + pupilY
      rightPupilRef.current.position.x = 0.28 + pupilX
      rightPupilRef.current.position.y = 0.08 + pupilY
    }

    // 5. Spotlight intensity lerp
    if (spotLightRef.current) {
      const targetInt = isLampOn ? (isInputFocused ? 4.8 : 3.4) : 0
      spotLightRef.current.intensity = THREE.MathUtils.lerp(spotLightRef.current.intensity, targetInt, 0.12)
    }
    if (innerLightRef.current) {
      const targetInner = isLampOn ? 1.8 : 0
      innerLightRef.current.intensity = THREE.MathUtils.lerp(innerLightRef.current.intensity, targetInner, 0.12)
    }
  })

  return (
    <group
      position={isMobile ? [0, 0.05, 0] : [-0.20, 0.12, 0]}
      scale={isMobile ? 0.65 : 0.76}
    >
      {/* ─── 1. Table Desk Surface ────────────────────────────────────────── */}
      <mesh position={[0, -1.80, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.deskMat} receiveShadow>
        <planeGeometry args={[18, 18]} />
      </mesh>

      {/* Radial Warm Light Pool on Desk (only when lamp is ON) */}
      {isLampOn && (
        <mesh position={[0.1, -1.79, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 2.4, 48]} />
          <meshBasicMaterial
            color="#FFF2DF"
            transparent
            opacity={isInputFocused ? 0.28 : 0.18}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* ─── 2. Circular Base (Matching original) ─────────────────────────── */}
      <mesh
        position={[0, -1.75, 0]}
        geometry={geometries.baseGeo}
        material={materials.baseMat}
        castShadow
        receiveShadow
      />

      {/* ─── 3. Central Vertical Pole (Matching original) ─────────────────── */}
      <mesh
        position={[0, -0.65, 0]}
        geometry={geometries.stemGeo}
        material={materials.stemMat}
        castShadow
      />

      {/* ─── 4. Bucket Lampshade with Character Face ──────────────────────── */}
      <group ref={shadeRef} position={[0, 0.70, 0]}>
        {/* Outer Bucket Shade */}
        <mesh
          geometry={geometries.shadeGeo}
          material={materials.shadeOuterMat}
          castShadow
          receiveShadow
        />

        {/* Inner Light Reflector */}
        <mesh
          geometry={geometries.shadeGeo}
          material={materials.shadeInnerMat}
          scale={[0.98, 0.98, 0.98]}
        />

        {/* Recessed Bulb inside */}
        <mesh
          position={[0, -0.18, 0]}
          geometry={geometries.bulbGeo}
          material={materials.bulbMat}
        />

        {/* ─── Face Decals on Front of Lampshade (Z ~ 0.83, Y ~ 0.08) ──────── */}
        {!isLampOn ? (
          /* Sleeping Curved Eyes (◡   ◡) placed in center of lampshade face */
          <group position={[0, 0, 0.83]}>
            <line
              geometry={geometries.closedEyeGeo}
              material={materials.eyeClosedMat}
              position={[-0.28, 0.08, 0]}
              rotation={[0, 0, Math.PI]}
            />
            <line
              geometry={geometries.closedEyeGeo}
              material={materials.eyeClosedMat}
              position={[0.28, 0.08, 0]}
              rotation={[0, 0, Math.PI]}
            />
          </group>
        ) : (
          /* Awake Alert Eyes (●   ●) with pupils tracking cursor */
          <group position={[0, 0, 0.83]}>
            {/* Left Eye */}
            <mesh position={[-0.28, 0.08, 0]} geometry={geometries.openEyeGeo} material={materials.eyeOpenBaseMat} />
            <group ref={leftPupilRef} position={[-0.28, 0.08, 0.002]}>
              <mesh geometry={geometries.pupilGeo} material={materials.pupilMat} />
              <mesh position={[0.015, 0.015, 0.001]} geometry={geometries.glintGeo} material={materials.glintMat} />
            </group>

            {/* Right Eye */}
            <mesh position={[0.28, 0.08, 0]} geometry={geometries.openEyeGeo} material={materials.eyeOpenBaseMat} />
            <group ref={rightPupilRef} position={[0.28, 0.08, 0.002]}>
              <mesh geometry={geometries.pupilGeo} material={materials.pupilMat} />
              <mesh position={[0.015, 0.015, 0.001]} geometry={geometries.glintGeo} material={materials.glintMat} />
            </group>
          </group>
        )}

        {/* Downward Spotlight */}
        <spotLight
          ref={spotLightRef}
          position={[0, -0.2, 0]}
          target-position={[0, -5, 0]}
          color="#FFF5EA"
          intensity={isLampOn ? 3.4 : 0}
          angle={Math.PI / 4.2}
          penumbra={0.65}
          distance={8.5}
          castShadow={isLampOn}
        />

        {/* Inner Shade Bounce Light */}
        <pointLight
          ref={innerLightRef}
          position={[0, -0.15, 0]}
          color="#FFE7D1"
          intensity={isLampOn ? 1.8 : 0}
          distance={3.0}
        />

        {/* Soft Volumetric Light Beam Cone */}
        {isLampOn && (
          <mesh position={[0, -1.8, 0]}>
            <cylinderGeometry args={[0.95, 2.2, 3.2, 32, 1, true]} />
            <meshBasicMaterial
              color="#FFEEDA"
              transparent
              opacity={isInputFocused ? 0.16 : 0.10}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* ─── 5. BOTH SIDE ROPES (Left & Right Ropes) ──────────────────────── */}
      {/* 5A. LEFT SIDE ROPE */}
      <mesh
        ref={leftCordRef}
        geometry={geometries.cordSegmentGeo}
        material={materials.cordMat}
      />
      {/* Left Pearl Bead */}
      <mesh
        ref={leftBeadRef}
        geometry={geometries.beadGeo}
        material={materials.beadMat}
        castShadow
        onPointerDown={handlePointerDownRope('left')}
        onClick={handleClickBead('left')}
        cursor="grab"
      >
        {/* Soft glowing beacon ring when OFF (White & Crimson theme) */}
        {!isLampOn && (
          <mesh scale={1.45}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial
              color="#FF2A55"
              transparent
              opacity={0.45 + Math.sin(pullLeft * 5) * 0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </mesh>

      {/* 5B. RIGHT SIDE ROPE */}
      <mesh
        ref={rightCordRef}
        geometry={geometries.cordSegmentGeo}
        material={materials.cordMat}
      />
      {/* Right Pearl Bead */}
      <mesh
        ref={rightBeadRef}
        geometry={geometries.beadGeo}
        material={materials.beadMat}
        castShadow
        onPointerDown={handlePointerDownRope('right')}
        onClick={handleClickBead('right')}
        cursor="grab"
      >
        {/* Soft glowing beacon ring when OFF (White & Crimson theme) */}
        {!isLampOn && (
          <mesh scale={1.45}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial
              color="#FF2A55"
              transparent
              opacity={0.45 + Math.sin(pullRight * 5) * 0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </mesh>
    </group>
  )
}
