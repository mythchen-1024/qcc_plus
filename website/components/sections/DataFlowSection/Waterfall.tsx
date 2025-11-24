'use client'

import { useEffect, useState } from 'react'

interface DataItem {
    id: string
    request: string
    status: string
    latency: string
    node: string
}

export function Waterfall() {
    const [data, setData] = useState<DataItem[]>([])
    const [isPaused, setIsPaused] = useState(false)

    useEffect(() => {
        if (isPaused) return

        const interval = setInterval(() => {
            const newItem: DataItem = {
                id: Date.now().toString(),
                request: 'POST /v1/messages',
                status: Math.random() > 0.1 ? '✓ 200 OK' : '✗ 500 Error',
                latency: `${Math.floor(Math.random() * 500 + 100)}ms`,
                node: `us-${['east', 'west', 'central'][Math.floor(Math.random() * 3)]}-1`,
            }

            setData(prev => [newItem, ...prev].slice(0, 20))
        }, 2000)

        return () => clearInterval(interval)
    }, [isPaused])

    return (
        <div
            className="relative h-[600px] overflow-hidden rounded-lg bg-black/50 p-6 border border-white/10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="space-y-4">
                {data.map((item, index) => (
                    <div
                        key={item.id}
                        className="glass animate-fade-in rounded-lg p-4 font-mono text-sm transition-all duration-500"
                        style={{
                            opacity: 1 - index * 0.05,
                            transform: `translateY(${index * 2}px)`
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white">{item.request}</span>
                            <span className={item.status.includes('✓') ? 'text-white' : 'text-gray-500'}>
                                {item.status}
                            </span>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-gray-400">
                            <span>延迟: {item.latency}</span>
                            <span>节点: {item.node}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
