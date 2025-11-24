import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text } from '@react-three/drei'
import * as THREE from 'three'

const FEATURES = [
    { face: 'front', title: '多租户', icon: '🔐' },
    { face: 'right', title: '智能路由', icon: '🌐' },
    { face: 'back', title: '数据分析', icon: '📊' },
    { face: 'left', title: '高性能', icon: '⚡' },
    { face: 'top', title: '安全防护', icon: '🛡️' },
    { face: 'bottom', title: '快速部署', icon: '🚀' }
]

export function Cube3D() {
    const cubeRef = useRef<THREE.Mesh>(null)
    const [isDragging, setIsDragging] = useState(false)

    // 自动旋转 + 拖拽控制
    useFrame((state, delta) => {
        if (!cubeRef.current || isDragging) return

        cubeRef.current.rotation.x += delta * 0.2
        cubeRef.current.rotation.y += delta * 0.3
    })

    return (
        <group>
            <Box
                ref={cubeRef}
                args={[3, 3, 3]}
                onPointerDown={() => setIsDragging(true)}
                onPointerUp={() => setIsDragging(false)}
                onPointerOut={() => setIsDragging(false)}
            >
                <meshStandardMaterial
                    color={0xffffff}
                    emissive={0xffffff}
                    emissiveIntensity={0.1}
                    transparent
                    opacity={0.1}
                    wireframe
                />

                {/* 每个面的标签 */}
                {FEATURES.map((feature, index) => {
                    const position = getFacePosition(feature.face)
                    const rotation = getFaceRotation(feature.face)

                    return (
                        <group key={index} position={position} rotation={rotation}>
                            <Text
                                fontSize={0.4}
                                color="white"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {feature.icon} {feature.title}
                            </Text>
                        </group>
                    )
                })}
            </Box>
        </group>
    )
}

function getFacePosition(face: string): [number, number, number] {
    const offset = 1.51 // Slightly outside the box
    const positions: Record<string, [number, number, number]> = {
        front: [0, 0, offset],
        back: [0, 0, -offset],
        right: [offset, 0, 0],
        left: [-offset, 0, 0],
        top: [0, offset, 0],
        bottom: [0, -offset, 0]
    }
    return positions[face]
}

function getFaceRotation(face: string): [number, number, number] {
    const rotations: Record<string, [number, number, number]> = {
        front: [0, 0, 0],
        back: [0, Math.PI, 0],
        right: [0, Math.PI / 2, 0],
        left: [0, -Math.PI / 2, 0],
        top: [-Math.PI / 2, 0, 0],
        bottom: [Math.PI / 2, 0, 0]
    }
    return rotations[face]
}
