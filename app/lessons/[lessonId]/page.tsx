import { Header } from "@/components/header"
import { LessonDetails } from "@/components/lesson-details"
import { LessonChat } from "@/components/lesson-chat"
import getLessonById from "@/data_lessons"
import { notFound } from "next/navigation"

interface LessonPageProps {
  params: {
    lessonId: string
  }
}

export default function LessonPage({ params }: LessonPageProps) {
  const lesson = getLessonById(params.lessonId)

  if (!lesson) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-80px)]">
        <div className="w-80 border-r bg-muted/30">
          <LessonDetails lesson={lesson} />
        </div>
        <div className="flex-1">
          <LessonChat lessonId={params.lessonId} />
        </div>
      </div>
    </div>
  )
}
