import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import particleVertexShader from './shaders/particle.vert'
import particleFragmentShader from './shaders/particle.frag'

interface ParticleSystemProps {
    count?: number        // 粒子数量
    radius?: number       // 隧道半径
    speed?: number        // 流动速度
    color?: THREE.Color   // 粒子颜色
}

export function ParticleSystem({
    count = 50000,
    radius = 5,
    speed = 0.5,
    color = new THREE.Color(0x00d4ff)
}: ParticleSystemProps) {
    const pointsRef = useRef<THREE.Points>(null)

    // 粒子位置和属性
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const sizes = new Float32Array(count)
        const colors = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // 圆柱形分布（隧道形状）
            const angle = Math.random() * Math.PI * 2
            const r = radius * (0.7 + Math.random() * 0.3)
            const z = Math.random() * 100 - 50

            positions[i3] = Math.cos(angle) * r
            positions[i3 + 1] = Math.sin(angle) * r
            positions[i3 + 2] = z

            // 粒子大小随机
            sizes[i] = Math.random() * 0.5 + 0.5

            // 颜色渐变（蓝→紫）
            const mixRatio = Math.random()
            colors[i3] = color.r * (1 - mixRatio) + 0.7 * mixRatio
            colors[i3 + 1] = color.g * (1 - mixRatio) + 0 * mixRatio
            colors[i3 + 2] = color.b * (1 - mixRatio) + 1 * mixRatio
        }

        return { positions, sizes, colors }
    }, [count, radius, color])

    // 动画循环
    useFrame((state, delta) => {
        if (!pointsRef.current) return

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Z轴流动
            positions[i3 + 2] += speed * delta * 10

            // 循环
            if (positions[i3 + 2] > 50) {
                positions[i3 + 2] = -50
            }
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true

        // 隧道旋转
        pointsRef.current.rotation.z += delta * 0.05
    })

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    args={[particles.positions, 3]}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={count}
                    args={[particles.sizes, 1]}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={count}
                    args={[particles.colors, 3]}
                />
            </bufferGeometry>
            {/* Use shader material for custom particle rendering */}
            <shaderMaterial
                vertexShader={particleVertexShader}
                fragmentShader={particleFragmentShader}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
}
