import * as React from "react"
import { cn } from "@/lib/utils"

interface SophiaThinkingProps {
  message?: string
  stage?: "analyzing" | "thinking" | "responding" | "finalizing"
  showProgress?: boolean
  className?: string
  variant?: "gentle" | "encouraging" | "focused"
}

const SophiaThinking: React.FC<SophiaThinkingProps> = ({
  message,
  stage = "thinking",
  showProgress = true,
  className,
  variant = "gentle"
}) => {
  const [currentDots, setCurrentDots] = React.useState(1)
  const [progress, setProgress] = React.useState(0)

  // Animate dots
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDots(prev => (prev >= 3 ? 1 : prev + 1))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Simulate progress
  React.useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 15 + 5 // 5-20% increments
          return Math.min(prev + increment, 95) // Never reach 100%
        })
      }, 800)

      return () => clearInterval(interval)
    }
  }, [showProgress])

  // Messages por stage
  const stageConfig = {
    analyzing: {
      messages: {
        gentle: "Analizando tu respuesta...",
        encouraging: "¡Revisando tu excelente trabajo!",
        focused: "Procesando información..."
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    thinking: {
      messages: {
        gentle: "SOPHIA está pensando...",
        encouraging: "SOPHIA está creando una respuesta perfecta para ti",
        focused: "Evaluando tu comprensión..."
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    responding: {
      messages: {
        gentle: "Preparando tu respuesta personalizada...",
        encouraging: "¡Casi listo con algo genial para ti!",
        focused: "Formulando respuesta educativa..."
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    finalizing: {
      messages: {
        gentle: "Últimos ajustes...",
        encouraging: "¡Perfeccionando tu experiencia de aprendizaje!",
        focused: "Optimizando respuesta..."
      },
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  }

  const config = stageConfig[stage]
  const displayMessage = message || config.messages[variant]

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200/50 max-w-md",
      "animate-in slide-in-from-left-4 fade-in duration-300",
      className
    )}>
      {/* SOPHIA Avatar with gentle pulsing */}
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold animate-pulse">
          S
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-purple-600">
            {config.icon}
          </span>
          <span className="text-sm font-medium text-purple-800">
            {displayMessage}
            <span className="inline-block w-4 text-left">
              {".".repeat(currentDots)}
            </span>
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-2">
            <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {stage === "analyzing" && "Procesando..."}
              {stage === "thinking" && "Evaluando..."}
              {stage === "responding" && "Generando..."}
              {stage === "finalizing" && "Finalizando..."}
            </p>
          </div>
        )}
      </div>

      {/* Thinking Animation */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// Typing indicator component
const SophiaTyping: React.FC<{
  className?: string
  message?: string
}> = ({ className, message = "SOPHIA está escribiendo..." }) => {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-muted/50 rounded-lg max-w-xs",
      "animate-in slide-in-from-left-4 fade-in duration-200",
      className
    )}>
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
        S
      </div>

      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-1 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Success celebration component
const SophiaSuccess: React.FC<{
  message?: string
  className?: string
  onComplete?: () => void
}> = ({
  message = "¡Excelente respuesta!",
  className,
  onComplete
}) => {
  React.useEffect(() => {
    if (onComplete) {
      const timeout = setTimeout(onComplete, 2000)
      return () => clearTimeout(timeout)
    }
  }, [onComplete])

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50",
      "animate-in zoom-in-95 fade-in duration-500",
      className
    )}>
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
      </div>

      <div className="flex-1">
        <p className="text-green-800 font-medium">{message}</p>
      </div>

      <div className="text-2xl animate-bounce">🎉</div>
    </div>
  )
}

export {
  SophiaThinking,
  SophiaTyping,
  SophiaSuccess
}