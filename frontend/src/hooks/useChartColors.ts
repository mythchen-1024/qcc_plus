import { useMemo, useEffect, useState } from 'react'
import { useTheme } from '../themes/useTheme'

function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface ChartColors {
  success: string
  successBg: string
  warning: string
  warningBg: string
  danger: string
  dangerBg: string
  info: string
  infoBg: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  gridColor: string
  borderColor: string
  palette: string[]
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    forceUpdate(n => n + 1)
  }, [resolvedTheme])

  return useMemo(() => {
    const isDark = resolvedTheme === 'dark'

    const success500 = getCSSVariable('--color-success-500') || '#12B76A'
    const warning500 = getCSSVariable('--color-warning-500') || '#F59E0B'
    const danger500 = getCSSVariable('--color-danger-500') || '#EF4444'
    const info500 = getCSSVariable('--color-info-500') || '#3B82F6'
    const primary500 = getCSSVariable('--color-primary-500') || '#3B82F6'

    const textPrimary = getCSSVariable('--color-text-primary') || (isDark ? '#F8FAFC' : '#0F172A')
    const textSecondary = getCSSVariable('--color-text-secondary') || (isDark ? '#CBD5E1' : '#334155')
    const textMuted = getCSSVariable('--color-text-muted') || '#64748B'

    const borderDefault = getCSSVariable('--color-border-default') || (isDark ? '#334155' : '#CBD5E1')

    return {
      success: success500,
      successBg: hexToRgba(success500, 0.12),
      warning: warning500,
      warningBg: hexToRgba(warning500, 0.12),
      danger: danger500,
      dangerBg: hexToRgba(danger500, 0.12),
      info: info500,
      infoBg: hexToRgba(info500, 0.12),
      textPrimary,
      textSecondary,
      textMuted,
      gridColor: hexToRgba(isDark ? '#FFFFFF' : '#000000', isDark ? 0.08 : 0.06),
      borderColor: borderDefault,
      palette: [primary500, success500, warning500, '#A855F7', '#06B6D4', textMuted],
    }
  }, [resolvedTheme])
}
