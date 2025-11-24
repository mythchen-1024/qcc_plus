'use client'

import dynamic from 'next/dynamic'

const HeroSection = dynamic(
  () => import('@/components/sections/HeroSection'),
  { ssr: false }
)

const ArchitectureSection = dynamic(
  () => import('@/components/sections/ArchitectureSection'),
  { ssr: false }
)

const DataFlowSection = dynamic(
  () => import('@/components/sections/DataFlowSection'),
  { ssr: false }
)

const FeatureCubeSection = dynamic(
  () => import('@/components/sections/FeatureCubeSection'),
  { ssr: false }
)

const CodeDemoSection = dynamic(
  () => import('@/components/sections/CodeDemoSection'),
  { ssr: false }
)

const StatsSection = dynamic(
  () => import('@/components/sections/StatsSection'),
  { ssr: false }
)


const CTASection = dynamic(
  () => import('@/components/sections/CTASection'),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-primary text-white">
      <HeroSection />
      <ArchitectureSection />
      <DataFlowSection />
      <FeatureCubeSection />
      <CodeDemoSection />
      <StatsSection />
      <CTASection />
    </main>
  )
}
