'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'

interface SceneProps {
  children: React.ReactNode
  enableControls?: boolean
  cameraPosition?: [number, number, number]
}

export function Scene({
  children,
  enableControls = false,
  cameraPosition = [0, 0, 10],
}: SceneProps) {
  return (
    <Canvas
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
      }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={75} />

      {enableControls && <OrbitControls enableDamping dampingFactor={0.05} />}

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
