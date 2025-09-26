"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { LoadingState } from "@/components/ui/loading-state"
import { HoverLift } from "@/components/ui/micro-interactions"
import { ChevronDown, ChevronLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"
import { useEffect, useState, useCallback } from "react"
import { getLessonDebugInfo } from "@/app/actions/debug-info"

interface LessonDetailsProps {
  lesson?: {
    id?: string
    title?: string
    description?: string
    learningObjectives?: string[]
    keyPoints?: string[]
    maxQuestions?: number
    minMasteryToPass?: number
  }
  onDebugRefresh?: () => void
}

export function LessonDetails({ lesson, onDebugRefresh }: LessonDetailsProps) {
  const [debugInfo, setDebugInfo] = useState<{
    sessionId?: string
    currentMomentId?: number | null
    mastery?: number | null
    lastMasteryDelta?: number | null
    tags?: string[]
    nextStep?: string | null
    updatedAt?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchDebugInfo = useCallback(async () => {
    if (!lesson?.id) return

    setIsLoading(true)
    try {
      const info = await getLessonDebugInfo(lesson.id)
      setDebugInfo(info)
    } catch (error) {
      console.error('Error fetching debug info:', error)
    } finally {
      setIsLoading(false)
    }
  }, [lesson?.id])

  // Initial fetch
  useEffect(() => {
    fetchDebugInfo()
  }, [fetchDebugInfo])

  // Listen for external refresh signals
  useEffect(() => {
    if (onDebugRefresh) {
      const refreshHandler = () => {
        fetchDebugInfo()
      }
      window.addEventListener('sophia-response-complete', refreshHandler)
      return () => {
        window.removeEventListener('sophia-response-complete', refreshHandler)
      }
    }
  }, [fetchDebugInfo, onDebugRefresh])

  // Auto-refresh every 3 seconds when there's an active session
  useEffect(() => {
    if (debugInfo?.sessionId) {
      const interval = setInterval(() => {
        fetchDebugInfo()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [debugInfo?.sessionId, fetchDebugInfo])
  if (!lesson) {
    return (
      <div className="p-4">
        <LoadingState
          type="skeleton"
          variant="gentle"
          message="Cargando detalles de la lección"
          submessage="Preparando tu contenido educativo"
          className="min-h-40"
        />
      </div>
    )
  }

  const progressPercentage = 0 // Por ahora sin progreso

  return (
    <div className="p-4 space-y-4">

      <Link href={`/lessons`} className="w-full inline-block mb-4">
          <Button variant="outline" className="w-full flex items-center justify-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Volver a lecciones
          </Button>
        </Link>

      <HoverLift lift="subtle">
        <Card className="border-2 hover:border-primary/20 transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="ds-text-heading-3 text-foreground leading-tight">
                  {lesson.title}
                </CardTitle>
                <p className="ds-text-body-sm text-muted-foreground mt-2 leading-relaxed">
                  {lesson.description}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </HoverLift>

      {/* Objectives Section */}
      <HoverLift lift="subtle">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 rounded-lg border transition-all duration-200 group cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="ds-text-body-md font-medium">Objetivos de la clase</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {lesson.learningObjectives ? (
              <ul className="ds-space-y-spacing-sm mt-3">
                {lesson.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="ds-text-body-sm text-muted-foreground leading-relaxed">{objective}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <LoadingState
                  type="skeleton"
                  variant="gentle"
                  message="Cargando objetivos..."
                  className="h-20"
                />
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </HoverLift>

      {/* AI Debug Log Section - TEMPORAL */}
      <HoverLift lift="subtle">
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 rounded-lg border transition-all duration-200 group">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${debugInfo?.sessionId ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="ds-text-body-md font-medium">🔍 AI Debug (DB Live)</span>
              {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="mt-3 space-y-2 bg-black/5 dark:bg-white/5 p-3 rounded-lg font-mono text-xs">
              <div className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-2">
                === SOPHIA DB MONITOR ===
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-2 text-xs"
                  onClick={fetchDebugInfo}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {debugInfo ? (
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <div className="text-green-600 dark:text-green-400">
                    ✅ Sesión: {debugInfo.sessionId || 'N/A'}
                  </div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    🎯 Momento: {debugInfo.currentMomentId !== null ? `M${debugInfo.currentMomentId}` : 'Inicio'}
                  </div>
                  <div className="font-semibold">
                    📊 Mastery: {debugInfo.mastery !== null && debugInfo.mastery !== undefined ? `${Math.round(debugInfo.mastery * 100)}%` : '0%'}
                  </div>
                  <div className={`font-semibold ${(debugInfo.lastMasteryDelta ?? 0) > 0 ? 'text-green-600' : (debugInfo.lastMasteryDelta ?? 0) < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    Δ Delta: {debugInfo.lastMasteryDelta !== null && debugInfo.lastMasteryDelta !== undefined ? `${debugInfo.lastMasteryDelta > 0 ? '+' : ''}${(debugInfo.lastMasteryDelta * 100).toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="text-purple-600 dark:text-purple-400">
                    🏷️ Tags: {debugInfo.tags?.length ? debugInfo.tags.join(', ') : 'ninguno'}
                  </div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400">
                    ⏭️ Next: {debugInfo.nextStep || 'N/A'}
                  </div>
                  <div className="text-gray-500 text-[10px] pt-2 border-t border-gray-300 dark:border-gray-700">
                    Actualizado: {debugInfo.updatedAt ? new Date(debugInfo.updatedAt).toLocaleTimeString('es-PE') : 'N/A'}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Esperando primera interacción con Sophia...
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </HoverLift>

      {/* Progress Summary at bottom */}
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <span className="ds-text-body-sm font-medium">Progreso General</span>
          <span className="ds-text-caption text-muted-foreground tabular-nums">
            {progressPercentage}% completado
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 bg-muted-foreground/10" />
      </div>
    </div>
  )
}
