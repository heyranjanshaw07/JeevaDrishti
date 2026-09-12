import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { Suspense } from 'react'
import FloatingCells from './FloatingCells'
import ParticleField from './ParticleField'

/**
 * Compact auth-page 3D environment
 */
export default function CellModel({ interactive = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.1} />
        <pointLight position={[4, 4, 4]} color="#FF2A55" intensity={1.4} />
        <pointLight position={[-4, -3, -4]} color="#FFFFFF" intensity={0.9} />

        <FloatingCells count={6} />
        <ParticleField count={80} spread={15} color="#FF2A55" />
        <ParticleField count={30} spread={10} color="#FFFFFF" />
        <Stars radius={25} depth={15} count={300} factor={1.5} saturation={0} fade speed={0.4} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          enableRotate={interactive}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(Math.PI * 3) / 4}
        />
      </Suspense>
    </Canvas>
  )
}
