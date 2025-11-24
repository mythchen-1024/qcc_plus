import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

interface DataFlowProps {
    start: THREE.Vector3
    end: THREE.Vector3
    active: boolean
}

export function DataFlow({ start, end, active }: DataFlowProps) {
    const lineRef = useRef<any>(null)
    const particlesRef = useRef<THREE.Points>(null)

    // 粒子沿线条流动
    useFrame((state) => {
        if (!particlesRef.current || !active) return

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const progress = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2

        for (let i = 0; i < 10; i++) {
            const i3 = i * 3
            const t = (progress + i / 10) % 1

            positions[i3] = THREE.MathUtils.lerp(start.x, end.x, t)
            positions[i3 + 1] = THREE.MathUtils.lerp(start.y, end.y, t)
            positions[i3 + 2] = THREE.MathUtils.lerp(start.z, end.z, t)
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
    })

    return (
        <group>
            {/* 连接线 */}
            <Line
                ref={lineRef}
                points={[start, end]}
                color={active ? 0x00d4ff : 0x333333}
                lineWidth={active ? 2 : 1}
                transparent
                opacity={active ? 0.8 : 0.3}
            />

            {/* 流动粒子 */}
            {active && (
                <points ref={particlesRef}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={10}
                            args={[new Float32Array(30), 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial
                        size={0.1}
                        color={0x00d4ff}
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </points>
            )}
        </group>
    )
}
