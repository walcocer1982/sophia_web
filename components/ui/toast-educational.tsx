import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  variant?: "success" | "encouragement" | "gentle-correction" | "info" | "warning" | "learning-tip"
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
  duration?: number // Auto-close duration in ms, 0 to disable
  showIcon?: boolean
  className?: string
}

// Toast Context for managing toasts globally
type ToastType = ToastProps & { id: string }

interface ToastContextType {
  toasts: ToastType[]
  addToast: (toast: Omit<ToastType, "id">) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

// Toast Provider Component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([])

  const addToast = React.useCallback((toast: Omit<ToastType, "id">) => {
    const id = Math.random().toString(36).slice(2)
    const newToast: ToastType = { ...toast, id }

    setToasts(prev => [...prev, newToast])

    // Auto-remove after duration (default 5 seconds)
    const duration = toast.duration !== undefined ? toast.duration : 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAll = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Individual Toast Component
const Toast: React.FC<ToastProps & { id?: string; onRemove?: () => void }> = ({
  variant = "info",
  title,
  message,
  action,
  onClose,
  showIcon = true,
  className,
  onRemove
}) => {
  const [isVisible, setIsVisible] = React.useState(true)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
      onRemove?.()
    }, 300) // Animation duration
  }

  // Educational configurations with gentle, positive messaging
  const variantConfig = {
    success: {
      colors: "bg-green-50 border-green-200 text-green-800",
      iconColor: "text-green-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      defaultTitle: "¡Excelente trabajo!"
    },
    encouragement: {
      colors: "bg-purple-50 border-purple-200 text-purple-800",
      iconColor: "text-purple-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      defaultTitle: "¡Vas muy bien!"
    },
    "gentle-correction": {
      colors: "bg-blue-50 border-blue-200 text-blue-800",
      iconColor: "text-blue-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      defaultTitle: "Vamos a repasar"
    },
    info: {
      colors: "bg-cyan-50 border-cyan-200 text-cyan-800",
      iconColor: "text-cyan-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
      defaultTitle: "Información útil"
    },
    warning: {
      colors: "bg-yellow-50 border-yellow-200 text-yellow-800",
      iconColor: "text-yellow-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      defaultTitle: "Ten en cuenta"
    },
    "learning-tip": {
      colors: "bg-indigo-50 border-indigo-200 text-indigo-800",
      iconColor: "text-indigo-600",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      defaultTitle: "Tip de aprendizaje"
    }
  }

  const config = variantConfig[variant]

  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300 ease-out",
        config.colors,
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          {showIcon && (
            <div className={cn("flex-shrink-0", config.iconColor)}>
              {config.icon}
            </div>
          )}

          <div className={cn("ml-3 w-0 flex-1", !showIcon && "ml-0")}>
            {(title || config.defaultTitle) && (
              <p className="text-sm font-medium">
                {title || config.defaultTitle}
              </p>
            )}
            <p className={cn(
              "text-sm",
              title || config.defaultTitle ? "mt-1" : ""
            )}>
              {message}
            </p>

            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 hover:opacity-75"
              onClick={handleClose}
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}

// Educational Toast Helpers
export const educationalToasts = {
  success: (message: string, title?: string) => ({
    variant: "success" as const,
    message,
    title,
    duration: 4000
  }),

  encouragement: (message: string, title?: string) => ({
    variant: "encouragement" as const,
    message,
    title,
    duration: 6000
  }),

  gentleCorrection: (message: string, title?: string, action?: ToastProps["action"]) => ({
    variant: "gentle-correction" as const,
    message,
    title,
    action,
    duration: 8000 // Longer for corrections
  }),

  learningTip: (message: string, title?: string) => ({
    variant: "learning-tip" as const,
    message,
    title,
    duration: 10000 // Longer for tips
  }),

  info: (message: string, title?: string) => ({
    variant: "info" as const,
    message,
    title,
    duration: 5000
  })
}

export { Toast }