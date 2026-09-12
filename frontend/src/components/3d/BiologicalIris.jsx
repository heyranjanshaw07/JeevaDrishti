import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Custom Procedural Shader for Ethereal Biological Iris (Static & Crisp) ─
const IrisShaderMaterial = {
  uniforms: {
    uPupilRadius: { value: 0.26 },
    uGlowIntensity: { value: 0.75 },
    uFocusIntensity: { value: 0.0 },
    uAwakened: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uPupilRadius;
    uniform float uGlowIntensity;
    uniform float uFocusIntensity;
    uniform float uAwakened;
    varying vec2 vUv;
    varying vec3 vPosition;

    // Organic pseudo-noise
    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float n = i.x + i.y * 57.0;
      return mix(mix(hash(n), hash(n + 1.0), f.x),
                 mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
    }

    void main() {
      vec2 centered = vUv - vec2(0.5);
      float r = length(centered) * 2.0; // 0 at center, 1 at boundary
      float theta = atan(centered.y, centered.x);

      // 1. Central Deep Pupil (Crystalline void)
      if (r < uPupilRadius) {
        float innerGlow = smoothstep(uPupilRadius, 0.0, r) * 0.04;
        gl_FragColor = vec4(vec3(innerGlow), 1.0);
        return;
      }

      // 2. Pupillary Margin (Sphincter muscle ring)
      float pupillaryEdge = smoothstep(uPupilRadius, uPupilRadius + 0.04, r);
      float innerRing = exp(-pow((r - uPupilRadius - 0.025) / 0.03, 2.0));

      // 3. Dense Biological Micro-Fibers (Stable, crisp, zero internal boiling)
      float fineFibers = sin(theta * 120.0 + sin(theta * 24.0) * 3.0 + r * 20.0);
      fineFibers += sin(theta * 240.0 - r * 35.0) * 0.5;
      fineFibers += sin(theta * 480.0 + r * 50.0) * 0.25;
      float fiberPattern = smoothstep(-0.3, 0.8, fineFibers);

      // Organic Crypts (Crypts of Fuchs) - Stable & stationary
      float cryptNoise = noise(vec2(theta * 10.0, r * 15.0));
      float crypts = smoothstep(0.45, 0.8, cryptNoise) * 0.4;

      // 4. Concentric Collarette (Zig-zag wavy ring) - Stable & stationary
      float collaretteR = 0.55 + sin(theta * 10.0) * 0.025;
      float collarette = exp(-pow((r - collaretteR) / 0.06, 2.0));

      // 5. Color Blending: White & Crimson Hematology
      vec3 coreWhite = vec3(1.0, 1.0, 1.0);
      vec3 vibrantCrimson = vec3(1.0, 0.165, 0.333); // #FF2A55
      vec3 deepRuby = vec3(0.75, 0.06, 0.15);        // #DC2626

      // Dormant vs Awakened saturation
      vec3 dimCrimson = mix(vec3(0.3, 0.05, 0.1), vibrantCrimson, uAwakened * 0.7 + 0.3);
      vec3 dimRuby = mix(vec3(0.2, 0.02, 0.05), deepRuby, uAwakened * 0.7 + 0.3);

      vec3 baseColor = mix(dimCrimson, dimRuby, smoothstep(uPupilRadius, 0.85, r));
      baseColor = mix(baseColor, coreWhite, (innerRing * 0.75 + collarette * 0.5) * (uAwakened * 0.5 + 0.5));
      baseColor += fiberPattern * 0.28 * dimCrimson;
      baseColor += crypts * coreWhite * 0.35 * (uAwakened * 0.6 + 0.4);

      // Luminous breathing glow
      baseColor *= (uGlowIntensity + uFocusIntensity * 0.45);

      // 6. Feathered Limbus (Soft organic fade into darkfield void - NO plastic borders)
      float limbusFade = smoothstep(0.98, 0.68, r);
      float alpha = pupillaryEdge * limbusFade;

      gl_FragColor = vec4(baseColor, alpha);
    }
  `,
}

/**
 * Procedural Biological Iris
 * 
 * - Internal movements removed as requested (crisp, stable neural texture)
 * - Interactive Awakening transition (Click on iris to awaken and open login)
 * - Natural gaze tracking parallax
 */
export default function BiologicalIris({
  isAwakened = false,
  onToggleAwaken,
  focusMode = null,
  animState = 'idle',
  mousePos = { x: 0, y: 0 },
}) {
  const groupRef = useRef()
  const shaderMatRef = useRef()
  const scanArcRef = useRef()
  const filamentsRef = useRef()
  const corneaRef = useRef()

  // ─── 1. Ultra-Fine Radial Neural Filaments (LineSegments) ─────────────────
  const { lineGeometry, lineColors } = useMemo(() => {
    const points = []
    const colors = []
    const count = 480

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.015
      const innerR = 0.42 + Math.random() * 0.04
      const outerR = 1.35 + Math.random() * 0.08

      const wave = Math.sin(angle * 12.0 + i) * 0.02
      const x1 = Math.cos(angle) * innerR
      const y1 = Math.sin(angle) * innerR
      const z1 = 0.03

      const x2 = Math.cos(angle + wave) * outerR
      const y2 = Math.sin(angle + wave) * outerR
      const z2 = -0.02

      points.push(new THREE.Vector3(x1, y1, z1))
      points.push(new THREE.Vector3(x2, y2, z2))

      const isInnerWhite = i % 2 === 0
      colors.push(isInnerWhite ? 1.0 : 1.0, isInnerWhite ? 0.9 : 0.165, isInnerWhite ? 0.95 : 0.333)
      colors.push(0.86, 0.08, 0.18)
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points)
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    return { lineGeometry: geom, lineColors: colors }
  }, [])

  // ─── 2. Floating Synaptic Bio-Particles (Neural Dust) ─────────────────────
  const particleData = useMemo(() => {
    const count = 140
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const r = 0.45 + Math.random() * 0.95
      const theta = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = Math.sin(theta) * r
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.25 + 0.05

      const isWhite = Math.random() > 0.6
      col[i * 3] = 1.0
      col[i * 3 + 1] = isWhite ? 1.0 : 0.165
      col[i * 3 + 2] = isWhite ? 1.0 : 0.333
    }
    return { positions: pos, colors: col }
  }, [])

  // ─── 3. Shader Material Instance ──────────────────────────────────────────
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: IrisShaderMaterial.vertexShader,
      fragmentShader: IrisShaderMaterial.fragmentShader,
      uniforms: {
        uPupilRadius: { value: 0.26 },
        uGlowIntensity: { value: 0.75 },
        uFocusIntensity: { value: 0.0 },
        uAwakened: { value: 0.0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  // ─── 4. Frame Animation Loop (Purely external parallax & calm breathing) ──
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!groupRef.current) return

    // Gentle cursor parallax
    let targetRotX = -mousePos.y * 0.16
    let targetRotY = mousePos.x * 0.2
    let targetPosX = 0
    let targetPosZ = 0
    let targetScale = isAwakened ? 1.04 : 0.98
    let focusBoost = 0.0
    let pupilTarget = isAwakened ? 0.30 : 0.25

    if (focusMode === 'email') {
      targetRotY += 0.18
      targetPosX += 0.08
      focusBoost = 0.35
    } else if (focusMode === 'password') {
      targetRotY += 0.2
      targetPosZ += 0.2
      targetPosX += 0.1
      targetScale = 1.08
      pupilTarget = 0.34
      focusBoost = 0.75
    }

    if (animState === 'transition') {
      targetScale = 3.2
      pupilTarget = 0.92
      focusBoost = 1.6
      targetRotX = 0
      targetRotY = 0
    } else if (animState === 'reverse-transition') {
      targetScale = 1.0
      pupilTarget = 0.25
      focusBoost = 0.2
    } else if (animState === 'signup') {
      targetScale = 1.1
      focusBoost = 0.6
    } else if (animState === 'login') {
      targetScale = 1.05
      focusBoost = 1.0
    }

    // Smooth lerping of whole eye orientation
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05)
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetPosX, 0.05)
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetPosZ, 0.05)
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05)

    // Shader Uniforms Update (Stable without internal undulation)
    if (shaderMaterial) {
      shaderMaterial.uniforms.uPupilRadius.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uPupilRadius.value,
        pupilTarget,
        animState === 'transition' ? 0.08 : 0.06
      )
      const baseGlow = isAwakened || animState === 'transition' ? 1.15 : 0.75
      shaderMaterial.uniforms.uGlowIntensity.value = baseGlow + (isAwakened ? Math.sin(t * 1.5) * 0.05 : 0)
      shaderMaterial.uniforms.uFocusIntensity.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uFocusIntensity.value,
        focusBoost,
        0.06
      )
      shaderMaterial.uniforms.uAwakened.value = THREE.MathUtils.lerp(
        shaderMaterial.uniforms.uAwakened.value,
        isAwakened || animState === 'transition' ? 1.0 : 0.0,
        0.05
      )
    }

    // Scanner Arc only activates upon awakening or login or transition
    if (scanArcRef.current) {
      if (animState === 'transition') {
        scanArcRef.current.rotation.z += 0.14
      } else if (animState === 'login') {
        scanArcRef.current.rotation.z += 0.08
      } else if (isAwakened) {
        scanArcRef.current.rotation.z = t * 0.4
      }
    }
  })

  return (
    <group
      ref={groupRef}
      scale={1.05}
      onClick={(e) => {
        e.stopPropagation()
        if (onToggleAwaken) onToggleAwaken()
      }}
      className="cursor-pointer"
    >
      {/* ─── 1. Procedural Iris Stroma Disc (Shader) ────────────────────── */}
      <mesh material={shaderMaterial} position={[0, 0, 0]}>
        <planeGeometry args={[3.2, 3.2, 1, 1]} />
      </mesh>

      {/* ─── 2. Ultra-Fine Radial Neural Filaments (Static & Crisp) ─────── */}
      <group ref={filamentsRef} position={[0, 0, 0.02]}>
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={isAwakened ? 0.75 : 0.45}
            blending={THREE.AdditiveBlending}
            linewidth={1}
          />
        </lineSegments>
      </group>

      {/* ─── 3. Slit-Lamp Optical Scan Arc (Active when awakened or transitioning) ───────── */}
      <group ref={scanArcRef} position={[0, 0, 0.06]} visible={isAwakened || animState === 'transition'}>
        <mesh>
          <ringGeometry args={[0.78, 0.81, 64, 1, 0, Math.PI * 0.85]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[0.74, 0.85, 64, 1, Math.PI * 0.2, Math.PI * 0.55]} />
          <meshBasicMaterial
            color="#FF2A55"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0.795, 0, 0]}>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* ─── 4. Floating Synaptic Bio-Particles (Subtle) ────────────────── */}
      <points position={[0, 0, 0.08]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          vertexColors
          transparent
          opacity={isAwakened ? 0.75 : 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ─── 5. Wet Crystalline Corneal Dome (Interactive Click Area) ──── */}
      <mesh
        ref={corneaRef}
        position={[0, 0, 0.16]}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[1.52, 36, 36, 0, Math.PI * 2, 0, Math.PI * 0.38]} />
        <meshPhysicalMaterial
          color="#FFFFFF"
          transmission={0.96}
          roughness={0.02}
          metalness={0.02}
          ior={1.48}
          thickness={0.6}
          transparent
          opacity={isAwakened ? 0.22 : 0.14}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
        />
      </mesh>

      {/* ─── 6. Soft Organic Limbus Glow ───────────────────────────────── */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[1.3, 1.55, 64]} />
        <meshBasicMaterial
          color="#FF2A55"
          transparent
          opacity={isAwakened ? 0.2 : 0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
