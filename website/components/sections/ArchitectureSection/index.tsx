'use client'

import { Scene } from '@/components/3d/Scene'
import { Node3D } from './Node3D'
import { DataFlow } from './DataFlow'
import { useState } from 'react'
import * as THREE from 'three'

export default function ArchitectureSection() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null)

    const nodes = [
        { id: 'client', position: [0, 3, 0], label: '客户端', status: 'healthy' },
        { id: 'gateway', position: [0, 0, 0], label: 'QCC 网关', status: 'healthy' },
        { id: 'node1', position: [-2, -2, 0], label: '节点 1', status: 'healthy' },
        { id: 'node2', position: [0, -2, 0], label: '节点 2', status: 'degraded' },
        { id: 'node3', position: [2, -2, 0], label: '节点 3', status: 'healthy' },
        { id: 'claude', position: [0, -4, 0], label: 'Claude API', status: 'healthy' },
    ] as const

    const connections = [
        { start: new THREE.Vector3(0, 3, 0), end: new THREE.Vector3(0, 0, 0), active: true },
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(-2, -2, 0), active: true },
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(0, -2, 0), active: false },
        { start: new THREE.Vector3(0, 0, 0), end: new THREE.Vector3(2, -2, 0), active: true },
        { start: new THREE.Vector3(-2, -2, 0), end: new THREE.Vector3(0, -4, 0), active: true },
        { start: new THREE.Vector3(2, -2, 0), end: new THREE.Vector3(0, -4, 0), active: true },
    ]

    return (
        <section className="relative min-h-screen w-full bg-bg-secondary py-20">
            <div className="container mx-auto px-4">
                <h2 className="glow-text mb-12 text-center font-display text-5xl font-bold">
                    系统架构
                </h2>

                <div className="h-[600px] w-full">
                    <Scene enableControls cameraPosition={[0, 0, 8]}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />

                        {/* 节点 */}
                        {nodes.map((node) => (
                            <Node3D
                                key={node.id}
                                position={node.position as [number, number, number]}
                                label={node.label}
                                status={node.status as any}
                                onClick={() => setSelectedNode(node.id)}
                            />
                        ))}

                        {/* 连接线 */}
                        {connections.map((conn, index) => (
                            <DataFlow
                                key={index}
                                start={conn.start}
                                end={conn.end}
                                active={conn.active}
                            />
                        ))}
                    </Scene>
                </div>

                {/* 节点详情面板 */}
                {selectedNode && (
                    <div className="glass mt-8 rounded-lg p-6 animate-fade-in">
                        <h3 className="mb-4 text-2xl font-bold">
                            {nodes.find(n => n.id === selectedNode)?.label}
                        </h3>
                        <p className="text-gray-300">
                            状态: {nodes.find(n => n.id === selectedNode)?.status === 'healthy' ? '运行正常' :
                                nodes.find(n => n.id === selectedNode)?.status === 'degraded' ? '性能降级' : '故障'}
                        </p>
                        <p className="text-gray-300 mt-2">
                            实时监控已激活。流量路由已优化。
                        </p>
                    </div>
                )}
            </div>
        </section>
    )
}
