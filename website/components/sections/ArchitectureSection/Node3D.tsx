import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

interface Node3DProps {
    position: [number, number, number]
    label: string
    status: 'healthy' | 'degraded' | 'failed'
    onClick?: () => void
}

export function Node3D({ position, label, status, onClick }: Node3DProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    // 状态颜色映射
    const statusColors = {
        healthy: new THREE.Color(0xffffff),
        degraded: new THREE.Color(0x888888),
        failed: new THREE.Color(0x333333)
    }

    const color = statusColors[status]

    // 呼吸动画
    useFrame((state) => {
        if (!meshRef.current) return

        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
        meshRef.current.scale.setScalar(pulse * (hovered ? 1.2 : 1))
    })

    return (
        <group position={position}>
            {/* 球体节点 */}
            <Sphere
                ref={meshRef}
                args={[0.5, 32, 32]}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.8 : 0.4}
                    transparent
                    opacity={0.9}
                />
            </Sphere>

            {/* 外层光晕 */}
            <Sphere args={[0.7, 32, 32]}>
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                    side={THREE.BackSide}
                />
            </Sphere>

            {/* 标签 */}
            <Text
                position={[0, -1, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {label}
            </Text>
        </group>
    )
}
