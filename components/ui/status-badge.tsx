import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

interface StatusBadgeProps {
  status: "not-started" | "in-progress" | "completed" | "mastered" | "needs-review" | "locked"
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline" | "glass"
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
  pulseAnimation?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  variant = "default",
  showIcon = true,
  children,
  className,
  pulseAnimation = false
}) => {
  // Status configurations with educational messaging
  const statusConfig = {
    "not-started": {
      label: "No iniciado",
      colors: {
        default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
        outline: "border-gray-300 text-gray-600 hover:bg-gray-50",
        glass: "ds-bg-progress-glass"
      },
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v3.586l1.707-1.707a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8 10.586V7z" clipRule="evenodd" />
        </svg>
      )
    },
    "in-progress": {
      label: "En progreso",
      colors: {
        default: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        outline: "border-blue-300 text-blue-700 hover:bg-blue-50",
        glass: "ds-bg-progress-glass"
      },
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    "completed": {
      label: "Completado",
      colors: {
        default: "bg-green-100 text-green-800 hover:bg-green-200",
        outline: "border-green-300 text-green-700 hover:bg-green-50",
        glass: "ds-bg-success-glass"
      },
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    "mastered": {
      label: "Dominado",
      colors: {
        default: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        outline: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
        glass: "ds-bg-mastery-glass"
      },
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    },
    "needs-review": {
      label: "Requiere repaso",
      colors: {
        default: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        outline: "border-yellow-300 text-yellow-700 hover:bg-yellow-50",
        glass: "ds-bg-progress-glass"
      },
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    "locked": {
      label: "Bloqueado",
      colors: {
        default: "bg-gray-100 text-gray-500 cursor-not-allowed",
        outline: "border-gray-200 text-gray-400 cursor-not-allowed",
        glass: "ds-bg-progress-glass opacity-50 cursor-not-allowed"
      },
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const config = statusConfig[status]

  // Size configurations
  const sizeConfig = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  }

  return (
    <Badge
      className={cn(
        sizeConfig[size],
        config.colors[variant],
        pulseAnimation && status === "in-progress" && "animate-pulse",
        "inline-flex items-center gap-1 font-medium transition-colors",
        className
      )}
    >
      {showIcon && (
        <span className="flex-shrink-0">
          {config.icon}
        </span>
      )}
      <span className="leading-none">
        {children || config.label}
      </span>
    </Badge>
  )
}

// Predefined educational status badges
const LessonStatusBadge: React.FC<{
  completed: boolean
  mastered?: boolean
  locked?: boolean
  inProgress?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}> = ({ completed, mastered, locked, inProgress, ...props }) => {
  let status: StatusBadgeProps["status"] = "not-started"

  if (locked) status = "locked"
  else if (mastered) status = "mastered"
  else if (completed) status = "completed"
  else if (inProgress) status = "in-progress"

  return <StatusBadge status={status} {...props} />
}

const SkillStatusBadge: React.FC<{
  level: "beginner" | "intermediate" | "advanced" | "expert"
  className?: string
  size?: "sm" | "md" | "lg"
}> = ({ level, ...props }) => {
  const levelToStatus: Record<string, StatusBadgeProps["status"]> = {
    beginner: "in-progress",
    intermediate: "completed",
    advanced: "mastered",
    expert: "mastered"
  }

  const levelLabels = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
    expert: "Experto"
  }

  return (
    <StatusBadge
      status={levelToStatus[level]}
      {...props}
    >
      {levelLabels[level]}
    </StatusBadge>
  )
}

// Group component for multiple status badges
const StatusBadgeGroup: React.FC<{
  children: React.ReactNode
  className?: string
  orientation?: "horizontal" | "vertical"
  gap?: "sm" | "md" | "lg"
}> = ({
  children,
  className,
  orientation = "horizontal",
  gap = "sm"
}) => {
  const gapConfig = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3"
  }

  return (
    <div className={cn(
      "flex flex-wrap",
      orientation === "vertical" ? "flex-col items-start" : "flex-row items-center",
      gapConfig[gap],
      className
    )}>
      {children}
    </div>
  )
}

export {
  StatusBadge,
  LessonStatusBadge,
  SkillStatusBadge,
  StatusBadgeGroup
}