'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getLessonDebugInfo(lessonId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    const lessonSession = await prisma.lessonSession.findFirst({
      where: {
        userId: session.user.id,
        lessonId: lessonId,
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
    })

    if (!lessonSession) return null

    // Get the latest AIOutcome for this session
    const latestOutcome = await prisma.aIOutcome.findFirst({
      where: {
        sessionId: lessonSession.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse the raw JSON to extract specific fields we need
    let tags: string[] = []
    let nextStep: string | null = null

    if (latestOutcome?.raw && typeof latestOutcome.raw === 'object') {
      const rawData = latestOutcome.raw as Record<string, unknown>
      // Los campos están anidados en progress
      const progressData = rawData.progress as Record<string, unknown> | undefined
      tags = (progressData?.tags as string[]) || []
      nextStep = (progressData?.nextStep as string) ?? null
    }

    return {
      sessionId: lessonSession.id.substring(0, 8),
      currentMomentId: lessonSession.currentMomentId,
      currentTargetId: lessonSession.currentTargetId,
      mastery: lessonSession.aggregateMastery,
      masteryGlobal: lessonSession.masteryGlobal,
      targetMastery: lessonSession.targetMastery as Record<number, number> | null,
      completedTargets: lessonSession.completedTargets,
      lastMasteryDelta: lessonSession.lastMasteryDelta,
      tags: tags,
      nextStep: nextStep || lessonSession.nextStepHint,
      sessionSummary: lessonSession.sessionSummary || 'Sin resumen disponible',
      updatedAt: lessonSession.lastAccessedAt.toISOString()
    }
  } catch (error) {
    console.error('Error fetching debug info:', error)
    return null
  }
}