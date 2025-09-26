import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import LessonLayoutWrapper from "./lesson-layout-wrapper"
import { PageTransition } from "@/components/ui/micro-interactions"
import { getLessonById } from "@/data_lessons"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"

interface LessonPageProps {
  params: Promise<{
    lessonId: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const session = await auth()
  const { lessonId } = await params
  const lesson = getLessonById(parseInt(lessonId))

  // Verificar autenticación
  if (!session?.user?.id) {
    redirect('/login')
  }

  if (!lesson) {
    notFound()
  }

  // Obtener o crear sesión de lección para el usuario
  const lessonSession = await prisma.lessonSession.findFirst({
    where: {
      userId: session.user.id,
      lessonId: lessonId,
      isCompleted: false
    },
    orderBy: { startedAt: 'desc' }
  })

  // Si hay sesión, obtener el estado actual
  const sessionState = lessonSession ? {
    currentMomentId: lessonSession.currentMomentId,
    completedMoments: lessonSession.completedMoments,
    aggregateMastery: lessonSession.aggregateMastery,
    consecutiveCorrect: lessonSession.consecutiveCorrect,
    totalAttempts: lessonSession.totalAttempts,
    correctAnswers: lessonSession.correctAnswers,
    isCompleted: lessonSession.isCompleted
  } : undefined

  // Debug info para el sidebar
  const debugInfo = lessonSession && sessionState ? {
    currentMomentId: sessionState.currentMomentId,
    mastery: sessionState.aggregateMastery,
    attempts: sessionState.totalAttempts,
    sessionId: lessonSession.id,
    nextStep: lessonSession.nextStepHint || undefined,
    tags: lessonSession.lastTags || []
  } : undefined

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header session={session} />
        <div className="flex h-[calc(100vh-80px)] relative">
          <LessonLayoutWrapper
            lesson={lesson}
            lessonId={lessonId}
            initialSessionId={lessonSession?.id}
            initialSessionState={sessionState}
            userSession={session}
            debugInfo={debugInfo}
          />
        </div>
      </div>
    </PageTransition>
  )
}
