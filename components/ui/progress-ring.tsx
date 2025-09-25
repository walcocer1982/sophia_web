import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  progress: number // 0-100
  size?: "sm" | "md" | "lg" | "xl"
  thickness?: "thin" | "medium" | "thick"
  variant?: "success" | "learning" | "mastery" | "progress" | "warning"
  showPercentage?: boolean
  children?: React.ReactNode
  className?: string
  animated?: boolean
  label?: string
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = "md",
  thickness = "medium",
  variant = "progress",
  showPercentage = true,
  children,
  className,
  animated = true,
  label
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  // Size configurations
  const sizeConfig = {
    sm: { diameter: 48, strokeWidth: thickness === "thin" ? 3 : thickness === "thick" ? 6 : 4 },
    md: { diameter: 64, strokeWidth: thickness === "thin" ? 4 : thickness === "thick" ? 8 : 6 },
    lg: { diameter: 96, strokeWidth: thickness === "thin" ? 6 : thickness === "thick" ? 12 : 8 },
    xl: { diameter: 128, strokeWidth: thickness === "thin" ? 8 : thickness === "thick" ? 16 : 12 }
  }

  const { diameter, strokeWidth } = sizeConfig[size]
  const radius = (diameter - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference

  // Color configurations following our design system
  const colorConfig = {
    success: "text-green-600 stroke-green-600",
    learning: "text-purple-600 stroke-purple-600",
    mastery: "text-emerald-600 stroke-emerald-600",
    progress: "text-blue-600 stroke-blue-600",
    warning: "text-yellow-600 stroke-yellow-600"
  }

  const textSizeConfig = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
        role="img"
        aria-label={label || `${clampedProgress}% completo`}
      >
        {/* Background Circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted stroke-muted/20"
        />

        {/* Progress Circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            colorConfig[variant],
            animated && "transition-all duration-1000 ease-out"
          )}
          style={{
            transformOrigin: `${diameter / 2}px ${diameter / 2}px`
          }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (showPercentage && (
          <>
            <span className={cn(
              "font-bold tabular-nums leading-none",
              colorConfig[variant],
              textSizeConfig[size]
            )}>
              {Math.round(clampedProgress)}%
            </span>
            {label && size !== "sm" && (
              <span className={cn(
                "text-muted-foreground mt-0.5 leading-none",
                size === "xl" ? "text-xs" : "text-[10px]"
              )}>
                {label}
              </span>
            )}
          </>
        ))}
      </div>
    </div>
  )
}

// Predefined Educational Progress Rings
const MasteryRing: React.FC<Omit<ProgressRingProps, "variant" | "label">> = (props) => (
  <ProgressRing {...props} variant="mastery" label="Dominio" />
)

const LearningRing: React.FC<Omit<ProgressRingProps, "variant" | "label">> = (props) => (
  <ProgressRing {...props} variant="learning" label="Aprendizaje" />
)

const LessonProgressRing: React.FC<Omit<ProgressRingProps, "variant" | "label">> = (props) => (
  <ProgressRing {...props} variant="progress" label="Progreso" />
)

// Compound component for multiple rings (like skill breakdown)
const ProgressRingGroup: React.FC<{
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
  gap?: "sm" | "md" | "lg"
}> = ({
  children,
  className,
  orientation = "horizontal",
  gap = "md"
}) => {
  const gapConfig = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }

  return (
    <div className={cn(
      "flex items-center",
      orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
      gapConfig[gap],
      className
    )}>
      {children}
    </div>
  )
}

export {
  ProgressRing,
  MasteryRing,
  LearningRing,
  LessonProgressRing,
  ProgressRingGroup
}