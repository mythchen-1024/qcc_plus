# QCC Plus 官网实现路线图
## Implementation Roadmap

**项目**: Quantum Gateway Website
**预计工期**: 6-7 周
**团队规模**: 1-2 名前端工程师

---

## 快速启动指南

### 第0周：项目初始化

#### 1. 创建Next.js项目

```bash
# 在项目根目录创建website文件夹
cd /Users/yxhpy/Desktop/project/qcc_plus
mkdir website && cd website

# 使用create-next-app初始化
pnpm create next-app . --typescript --tailwind --app --src-dir=false

# 安装核心依赖
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing
pnpm add gsap framer-motion
pnpm add @monaco-editor/react monaco-editor
pnpm add clsx tailwind-merge

# 安装开发依赖
pnpm add -D @types/three @types/node
pnpm add -D eslint-config-prettier prettier
```

#### 2. 配置项目结构

```bash
# 创建目录结构
mkdir -p components/{sections,3d,ui,animations}
mkdir -p hooks lib styles types public/{models,textures,images}

# 创建基础配置文件
touch tailwind.config.ts
touch next.config.js
touch tsconfig.json
```

#### 3. Tailwind配置

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          blue: '#00d4ff',
          purple: '#b400ff',
          green: '#00ff88',
        },
        bg: {
          primary: '#0a0a0f',
          secondary: '#141420',
          tertiary: '#1a1a2e',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'SF Pro Display', 'sans-serif'],
        sans: ['Inter', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

#### 4. 基础Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QCC Plus - Enterprise Claude Proxy Gateway',
  description: 'Next-generation Claude API proxy with multi-tenant architecture and intelligent routing',
  keywords: ['Claude', 'Proxy', 'AI', 'API Gateway', 'Multi-tenant'],
  openGraph: {
    title: 'QCC Plus - The Quantum Gateway to Claude',
    description: 'Enterprise-grade proxy infrastructure for AI-powered applications',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-bg-primary text-white`}>
        {children}
      </body>
    </html>
  )
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-bg-primary text-white;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .glow-text {
    text-shadow: 0 0 20px currentColor;
  }

  .glass {
    background: rgba(20, 20, 32, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 212, 255, 0.2);
  }
}
```

---

## 第1周：粒子系统与量子隧道

### 目标
- ✅ 搭建Three.js基础架构
- ✅ 实现粒子系统
- ✅ 实现量子隧道效果
- ✅ 完成Hero Section

### 任务清单

#### 1.1 创建3D场景容器

```typescript
// components/3d/Scene.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Suspense } from 'react'

interface SceneProps {
  children: React.ReactNode
  enableControls?: boolean
  cameraPosition?: [number, number, number]
}

export function Scene({
  children,
  enableControls = false,
  cameraPosition = [0, 0, 10]
}: SceneProps) {
  return (
    <Canvas
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
      }}
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={75} />

      {enableControls && <OrbitControls enableDamping dampingFactor={0.05} />}

      <Suspense fallback={null}>
        {children}
      </Suspense>
    </Canvas>
  )
}
```

#### 1.2 实现粒子系统（参考技术规格文档）

```bash
# 创建粒子系统文件
touch components/3d/ParticleSystem.tsx
touch components/3d/shaders/particle.vert
touch components/3d/shaders/particle.frag
```

复制技术规格文档中的粒子系统代码到对应文件。

#### 1.3 创建Hero Section

```typescript
// components/sections/HeroSection/index.tsx
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
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        <h1 className="glow-text mb-6 text-center font-display text-7xl font-bold tracking-wider">
          QCC Plus
        </h1>

        <p className="mb-12 text-center text-2xl text-gray-300">
          Enterprise-Grade Claude Proxy Gateway
        </p>

        <button className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-quantum-blue to-quantum-purple px-8 py-4 text-lg font-bold transition-all hover:scale-105">
          <span className="relative z-10">Get Started</span>
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-20" />
        </button>

        {/* 滚动提示 */}
        <div className="absolute bottom-10 animate-bounce">
          <div className="text-sm text-gray-400">
            Scroll to Enter ↓
          </div>
        </div>
      </div>
    </section>
  )
}
```

#### 1.4 集成到主页

```typescript
// app/page.tsx
import dynamic from 'next/dynamic'

const HeroSection = dynamic(
  () => import('@/components/sections/HeroSection'),
  { ssr: false }
)

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
    </main>
  )
}
```

### 测试要点

- [ ] 粒子流畅渲染（FPS > 30）
- [ ] 隧道旋转效果正常
- [ ] 响应式适配（移动端降级）
- [ ] 滚动提示动画正常

---

## 第2周：全息架构图

### 目标
- ✅ 实现3D节点模型
- ✅ 实现节点连接线
- ✅ 实现数据流动动画
- ✅ 添加交互功能

### 任务清单

#### 2.1 创建节点组件

```bash
mkdir components/sections/ArchitectureSection
touch components/sections/ArchitectureSection/index.tsx
touch components/sections/ArchitectureSection/Node3D.tsx
touch components/sections/ArchitectureSection/DataFlow.tsx
```

复制技术规格文档中的代码。

#### 2.2 架构布局设计

```typescript
// components/sections/ArchitectureSection/index.tsx
'use client'

import { Scene } from '@/components/3d/Scene'
import { Node3D } from './Node3D'
import { DataFlow } from './DataFlow'
import { useState } from 'react'
import * as THREE from 'three'

export default function ArchitectureSection() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const nodes = [
    { id: 'client', position: [0, 3, 0], label: 'Client', status: 'healthy' },
    { id: 'gateway', position: [0, 0, 0], label: 'QCC Gateway', status: 'healthy' },
    { id: 'node1', position: [-2, -2, 0], label: 'Node 1', status: 'healthy' },
    { id: 'node2', position: [0, -2, 0], label: 'Node 2', status: 'degraded' },
    { id: 'node3', position: [2, -2, 0], label: 'Node 3', status: 'healthy' },
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
          Architecture
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
          <div className="glass mt-8 rounded-lg p-6">
            <h3 className="mb-4 text-2xl font-bold">
              {nodes.find(n => n.id === selectedNode)?.label}
            </h3>
            <p className="text-gray-300">
              节点详细信息...
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
```

### 测试要点

- [ ] 节点正确渲染
- [ ] 鼠标悬停效果正常
- [ ] 数据流动动画流畅
- [ ] 点击交互正常
- [ ] 3D旋转控制正常

---

## 第3周：数据瀑布与功能立方体

### 目标
- ✅ 实现数据流瀑布效果
- ✅ 实现功能立方体
- ✅ 添加拖拽交互

### 任务清单

#### 3.1 数据瀑布

```typescript
// components/sections/DataFlowSection/Waterfall.tsx
'use client'

import { useRef, useEffect, useState } from 'react'

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
      className="relative h-[600px] overflow-hidden rounded-lg bg-black/50 p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="space-y-4">
        {data.map((item, index) => (
          <div
            key={item.id}
            className="glass animate-fade-in rounded-lg p-4 font-mono text-sm"
            style={{
              animationDelay: `${index * 0.1}s`,
              opacity: 1 - index * 0.05,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-quantum-blue">{item.request}</span>
              <span className={item.status.includes('✓') ? 'text-quantum-green' : 'text-red-500'}>
                {item.status}
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span>Latency: {item.latency}</span>
              <span>Node: {item.node}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 3.2 功能立方体

复制技术规格文档中的Cube3D组件代码。

### 测试要点

- [ ] 数据瀑布流动正常
- [ ] 鼠标悬停暂停功能正常
- [ ] 立方体自动旋转
- [ ] 立方体拖拽控制正常
- [ ] 立方体各面内容清晰

---

## 第4周：代码演示与交互优化

### 目标
- ✅ 实现3D终端
- ✅ 集成Monaco Editor
- ✅ 实现代码运行演示
- ✅ 添加滚动动画

### 任务清单

#### 4.1 安装Monaco Editor

```bash
pnpm add @monaco-editor/react monaco-editor
```

#### 4.2 创建终端组件

复制技术规格文档中的Terminal3D组件代码。

#### 4.3 滚动动画Hook

```bash
touch hooks/useScrollAnimation.ts
```

复制技术规格文档中的代码。

#### 4.4 为所有Section添加滚动动画

```typescript
// 示例：为ArchitectureSection添加动画
import { useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export default function ArchitectureSection() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useScrollAnimation(titleRef, {
    opacity: 1,
    y: 0,
    duration: 1,
  })

  useScrollAnimation(contentRef, {
    opacity: 1,
    scale: 1,
    duration: 1,
    delay: 0.3,
  })

  return (
    <section>
      <h2 ref={titleRef} style={{ opacity: 0, transform: 'translateY(50px)' }}>
        Architecture
      </h2>
      <div ref={contentRef} style={{ opacity: 0, transform: 'scale(0.95)' }}>
        {/* 内容 */}
      </div>
    </section>
  )
}
```

### 测试要点

- [ ] Monaco Editor正常加载
- [ ] 代码高亮正常
- [ ] 代码运行演示正常
- [ ] 滚动动画流畅
- [ ] 动画时序合理

---

## 第5周：内容完善与SEO优化

### 目标
- ✅ 完成所有Section内容
- ✅ 添加定价页面
- ✅ 添加CTA Section
- ✅ SEO优化
- ✅ 性能优化

### 任务清单

#### 5.1 创建剩余Sections

```bash
# 创建统计数据Section
touch components/sections/StatsSection/index.tsx

# 创建定价Section
touch components/sections/PricingSection/index.tsx

# 创建CTA Section
touch components/sections/CTASection/index.tsx
```

#### 5.2 统计数据Section

```typescript
// components/sections/StatsSection/index.tsx
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

  return <div ref={ref}>{count.toLocaleString()}</div>
}

export default function StatsSection() {
  return (
    <section className="relative min-h-screen w-full py-20">
      <div className="container mx-auto px-4">
        <h2 className="glow-text mb-16 text-center font-display text-5xl font-bold">
          Trusted by Enterprises
        </h2>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-blue">
              <Counter end={99.99} />%
            </div>
            <div className="text-gray-300">Uptime</div>
          </div>

          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-green">
              &lt;<Counter end={1} />ms
            </div>
            <div className="text-gray-300">Latency</div>
          </div>

          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-purple">
              <Counter end={10} />M+
            </div>
            <div className="text-gray-300">Requests/Day</div>
          </div>

          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-blue">
              <Counter end={100} />+
            </div>
            <div className="text-gray-300">Enterprises</div>
          </div>

          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-green">
              <Counter end={50} />+
            </div>
            <div className="text-gray-300">Countries</div>
          </div>

          <div className="glass rounded-lg p-8 text-center">
            <div className="mb-2 font-display text-6xl font-bold text-quantum-purple">
              24/7
            </div>
            <div className="text-gray-300">Support</div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

#### 5.3 SEO配置

```typescript
// app/layout.tsx 更新metadata
export const metadata: Metadata = {
  title: {
    default: 'QCC Plus - Enterprise Claude Proxy Gateway',
    template: '%s | QCC Plus'
  },
  description: 'Next-generation Claude API proxy with multi-tenant architecture, intelligent routing, and 99.99% uptime. Deploy in 60 seconds.',
  keywords: ['Claude Proxy', 'AI Gateway', 'API Proxy', 'Multi-tenant', 'Enterprise AI', 'Claude Code', 'Anthropic'],
  authors: [{ name: 'QCC Plus Team' }],
  creator: 'QCC Plus',
  publisher: 'QCC Plus',
  openGraph: {
    title: 'QCC Plus - The Quantum Gateway to Claude',
    description: 'Enterprise-grade proxy infrastructure for AI-powered applications',
    url: 'https://qccplus.com',
    siteName: 'QCC Plus',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QCC Plus'
      }
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QCC Plus - Enterprise Claude Proxy Gateway',
    description: 'Next-generation Claude API proxy with multi-tenant architecture',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

#### 5.4 性能优化检查

```bash
# 运行Lighthouse审计
pnpm build
pnpm start

# 在Chrome DevTools中运行Lighthouse
# 目标：
# - Performance > 90
# - Accessibility = 100
# - Best Practices = 100
# - SEO = 100
```

### 测试要点

- [ ] 所有Section内容完整
- [ ] 计数器动画正常
- [ ] SEO元数据正确
- [ ] Lighthouse得分达标
- [ ] 图片优化完成

---

## 第6周：测试与发布

### 目标
- ✅ 跨浏览器测试
- ✅ 移动端适配
- ✅ 性能优化
- ✅ 部署到生产环境

### 任务清单

#### 6.1 跨浏览器测试

**测试矩阵**：

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Chrome | 最新 | ⬜ | 优先支持 |
| Firefox | 最新 | ⬜ | 次优先 |
| Safari | 15+ | ⬜ | Mac/iOS |
| Edge | 最新 | ⬜ | Windows |
| Mobile Chrome | 最新 | ⬜ | Android |
| Mobile Safari | 15+ | ⬜ | iOS |

**测试检查项**：
- [ ] 3D渲染正常
- [ ] 动画流畅
- [ ] 交互功能正常
- [ ] 布局无错乱
- [ ] 字体加载正常

#### 6.2 移动端适配检查

```css
/* 添加移动端专用样式 */
@media (max-width: 768px) {
  /* 禁用3D效果，使用2D替代 */
  .three-canvas {
    display: none;
  }

  .fallback-2d {
    display: block;
  }

  /* 调整字体大小 */
  .hero-title {
    font-size: 3rem;
  }

  /* 简化动画 */
  * {
    animation-duration: 0.5s !important;
  }
}
```

#### 6.3 性能优化清单

- [ ] 图片压缩（使用next/image）
- [ ] 代码分割（dynamic import）
- [ ] 字体优化（font-display: swap）
- [ ] 懒加载（Intersection Observer）
- [ ] Service Worker缓存
- [ ] CDN配置
- [ ] Gzip/Brotli压缩

#### 6.4 Vercel部署

```bash
# 安装Vercel CLI
pnpm add -g vercel

# 登录Vercel
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

**环境变量配置**（Vercel Dashboard）：
```
NEXT_PUBLIC_SITE_URL=https://qccplus.com
NEXT_PUBLIC_API_URL=https://api.qccplus.com
```

#### 6.5 域名配置

1. 在Vercel Dashboard添加自定义域名
2. 配置DNS记录：
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. 等待SSL证书自动配置（约5分钟）

### 发布检查清单

- [ ] 所有功能测试通过
- [ ] 性能指标达标
- [ ] SEO配置完成
- [ ] 域名配置完成
- [ ] SSL证书正常
- [ ] 监控配置完成
- [ ] 备份配置完成

---

## 维护与迭代

### 监控指标

#### 性能监控

使用Vercel Analytics或Google Analytics监控：
- 页面加载时间
- FPS（帧率）
- 内存使用
- 错误率

#### 用户行为分析

- 页面访问量
- 跳出率
- 平均停留时间
- 转化率（点击CTA按钮）

### 迭代计划

**Phase 2（1-2个月后）**：
- [ ] 添加暗色/亮色主题切换
- [ ] 添加多语言支持（英文、中文）
- [ ] 添加实时Demo连接真实API
- [ ] 添加客户案例视频

**Phase 3（3-6个月后）**：
- [ ] 添加交互式教程
- [ ] 添加实时监控仪表盘
- [ ] 添加社区论坛
- [ ] 添加博客系统

---

## 常见问题与解决方案

### Q1: Three.js在服务端渲染报错

**问题**：
```
ReferenceError: window is not defined
```

**解决**：
```typescript
// 使用dynamic import禁用SSR
const ThreeComponent = dynamic(
  () => import('./ThreeComponent'),
  { ssr: false }
)
```

### Q2: 性能较差的设备卡顿

**问题**：FPS < 20，页面卡顿

**解决**：
```typescript
// 使用usePerformance Hook自动降级
const { deviceTier } = usePerformance()

const config = {
  high: { particles: 50000, quality: 'high' },
  medium: { particles: 20000, quality: 'medium' },
  low: { particles: 5000, quality: 'low' },
}[deviceTier]
```

### Q3: Monaco Editor加载慢

**问题**：Monaco Editor体积大，首次加载慢

**解决**：
```typescript
// 懒加载Monaco Editor
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>
  }
)
```

### Q4: 移动端3D效果不佳

**问题**：移动端GPU性能有限

**解决**：
```typescript
// 移动端使用2D替代
import { useMediaQuery } from '@/hooks/useMediaQuery'

function HeroSection() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  return isMobile ? <Hero2D /> : <Hero3D />
}
```

---

## 资源链接

### 官方文档
- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [GSAP Documentation](https://greensock.com/docs/)

### 学习资源
- [Three.js Journey](https://threejs-journey.com/)
- [React Three Fiber Examples](https://docs.pmnd.rs/react-three-fiber/getting-started/examples)
- [GSAP Tutorials](https://greensock.com/learning/)

### 工具
- [Sketchfab](https://sketchfab.com/) - 3D模型资源
- [Poly Haven](https://polyhaven.com/) - 免费纹理和HDRI
- [Shadertoy](https://www.shadertoy.com/) - Shader示例

---

## 总结

这个路线图提供了一个清晰的实现路径，从项目初始化到最终发布。关键要点：

1. **循序渐进**：先实现核心功能，再添加细节
2. **性能优先**：始终关注性能指标，及时优化
3. **渐进增强**：移动端降级，保证基础体验
4. **持续迭代**：发布后继续优化和添加新功能

预计6-7周可以完成一个高质量的官网，创造业界领先的用户体验。

**祝开发顺利！** 🚀

---

**文档版本**: v1.0
**最后更新**: 2025-11-23
**创建者**: QCC Plus Team
