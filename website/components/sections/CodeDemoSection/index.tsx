'use client'

import { Scene } from '@/components/3d/Scene'
import { Terminal3D } from './Terminal3D'

export default function CodeDemoSection() {
    return (
        <section className="relative min-h-screen w-full bg-bg-tertiary py-20">
            <div className="container mx-auto px-4">
                <h2 className="glow-text mb-12 text-center font-display text-5xl font-bold">
                    开发者优先
                </h2>

                <div className="h-[700px] w-full">
                    <Scene enableControls cameraPosition={[0, 0, 8]}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <Terminal3D />
                    </Scene>
                </div>
            </div>
        </section>
    )
}
