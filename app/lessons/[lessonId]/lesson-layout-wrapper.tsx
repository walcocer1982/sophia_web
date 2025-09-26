"use client"

import { useState } from "react"
import { LessonDetails } from "@/components/lesson-details"
import LessonChat from "./lesson-chat"
import { HoverLift } from "@/components/ui/micro-interactions"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LessonStructure } from "@/types/lesson-types"
import type { Session } from "next-auth"

interface LessonLayoutWrapperProps {
  lesson: LessonStructure
  lessonId: string
  initialSessionId?: string
  initialSessionState?: {
    currentMomentId: number;
    completedMoments: number[];
    aggregateMastery: number;
    consecutiveCorrect: number;
    totalAttempts: number;
    correctAnswers: number;
    isCompleted: boolean;
  }
  userSession?: Session | null
  debugInfo?: {
    currentMomentId?: number;
    lastResponse?: string;
    mastery?: number;
    tags?: string[];
    nextStep?: string;
    attempts?: number;
    sessionId?: string;
  }
}

export default function LessonLayoutWrapper({
  lesson,
  lessonId,
  initialSessionId,
  initialSessionState,
  userSession,
  debugInfo
}: LessonLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      {/* Sidebar para desktop y mobile */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-80
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <HoverLift className="h-full border-r bg-muted">
          <LessonDetails lesson={lesson} debugInfo={debugInfo} />
        </HoverLift>
      </div>

      {/* Overlay para móvil cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal del chat */}
      <div className="flex-1 overflow-y-auto p-6">
        <LessonChat
          lesson={lesson}
          lessonId={lessonId}
          initialSessionId={initialSessionId}
          initialSessionState={initialSessionState}
          userSession={userSession}
        />
      </div>

      {/* Botón flotante para móvil */}
      {!sidebarOpen && (
        <Button
          variant="default"
          size="icon"
          className="fixed top-24 left-6 z-50 lg:hidden shadow-lg size-12"
          onClick={() => setSidebarOpen(true)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}