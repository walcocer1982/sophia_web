import { auth } from "@/lib/auth"
import { Header } from "@/components/header"
import { LessonDetails } from "@/components/lesson-details"
import { LessonChat } from "@/components/lesson-chat"
import { PageTransition, HoverLift } from "@/components/ui/micro-interactions"
import { getLessonById } from "@/data_lessons"
import { notFound } from "next/navigation"

interface LessonPageProps {
  params: Promise<{
    lessonId: string
  }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const session = await auth()
  const { lessonId } = await params
  const lesson = getLessonById(parseInt(lessonId))

  if (!lesson) {
    notFound()
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header session={session} />
        <div className="flex h-[calc(100vh-80px)]">
          <HoverLift className="w-80 border-r bg-muted/30 transition-all duration-200">
            <LessonDetails lesson={lesson} />
          </HoverLift>
          <div className="flex-1">
            <LessonChat lessonId={lessonId} session={session} />
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
