"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { HoverLift, Celebration, PageTransition } from "@/components/ui/micro-interactions"
import Link from "next/link"
import { lessons as lessonsData } from "@/data_lessons"
import type { LessonStructure } from "@/types/lesson-types"

export function LessonsClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [lessons, setLessons] = useState<LessonStructure[]>([])

  useEffect(() => {
    setTimeout(() => {
      setLessons(Object.values(lessonsData))
      setIsLoading(false)
    }, 1000)
  }, [])

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Mis Lecciones</h1>
            <p className="text-gray-600">Continúa tu aprendizaje desde donde lo dejaste</p>
          </div>

        {isLoading ? (
          <LoadingState
            type="skeleton"
            variant="encouraging"
            message="Cargando tus lecciones"
            submessage="Organizando tu contenido educativo personalizado"
            className="min-h-64"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <HoverLift key={lesson.id} lift="medium">
                <Celebration
                  type="sparkle"
                  intensity="medium"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription className="mt-2">{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                  <Link href={`/lessons/${lesson.id}`} className="block">
                    <Button className="w-full" variant="default">
                      Ingresar a Lección
                    </Button>
                  </Link>
                </CardContent>
                  </Card>
                </Celebration>
              </HoverLift>
            ))}
          </div>
        )}
        </div>
      </div>
    </PageTransition>
  )
}