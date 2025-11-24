'use client'

import { Waterfall } from './Waterfall'

export default function DataFlowSection() {
    return (
        <section className="relative min-h-screen w-full bg-bg-tertiary py-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 className="glow-text mb-6 font-display text-5xl font-bold">
                            实时智能监控
                        </h2>
                        <p className="mb-8 text-xl text-gray-300">
                            毫秒级精确监控每一个请求。我们的智能路由系统通过自动绕过故障节点，确保 99.99% 的正常运行时间。
                        </p>
                        <ul className="space-y-4 text-gray-300">
                            <li className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white">✓</span>
                                全球流量负载均衡
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white">✓</span>
                                自动故障转移保护
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white">✓</span>
                                实时异常检测
                            </li>
                        </ul>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-quantum-blue to-quantum-purple opacity-20 blur-xl" />
                        <Waterfall />
                    </div>
                </div>
            </div>
        </section>
    )
}
