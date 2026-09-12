import { useState, useEffect, Suspense, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import PullCordLamp from './PullCordLamp'

/**
 * LampEnvironment — Studio Stage for the Photorealistic Desk Lamp
 * High-performance canvas with dynamic studio lighting and telephoto camera framing.
 */
function LampEnvironment({
  isLampOn = false,
  onToggle = () => {},
  isInputFocused = false,
  className = '',
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className={`relative w-full h-full overflow-hidden select-none ${className}`}>
      <Canvas
        shadows
        camera={{
          position: isMobile ? [0, 0.40, 5.0] : [0, 0.25, 4.6],
          fov: isMobile ? 48 : 38,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          depth: true,
          stencil: false,
        }}
        eventSource={typeof document !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          {/* ─── Studio Lighting (White & Crimson Hematology Studio Specular) ── */}
          <ambientLight
            color="#14060E"
            intensity={isLampOn ? 1.1 : 0.6}
          />

          {/* Key Light: Crisp Pure White Highlight for Brushed Metal & Shade */}
          <directionalLight
            position={[-3.5, 5, 3.5]}
            color="#FFFFFF"
            intensity={isLampOn ? 2.4 : 1.3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-bias={-0.0001}
          />

          {/* Crimson Red Specular Rim Light */}
          <directionalLight
            position={[4, 3.5, -2.5]}
            color="#FF2A55"
            intensity={isLampOn ? 1.8 : 0.9}
          />

          {/* Soft White Fill Light */}
          <directionalLight
            position={[2, 1, 3]}
            color="#FFFFFF"
            intensity={isLampOn ? 0.7 : 0.35}
          />

          {/* Front Soft Fill for shadow alleviation */}
          <pointLight
            position={[0, 0.8, 3.8]}
            color="#F8FAFC"
            intensity={isLampOn ? 0.6 : 0.25}
            distance={7}
          />

          {/* ─── Interactive Designer Desk Lamp ───────────────────────────── */}
          <PullCordLamp
            isLampOn={isLampOn}
            onToggle={onToggle}
            isInputFocused={isInputFocused}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default memo(LampEnvironment)
