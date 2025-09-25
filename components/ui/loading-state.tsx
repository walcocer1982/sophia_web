import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  type?: "spinner" | "dots" | "pulse" | "skeleton" | "thinking"
  size?: "sm" | "md" | "lg"
  message?: string
  submessage?: string
  variant?: "default" | "gentle" | "encouraging"
  className?: string
  fullScreen?: boolean
  overlay?: boolean
  progress?: number // 0-100 for progress indicators
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  size = "md",
  message,
  submessage,
  variant = "gentle",
  className,
  fullScreen = false,
  overlay = false,
  progress
}) => {
  // Gentle, encouraging messages for different states
  const defaultMessages = {
    default: {
      spinner: "Cargando...",
      dots: "Procesando...",
      pulse: "Preparando contenido...",
      skeleton: "Organizando información...",
      thinking: "SOPHIA está pensando..."
    },
    gentle: {
      spinner: "Un momento, por favor",
      dots: "Preparando tu lección",
      pulse: "Organizando el contenido",
      skeleton: "Cargando información",
      thinking: "SOPHIA está analizando tu respuesta"
    },
    encouraging: {
      spinner: "¡Casi listo para aprender!",
      dots: "Preparando algo genial para ti",
      pulse: "Construyendo tu experiencia",
      skeleton: "Organizando tus materiales",
      thinking: "SOPHIA está creando una respuesta personalizada"
    }
  }

  const displayMessage = message || defaultMessages[variant][type]

  // Size configurations
  const sizeConfig = {
    sm: { spinner: "w-4 h-4", text: "text-sm", spacing: "space-y-2" },
    md: { spinner: "w-6 h-6", text: "text-base", spacing: "space-y-3" },
    lg: { spinner: "w-8 h-8", text: "text-lg", spacing: "space-y-4" }
  }

  const config = sizeConfig[size]

  // Loading animations
  const LoadingSpinner = () => (
    <svg
      className={cn(config.spinner, "animate-spin text-blue-600")}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  const LoadingDots = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-blue-600",
            size === "sm" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-2.5 h-2.5"
          )}
          style={{
            animation: `bounce 1.4s infinite both`,
            animationDelay: `${i * 0.16}s`
          }}
        />
      ))}
    </div>
  )

  const LoadingPulse = () => (
    <div className={cn(
      "rounded-full bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse",
      config.spinner
    )} />
  )

  const LoadingSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
      </div>
    </div>
  )

  const LoadingThinking = () => (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <div className={cn(
        "rounded-lg bg-gradient-to-r from-purple-100 to-blue-100 p-3",
        "animate-pulse border"
      )}>
        <div className="flex items-center space-x-2 text-purple-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">Analizando...</span>
        </div>
      </div>
    </div>
  )

  const renderLoadingAnimation = () => {
    switch (type) {
      case "dots": return <LoadingDots />
      case "pulse": return <LoadingPulse />
      case "skeleton": return <LoadingSkeleton />
      case "thinking": return <LoadingThinking />
      default: return <LoadingSpinner />
    }
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      config.spacing,
      className
    )}>
      {/* Progress bar if provided */}
      {progress !== undefined && (
        <div className="w-full max-w-xs mb-4">
          <div className="bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round(progress)}% completado
          </div>
        </div>
      )}

      {/* Loading Animation */}
      {type !== "skeleton" && (
        <div className="flex justify-center">
          {renderLoadingAnimation()}
        </div>
      )}

      {type === "skeleton" && renderLoadingAnimation()}

      {/* Messages */}
      <div className="space-y-1">
        {displayMessage && (
          <div className={cn(
            "font-medium text-foreground",
            config.text
          )}>
            {displayMessage}
          </div>
        )}

        {submessage && (
          <div className="text-sm text-muted-foreground max-w-sm">
            {submessage}
          </div>
        )}
      </div>
    </div>
  )

  // Full screen loading overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  // Overlay on parent container
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        {content}
      </div>
    )
  }

  return content
}

// Predefined loading states for common educational scenarios
const LessonLoadingState: React.FC<Omit<LoadingStateProps, "type" | "variant">> = (props) => (
  <LoadingState
    type="pulse"
    variant="encouraging"
    message="Preparando tu lección"
    submessage="Organizando los conceptos de manera clara y ordenada"
    {...props}
  />
)

const SophiaThinkingState: React.FC<Omit<LoadingStateProps, "type" | "variant">> = (props) => (
  <LoadingState
    type="thinking"
    variant="gentle"
    message="SOPHIA está analizando"
    submessage="Creando una respuesta personalizada para ti"
    {...props}
  />
)

const ContentLoadingState: React.FC<Omit<LoadingStateProps, "type">> = (props) => (
  <LoadingState
    type="skeleton"
    {...props}
  />
)

const ProgressLoadingState: React.FC<LoadingStateProps & {
  currentStep?: string
  totalSteps?: number
  currentStepNumber?: number
}> = ({ currentStep, totalSteps, currentStepNumber, ...props }) => {
  const progressPercentage = totalSteps && currentStepNumber
    ? (currentStepNumber / totalSteps) * 100
    : props.progress

  return (
    <LoadingState
      type="spinner"
      variant="encouraging"
      progress={progressPercentage}
      message={currentStep || props.message}
      submessage={
        totalSteps && currentStepNumber
          ? `Paso ${currentStepNumber} de ${totalSteps}`
          : props.submessage
      }
      {...props}
    />
  )
}

export {
  LoadingState,
  LessonLoadingState,
  SophiaThinkingState,
  ContentLoadingState,
  ProgressLoadingState
}