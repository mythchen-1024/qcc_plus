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
