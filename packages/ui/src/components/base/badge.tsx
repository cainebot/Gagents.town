"use client"

import { type ReactNode } from "react"
import { cx } from "../../utils/cx"

const variantStyles = {
  default:
    "bg-white/10 text-white border-white/10",
  brand:
    "bg-brand-600/15 text-brand-300 border-brand-600/20",
  success:
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/15 text-amber-400 border-amber-500/20",
  error:
    "bg-red-500/15 text-red-400 border-red-500/20",
  info:
    "bg-blue-500/15 text-blue-400 border-blue-500/20",
  gray:
    "bg-gray-500/15 text-gray-400 border-gray-500/20",
} as const

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
  lg: "text-sm px-3 py-1",
} as const

export type BadgeVariant = keyof typeof variantStyles
export type BadgeSize = keyof typeof sizeStyles

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  className?: string
}

export function Badge({
  variant = "default",
  size = "md",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-medium border",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
