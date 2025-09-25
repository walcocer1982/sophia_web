import * as React from "react"
import { cn } from "@/lib/utils"

// Success celebration animation
interface CelebrationProps {
  trigger?: boolean
  children: React.ReactNode
  type?: "bounce" | "pulse" | "sparkle" | "check"
  intensity?: "subtle" | "medium" | "strong"
  className?: string
}

const Celebration: React.FC<CelebrationProps> = ({
  trigger = false,
  children,
  type = "bounce",
  intensity = "medium",
  className
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    if (trigger) {
      setIsAnimating(true)
      const timeout = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timeout)
    }
  }, [trigger])

  const animationClasses = {
    bounce: {
      subtle: "animate-bounce",
      medium: "animate-bounce scale-105",
      strong: "animate-bounce scale-110"
    },
    pulse: {
      subtle: "animate-pulse",
      medium: "animate-pulse scale-105",
      strong: "animate-pulse scale-110"
    },
    sparkle: {
      subtle: "animate-pulse brightness-110",
      medium: "animate-pulse scale-105 brightness-125",
      strong: "animate-pulse scale-110 brightness-150"
    },
    check: {
      subtle: "animate-in zoom-in-95 fade-in",
      medium: "animate-in zoom-in-90 fade-in scale-105",
      strong: "animate-in zoom-in-75 fade-in scale-110"
    }
  }

  return (
    <div className={cn(
      "transition-all duration-300",
      isAnimating && animationClasses[type][intensity],
      className
    )}>
      {children}

      {/* Success particles */}
      {isAnimating && type === "sparkle" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute text-yellow-400 animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Hover lift effect
interface HoverLiftProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  lift?: "subtle" | "medium" | "strong"
}

const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  className,
  disabled = false,
  lift = "medium"
}) => {
  const liftClasses = {
    subtle: "hover:-translate-y-0.5 hover:shadow-sm",
    medium: "hover:-translate-y-1 hover:shadow-md",
    strong: "hover:-translate-y-2 hover:shadow-lg"
  }

  return (
    <div className={cn(
      "transition-all duration-200 ease-out",
      !disabled && liftClasses[lift],
      disabled && "opacity-60 cursor-not-allowed",
      className
    )}>
      {children}
    </div>
  )
}

// Progress celebration - rings that expand when progress increases
interface ProgressCelebrationProps {
  progress: number
  previousProgress?: number
  className?: string
  celebrateAt?: number[] // Progress points to celebrate at
}

const ProgressCelebration: React.FC<ProgressCelebrationProps> = ({
  progress,
  previousProgress = 0,
  className,
  celebrateAt = [25, 50, 75, 100]
}) => {
  const [shouldCelebrate, setShouldCelebrate] = React.useState(false)
  const [celebrationMessage, setCelebrationMessage] = React.useState("")

  React.useEffect(() => {
    const milestone = celebrateAt.find(point =>
      previousProgress < point && progress >= point
    )

    if (milestone) {
      setShouldCelebrate(true)
      setCelebrationMessage(
        milestone === 25 ? "¡Buen comienzo!" :
        milestone === 50 ? "¡Vas por la mitad!" :
        milestone === 75 ? "¡Casi completo!" :
        milestone === 100 ? "¡Completado!" :
        "¡Excelente progreso!"
      )

      const timeout = setTimeout(() => setShouldCelebrate(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [progress, previousProgress, celebrateAt])

  if (!shouldCelebrate) return null

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center pointer-events-none",
      className
    )}>
      <div className="relative">
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
        <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-in zoom-in-95 fade-in">
          {celebrationMessage}
        </div>
      </div>
    </div>
  )
}

// Interactive button with micro-feedback
interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "gentle"
  feedback?: boolean
  loading?: boolean
  success?: boolean
  children: React.ReactNode
}

const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = "primary",
  feedback = true,
  loading = false,
  success = false,
  children,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const [isPressed, setIsPressed] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)

  React.useEffect(() => {
    if (success) {
      setShowSuccess(true)
      const timeout = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [success])

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900",
    success: "bg-green-600 hover:bg-green-700 text-white",
    gentle: "bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300"
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (feedback && !disabled && !loading) {
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 150)
    }
    onClick?.(e)
  }

  return (
    <button
      className={cn(
        "relative px-4 py-2 rounded-lg font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        variants[variant],
        feedback && "active:scale-95",
        isPressed && "scale-95",
        disabled && "opacity-50 cursor-not-allowed",
        loading && "cursor-wait",
        className
      )}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Success state */}
      {showSuccess && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-300 animate-in zoom-in-95 fade-in" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Content */}
      <span className={cn(
        "transition-opacity duration-200",
        (loading || showSuccess) && "opacity-0"
      )}>
        {children}
      </span>
    </button>
  )
}

// Smooth page transitions
const PageTransition: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className }) => {
  return (
    <div className={cn(
      "animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out",
      className
    )}>
      {children}
    </div>
  )
}

// Gentle attention grabber (for important but non-urgent notifications)
const GentleAttention: React.FC<{
  children: React.ReactNode
  active?: boolean
  className?: string
}> = ({ children, active = false, className }) => {
  return (
    <div className={cn(
      "transition-all duration-300",
      active && "animate-pulse ring-2 ring-blue-400/50 ring-offset-2",
      className
    )}>
      {children}
    </div>
  )
}

export {
  Celebration,
  HoverLift,
  ProgressCelebration,
  InteractiveButton,
  PageTransition,
  GentleAttention
}