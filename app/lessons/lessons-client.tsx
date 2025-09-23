"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface Lesson {
  id: string
  title: string
  description: string
  progress: number
  duration: string
  status: "completed" | "in-progress" | "not-started"
}

export function LessonsClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [lessons, setLessons] = useState<Lesson[]>([])

  useEffect(() => {
    setTimeout(() => {
      setLessons([
        {
          id: "SSO001_lesson_01",
          title: "Seguridad y Salud Ocupacional - Introducción",
          description: "Conceptos básicos de seguridad en el trabajo y identificación de peligros",
          progress: 61,
          duration: "45 min",
          status: "in-progress",
        },
        {
          id: "SSO001_lesson_02",
          title: "Equipos de Protección Personal",
          description: "Tipos de EPP y su uso correcto en diferentes situaciones laborales",
          progress: 0,
          duration: "30 min",
          status: "not-started",
        },
        {
          id: "SSO001_lesson_03",
          title: "Prevención de Riesgos Eléctricos",
          description: "Identificación y prevención de peligros eléctricos en el lugar de trabajo",
          progress: 0,
          duration: "40 min",
          status: "not-started",
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "in-progress":
        return "text-blue-600"
      default:
        return "text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "in-progress":
        return "En progreso"
      default:
        return "No iniciado"
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Lecciones</h1>
          <p className="text-gray-600">Continúa tu aprendizaje desde donde lo dejaste</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-2 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription className="mt-2">{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lesson.progress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{lesson.progress}%</span>
                      </div>
                      <Progress value={lesson.progress} />
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <span className={getStatusColor(lesson.status)}>
                      {getStatusText(lesson.status)}
                    </span>
                    <span className="text-gray-500">⏱ {lesson.duration}</span>
                  </div>

                  <Link href={`/lessons/${lesson.id}`} className="block">
                    <Button className="w-full">
                      {lesson.status === "not-started" ? "Iniciar" : "Continuar"} Lección
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}