'use client'

import { Scene } from '@/components/3d/Scene'
import { ParticleSystem } from '@/components/3d/ParticleSystem'
import { useRef } from 'react'

export default function HeroSection() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* 3D背景 */}
            <div className="absolute inset-0">
                <Scene cameraPosition={[0, 0, 5]}>
                    <ambientLight intensity={0.5} />
                    <ParticleSystem count={50000} radius={3} speed={0.5} />
                </Scene>
            </div>

            {/* 前景内容 */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center pointer-events-none">
                <div className="pointer-events-auto text-center">
                    <h1 className="glow-text mb-6 text-center font-display text-7xl font-bold tracking-wider">
                        QCC Plus
                    </h1>

                    <p className="mb-12 text-center text-2xl text-gray-300">
                        企业级 Claude 代理网关
                    </p>

                    <a
                        href="https://github.com/yxhpy/qcc_plus"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block group relative overflow-hidden rounded-lg border border-white bg-white text-black px-8 py-4 text-lg font-bold transition-all hover:bg-black hover:text-white"
                    >
                        <span className="relative z-10">立即开始</span>
                    </a>
                </div>

                {/* 滚动提示 */}
                <div className="absolute bottom-10 animate-bounce">
                    <div className="text-sm text-gray-400">
                        向下滚动进入 ↓
                    </div>
                </div>
            </div>
        </section>
    )
}
