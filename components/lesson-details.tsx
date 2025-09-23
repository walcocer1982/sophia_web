import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown } from "lucide-react"

interface LessonDetailsProps {
  lesson?: {
    meta: {
      lesson_name: string
    }
    learningObjectives?: string[]
    keyPoints?: string[]
    moments?: Array<{ id: number; title: string; completed: boolean }>
  }
}

export function LessonDetails({ lesson }: LessonDetailsProps) {
  if (!lesson) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
        </Card>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    )
  }

  const completedMoments = lesson.moments?.filter((m) => m.completed).length || 0
  const totalMoments = lesson.moments?.length || 7
  const progressPercentage = Math.round((completedMoments / totalMoments) * 100)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clase 01: {lesson.meta.lesson_name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Aprende a identificar peligros, evaluar riesgos y establecer controles efectivos
          </p>
        </CardHeader>
      </Card>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-accent rounded-md">
          <span>Objetivos de la clase</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3">
          {lesson.learningObjectives ? (
            <ul className="text-sm text-muted-foreground space-y-2">
              {lesson.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-accent rounded-md">
          <span>Puntos clave</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3">
          {lesson.keyPoints ? (
            <ul className="text-sm text-muted-foreground space-y-2">
              {lesson.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Momento {completedMoments}/{totalMoments}
          </span>
          <span className="text-muted-foreground">({progressPercentage}%)</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  )
}
