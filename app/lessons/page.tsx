"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
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

export default function LessonsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const router = useRouter()

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated")
    if (!authStatus) {
      router.push("/login")
      return
    }

    setIsAuthenticated(true)

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
          title: "Identificación de Riesgos Laborales",
          description: "Aprende a identificar y evaluar los riesgos en tu lugar de trabajo",
          progress: 0,
          duration: "50 min",
          status: "not-started",
        },
        {
          id: "SSO001_lesson_03",
          title: "Equipos de Protección Personal",
          description: "Uso correcto y mantenimiento de EPP",
          progress: 0,
          duration: "40 min",
          status: "not-started",
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [router])

  if (!isAuthenticated) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "in-progress":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Lecciones</h1>
          <p className="text-muted-foreground">Continúa tu aprendizaje con Sophia</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            : lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <CardDescription>{lesson.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className={getStatusColor(lesson.status)}>{getStatusText(lesson.status)}</span>
                      <span className="text-muted-foreground">{lesson.duration}</span>
                    </div>

                    {lesson.progress > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progreso</span>
                          <span>{lesson.progress}%</span>
                        </div>
                        <Progress value={lesson.progress} />
                      </div>
                    )}

                    <Button asChild className="w-full">
                      <Link href={`/lessons/${lesson.id}`}>
                        {lesson.status === "not-started" ? "Comenzar" : "Continuar"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
        </div>
      </main>
    </div>
  )
}
