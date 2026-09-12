import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Suspense } from 'react'
import FloatingCells from './FloatingCells'
import ParticleField from './ParticleField'
import MicroscopeScene from './MicroscopeScene'

/**
 * CellScene — hero canvas.
 * interactive=true  → user can orbit
 * minimal=true      → skip floating cells (used in dashboard)
 * showMicroscope=true → show the microscope model (default: true for hero)
 */
export default function CellScene({ interactive = false, minimal = false, showMicroscope = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <pointLight position={[4, 4, 4]} color="#FF2A55" intensity={1.4} />
        <pointLight position={[-4, -3, -4]} color="#FFFFFF" intensity={0.9} />
        <directionalLight position={[0, 8, 2]} intensity={0.3} color="#ffffff" />

        {/* 3D elements */}
        {showMicroscope && !minimal && <MicroscopeScene scale={0.85} />}
        {!minimal && <FloatingCells count={6} />}

        {/* Particles */}
        <ParticleField count={90} spread={16} color="#FF2A55" />
        {!minimal && <ParticleField count={35} spread={12} color="#FFFFFF" />}

        {/* Star depth field */}
        <Stars radius={28} depth={18} count={350} factor={1.8} saturation={0} fade speed={0.4} />

        {/* Camera controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={interactive ? 0.5 : 0.3}
          enableRotate={interactive}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI * 2 / 3}
        />
      </Suspense>
    </Canvas>
  )
}
