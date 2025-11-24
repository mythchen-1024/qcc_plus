'use client'

import { useRef, useEffect, useState } from 'react'
import { useInView } from 'framer-motion'

function Counter({ end, duration = 2000 }: { end: number; duration?: number }) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return

        let start = 0
        const increment = end / (duration / 16)
        const timer = setInterval(() => {
            start += increment
            if (start >= end) {
                setCount(end)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)

        return () => clearInterval(timer)
    }, [isInView, end, duration])

    return <span ref={ref}>{count.toLocaleString()}</span>
}

export default function StatsSection() {
    return (
        <section className="relative min-h-screen w-full bg-bg-secondary py-20">
            <div className="container mx-auto px-4">
                <h2 className="glow-text mb-16 text-center font-display text-5xl font-bold">
                    深受企业信赖
                </h2>

                <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            <Counter end={99} />.9%
                        </div>
                        <div className="text-gray-300">正常运行时间</div>
                    </div>

                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            &lt;<Counter end={50} />ms
                        </div>
                        <div className="text-gray-300">延迟</div>
                    </div>

                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            <Counter end={10} />M+
                        </div>
                        <div className="text-gray-300">每日请求</div>
                    </div>

                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            <Counter end={100} />+
                        </div>
                        <div className="text-gray-300">合作企业</div>
                    </div>

                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            <Counter end={50} />+
                        </div>
                        <div className="text-gray-300">覆盖国家</div>
                    </div>

                    <div className="glass rounded-lg p-8 text-center transition-transform hover:scale-105">
                        <div className="mb-2 font-display text-6xl font-bold text-white">
                            24/7
                        </div>
                        <div className="text-gray-300">全天候支持</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
