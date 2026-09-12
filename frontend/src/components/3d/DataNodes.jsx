import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * DataNodes — Constellation of AI Neural / Tensor Graph Nodes
 * Crystalline nodes connected by subtle computational synaptic lines.
 */
export default function DataNodes({ count = 14, radius = 3.2, isMobile = false }) {
  const groupRef = useRef()
  const actualCount = isMobile ? 8 : count

  // Generate node vertices
  const nodes = useMemo(() => {
    const list = []
    for (let i = 0; i < actualCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / actualCount)
      const theta = Math.sqrt(actualCount * Math.PI) * phi
      const r = radius * (0.8 + Math.random() * 0.4)
      list.push({
        position: new THREE.Vector3(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi) * 0.8,
          r * Math.cos(phi)
        ),
        color: i % 2 === 0 ? '#FF2A55' : '#FFFFFF',
        scale: Math.random() * 0.05 + 0.05,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return list
  }, [actualCount, radius])

  // Build connecting lines between adjacent nodes
  const linePositions = useMemo(() => {
    const coords = []
    const threshold = radius * 1.1
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position)
        if (d < threshold) {
          coords.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          )
        }
      }
    }
    return new Float32Array(coords)
  }, [nodes, radius])

  // Subtle group rotation
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    groupRef.current.rotation.y = -t * 0.03
    groupRef.current.rotation.x = Math.sin(t * 0.02) * 0.04
  })

  return (
    <group ref={groupRef}>
      {/* Crystalline Node Vertices */}
      {nodes.map((node, i) => (
        <mesh key={i} position={node.position.toArray()}>
          <octahedronGeometry args={[node.scale, 0]} />
          <meshBasicMaterial
            color={node.color}
            wireframe
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Synaptic Edge Lines */}
      {linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={linePositions.length / 3}
              array={linePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#FF2A55"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
    </group>
  )
}
