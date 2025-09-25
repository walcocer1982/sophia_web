import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { ProgressRing } from "@/components/ui/progress-ring"
import { StatusBadge } from "@/components/ui/status-badge"
import { LoadingState } from "@/components/ui/loading-state"
import { HoverLift } from "@/components/ui/micro-interactions"
import { ChevronDown } from "lucide-react"

interface LessonDetailsProps {
  lesson?: {
    title?: string
    learningObjectives?: string[]
    keyPoints?: string[]
    maxQuestions?: number
    minMasteryToPass?: number
  }
}

export function LessonDetails({ lesson }: LessonDetailsProps) {
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
      {/* Lesson Header Card with enhanced design system */}
      <HoverLift lift="subtle">
        <Card className="border-2 hover:border-primary/20 transition-all duration-200">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="ds-text-heading-3 text-foreground leading-tight">
                  {lesson.title}
                </CardTitle>
                <p className="ds-text-body-sm text-muted-foreground mt-2 leading-relaxed">
                  Aprende a identificar peligros, evaluar riesgos y establecer controles efectivos
                </p>
              </div>

              {/* Progress Ring */}
              <div className="flex-shrink-0">
                <ProgressRing
                  progress={progressPercentage}
                  size="md"
                  variant="progress"
                  showPercentage={true}
                  label="Progreso"
                />
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 mt-3">
              <StatusBadge
                status={progressPercentage > 0 ? "in-progress" : "not-started"}
                variant="glass"
                size="sm"
              />
              <span className="ds-text-caption text-muted-foreground">
                Lección preparada
              </span>
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

      {/* Key Points Section */}
      <HoverLift lift="subtle">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-accent/50 rounded-lg border transition-all duration-200 group">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="ds-text-body-md font-medium">Puntos clave</span>
            </div>
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            {lesson.keyPoints ? (
              <ul className="ds-space-y-spacing-sm mt-3">
                {lesson.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="ds-text-body-sm text-muted-foreground leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <LoadingState
                  type="skeleton"
                  variant="gentle"
                  message="Cargando puntos clave..."
                  className="h-20"
                />
              </div>
            )}
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
