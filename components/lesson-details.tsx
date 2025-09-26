"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { LoadingState } from "@/components/ui/loading-state"
import { HoverLift } from "@/components/ui/micro-interactions"
import { ChevronDown, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "./ui/button"

interface LessonDetailsProps {
  lesson?: {
    title?: string
    description?: string
    learningObjectives?: string[]
    keyPoints?: string[]
    maxQuestions?: number
    minMasteryToPass?: number
  }
  debugInfo?: {
    currentMomentId?: number
    lastResponse?: string
    mastery?: number
    tags?: string[]
    nextStep?: string
    attempts?: number
    sessionId?: string
  }
}

export function LessonDetails({ lesson, debugInfo }: LessonDetailsProps) {
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
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 rounded-lg border transition-all duration-200 group">
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
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="ds-text-body-md font-medium">🔍 AI Debug Log</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="mt-3 space-y-2 bg-black/5 dark:bg-white/5 p-3 rounded-lg font-mono text-xs">
              <div className="text-orange-600 dark:text-orange-400 font-semibold">
                === SOPHIA AI DEBUG LOG ===
              </div>
              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <div>📍 Estado: {debugInfo?.sessionId ? 'Sesión activa' : 'Esperando interacción...'}</div>
                <div>🎯 Momento: {debugInfo?.currentMomentId !== undefined ? `M${debugInfo.currentMomentId + 1}` : 'Pendiente'}</div>
                <div className="break-words">💭 Última: {debugInfo?.lastResponse ? debugInfo.lastResponse.substring(0, 100) + '...' : 'N/A'}</div>
                <div>📊 Mastery: {debugInfo?.mastery !== undefined ? `${Math.round(debugInfo.mastery * 100)}%` : 'N/A'}</div>
                <div>🏷️ Tags: {debugInfo?.tags?.join(', ') || 'N/A'}</div>
                <div>⏭️ Next Step: {debugInfo?.nextStep || 'N/A'}</div>
                <div>🔄 Intentos: {debugInfo?.attempts || 0}</div>
                <div>🆔 Session: {debugInfo?.sessionId ? debugInfo.sessionId.substring(0, 8) + '...' : 'N/A'}</div>
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                  <span className="text-yellow-600 dark:text-yellow-400">
                    [INFO] Debug log activo para desarrollo
                  </span>
                </div>
                <div className="text-gray-500 text-[10px]">
                  Timestamp: {new Date().toLocaleTimeString('es-PE')}
                </div>
              </div>
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
