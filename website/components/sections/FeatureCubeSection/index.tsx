'use client'

import { Scene } from '@/components/3d/Scene'
import { Cube3D } from './Cube3D'

export default function FeatureCubeSection() {
    return (
        <section className="relative min-h-screen w-full bg-bg-secondary py-20">
            <div className="container mx-auto px-4">
                <h2 className="glow-text mb-12 text-center font-display text-5xl font-bold">
                    核心能力
                </h2>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                    <div className="h-[500px] w-full">
                        <Scene enableControls cameraPosition={[0, 0, 6]}>
                            <ambientLight intensity={0.5} />
                            <pointLight position={[10, 10, 10]} intensity={1} />
                            <Cube3D />
                        </Scene>
                    </div>

                    <div className="space-y-8">
                        <div className="glass rounded-lg p-6 transition-transform hover:scale-105">
                            <h3 className="mb-2 text-2xl font-bold text-white">多租户架构</h3>
                            <p className="text-gray-300">
                                通过我们强大的多租户系统，为不同团队或客户隔离数据和配置。
                            </p>
                        </div>

                        <div className="glass rounded-lg p-6 transition-transform hover:scale-105">
                            <h3 className="mb-2 text-2xl font-bold text-white">智能路由</h3>
                            <p className="text-gray-300">
                                基于模型可用性、延迟和成本优化的智能请求路由。
                            </p>
                        </div>

                        <div className="glass rounded-lg p-6 transition-transform hover:scale-105">
                            <h3 className="mb-2 text-2xl font-bold text-white">企业级安全</h3>
                            <p className="text-gray-300">
                                银行级加密、SSO 集成和全面审计日志，让您高枕无忧。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
