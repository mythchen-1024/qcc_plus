#!/bin/bash

# QCC Plus 官网项目初始化脚本
# 用途：自动创建 website 目录并初始化 Next.js 项目
# 使用方法：./scripts/init-website.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
  ___   ___  ___   ____  _
 / _ \ / __\/  __|  _ \| |_   _ ___
| | | | |  | |   | |_) | | | | / __|
| |_| | |__| |_  |  __/| | |_| \__ \
 \__\_\\____\____||_|   |_|\__,_|___/

Official Website Initialization Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
echo -e "${NC}"

# 检查依赖
print_step "Step 1: 检查环境依赖"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) ✓"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，正在安装..."
    npm install -g pnpm
    print_success "pnpm 安装完成"
else
    print_success "pnpm $(pnpm -v) ✓"
fi

# 检查 Git
if ! command -v git &> /dev/null; then
    print_warning "Git 未安装，建议安装以便版本控制"
else
    print_success "Git $(git --version | cut -d' ' -f3) ✓"
fi

# 确认项目根目录
print_step "Step 2: 确认项目路径"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBSITE_DIR="$PROJECT_ROOT/website"

print_info "项目根目录: $PROJECT_ROOT"
print_info "网站目录: $WEBSITE_DIR"

# 检查 website 目录是否已存在
if [ -d "$WEBSITE_DIR" ]; then
    print_warning "website 目录已存在！"
    read -p "是否删除重建？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "删除旧目录..."
        rm -rf "$WEBSITE_DIR"
        print_success "已删除"
    else
        print_error "初始化已取消"
        exit 0
    fi
fi

# 创建 Next.js 项目
print_step "Step 3: 创建 Next.js 项目"

print_info "使用 create-next-app 初始化项目..."
cd "$PROJECT_ROOT"

pnpm create next-app website \
    --typescript \
    --tailwind \
    --app \
    --no-src-dir \
    --import-alias "@/*" \
    --use-pnpm

print_success "Next.js 项目创建完成"

# 进入 website 目录
cd "$WEBSITE_DIR"

# 安装依赖
print_step "Step 4: 安装核心依赖"

print_info "安装 3D 渲染库..."
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing three-mesh-bvh

print_info "安装动画库..."
pnpm add gsap framer-motion react-spring

print_info "安装代码编辑器..."
pnpm add @monaco-editor/react monaco-editor

print_info "安装工具库..."
pnpm add clsx tailwind-merge date-fns lodash

print_info "安装开发依赖..."
pnpm add -D @types/three @types/lodash eslint-config-prettier prettier

print_success "所有依赖安装完成"

# 创建目录结构
print_step "Step 5: 创建目录结构"

print_info "创建组件目录..."
mkdir -p components/{sections,3d,ui,animations}
mkdir -p components/sections/{HeroSection,ArchitectureSection,DataFlowSection,FeatureCubeSection,CodeDemoSection,StatsSection,PricingSection,CTASection}
mkdir -p components/3d/shaders

print_info "创建工具目录..."
mkdir -p hooks lib styles types

print_info "创建资源目录..."
mkdir -p public/{models,textures,images,videos}

print_success "目录结构创建完成"

# 创建配置文件
print_step "Step 6: 创建配置文件"

# Prettier 配置
print_info "创建 Prettier 配置..."
cat > .prettierrc.json << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
EOF

# ESLint 配置更新
print_info "更新 ESLint 配置..."
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-page-custom-font": "off"
  }
}
EOF

# VS Code 设置
print_info "创建 VS Code 配置..."
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.associations": {
    "*.vert": "glsl",
    "*.frag": "glsl"
  }
}
EOF

cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "slevesque.shader"
  ]
}
EOF

print_success "配置文件创建完成"

# 创建基础组件文件
print_step "Step 7: 创建基础组件"

# Scene 组件
print_info "创建 3D Scene 组件..."
cat > components/3d/Scene.tsx << 'EOF'
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
  cameraPosition = [0, 0, 10],
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

      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  )
}
EOF

# 工具函数
print_info "创建工具函数..."
cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# 常量定义
cat > lib/constants.ts << 'EOF'
// 色彩方案
export const COLORS = {
  quantum: {
    blue: '#00d4ff',
    blueGlow: 'rgba(0, 212, 255, 0.6)',
    purple: '#b400ff',
    purpleGlow: 'rgba(180, 0, 255, 0.5)',
    green: '#00ff88',
    greenGlow: 'rgba(0, 255, 136, 0.4)',
  },
  bg: {
    primary: '#0a0a0f',
    secondary: '#141420',
    tertiary: '#1a1a2e',
  },
  status: {
    warning: '#ff6b00',
    error: '#ff0055',
  },
}

// 动画配置
export const ANIMATION = {
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 1.2,
    verySlow: 2.4,
  },
  easing: {
    smooth: 'power2.out',
    elastic: 'elastic.out(1, 0.3)',
    bounce: 'bounce.out',
  },
}

// 性能配置
export const PERFORMANCE = {
  particles: {
    high: 50000,
    medium: 20000,
    low: 5000,
  },
  targetFPS: 60,
  minFPS: 30,
}
EOF

print_success "基础组件创建完成"

# 更新 Tailwind 配置
print_step "Step 8: 配置 Tailwind CSS"

print_info "更新 Tailwind 配置..."
cat > tailwind.config.ts << 'EOF'
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
        float: 'float 6s ease-in-out infinite',
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
EOF

print_success "Tailwind 配置完成"

# 创建 README
print_step "Step 9: 创建项目文档"

cat > README.md << 'EOF'
# QCC Plus Official Website

**Quantum Gateway** - 前无古人后无来者的3D交互式产品官网

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

访问 http://localhost:3000

## 📚 文档

完整设计文档请查看：
- [设计概念](../docs/website-design-concept.md)
- [技术实现规格](../docs/website-technical-spec.md)
- [实现路线图](../docs/website-implementation-roadmap.md)
- [文档总览](../docs/website-README.md)

## 🛠️ 技术栈

- **框架**: Next.js 14 + React 18 + TypeScript
- **3D渲染**: Three.js + React Three Fiber
- **动画**: GSAP + Framer Motion
- **样式**: Tailwind CSS
- **代码编辑器**: Monaco Editor

## 📁 目录结构

```
website/
├── app/                 # Next.js App Router
├── components/          # React 组件
│   ├── sections/       # 页面 Section
│   ├── 3d/            # 3D 组件
│   ├── ui/            # UI 组件
│   └── animations/    # 动画组件
├── hooks/              # 自定义 Hooks
├── lib/                # 工具库
├── public/             # 静态资源
└── styles/             # 样式文件
```

## 🎨 核心特性

- 🌌 3D量子隧道首屏
- 🔮 全息架构图
- 🌊 数据流瀑布
- 💎 功能矩阵立方体
- 🎮 沉浸式代码演示
- ⚡ 性能优化与自适应降级
- 📱 完美的移动端适配

## 📈 开发计划

按照 [实现路线图](../docs/website-implementation-roadmap.md) 进行开发，预计 6-7 周完成。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT

---

**QCC Plus Team** - 让技术变得可触摸
EOF

print_success "项目文档创建完成"

# Git 初始化
print_step "Step 10: Git 版本控制"

if command -v git &> /dev/null; then
    if [ ! -d .git ]; then
        print_info "初始化 Git 仓库..."
        git init

        # 创建 .gitignore（如果不存在）
        if [ ! -f .gitignore ]; then
            cat > .gitignore << 'EOF'
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Next.js
.next
out
dist
build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode
.idea
*.swp
*.swo
*~
EOF
        fi

        git add .
        git commit -m "feat: initialize QCC Plus website project

- Setup Next.js 14 with TypeScript and Tailwind CSS
- Install Three.js, GSAP, and Monaco Editor
- Create project structure
- Add basic configuration files
- Add documentation

🚀 Generated with QCC Plus init script"

        print_success "Git 仓库初始化完成"
    else
        print_info "Git 仓库已存在，跳过初始化"
    fi
else
    print_warning "Git 未安装，跳过版本控制初始化"
fi

# 完成
print_step "✨ 初始化完成！"

echo -e "${GREEN}"
cat << "EOF"
  _____ _   _  ____ ____ _____ ____ ____
 / ____| | | |/ ___/ ___| ____/ ___/ ___|
| (___ | | | | |  | |   |  _| \___ \___ \
 \___ \| | | | |  | |   | |___ ___) |__) |
 ____) | |_| | |__| |___| ____|____/____/
|_____/ \___/ \____\____|_____|

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
echo -e "${NC}"

print_success "项目已成功初始化！"
echo
print_info "下一步："
echo -e "  ${CYAN}1.${NC} cd website"
echo -e "  ${CYAN}2.${NC} pnpm dev"
echo -e "  ${CYAN}3.${NC} 打开浏览器访问 http://localhost:3000"
echo
print_info "开发文档："
echo -e "  ${CYAN}•${NC} 设计概念: docs/website-design-concept.md"
echo -e "  ${CYAN}•${NC} 技术规格: docs/website-technical-spec.md"
echo -e "  ${CYAN}•${NC} 实现路线图: docs/website-implementation-roadmap.md"
echo
print_info "开始创造前无古人后无来者的官网吧！🚀"
echo
