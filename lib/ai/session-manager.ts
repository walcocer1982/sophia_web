/**
 * Session Manager - Gestión de sesiones de lección
 */

import { prisma } from '@/lib/db';
import { getLessonById } from '@/data_lessons';
import type { ResponseTag, Difficulty, Prisma } from '@prisma/client';

/**
 * Obtiene o crea una sesión de lección para un usuario
 */
export async function getOrCreateLessonSession(
  userId: string,
  lessonId: string
) {
  // Buscar sesión existente
  const existingSession = await prisma.lessonSession.findFirst({
    where: {
      userId,
      lessonId,
      isCompleted: false
    },
    orderBy: { startedAt: 'desc' }
  });

  if (existingSession) {
    return existingSession;
  }

  // Crear nueva sesión
  const lessonIdNum = parseInt(lessonId, 10);
  const lesson = getLessonById(lessonIdNum);
  if (!lesson) {
    throw new Error(`Lección ${lessonId} no encontrada`);
  }

  // Inicializar mastery de targets
  const initialTargetMastery: Record<number, number> = {};
  lesson.targets?.forEach(target => {
    initialTargetMastery[target.id] = 0.3;
  });

  const firstTarget = lesson.targets?.[0];

  return await prisma.lessonSession.create({
    data: {
      userId,
      lessonId,
      currentMomentId: 0,
      completedMoments: [],
      sessionSummary: 'Primera interacción con la lección. Comenzando evaluación inicial.',
      aggregateMastery: 0.3,
      currentTargetId: firstTarget?.id,
      targetMastery: initialTargetMastery,
      masteryGlobal: 0.3
    }
  });
}

/**
 * Actualiza el estado de una sesión
 */
export async function updateSessionState(
  sessionId: string,
  updates: {
    currentMomentId?: number;
    currentTargetId?: number;
    completedMoments?: number[];
    completedTargets?: number[];
    attemptsInCurrent?: number;
    isCompleted?: boolean;
    aggregateMastery?: number;
    masteryGlobal?: number;
    targetMastery?: Prisma.InputJsonValue;
    lastMasteryDelta?: number;
    consecutiveCorrect?: number;
    lastTags?: ResponseTag[];
    lastDifficulty?: Difficulty;
    nextStepHint?: string;
    sessionSummary?: string;
    lastQuestionShown?: string;
    clarifyTurns?: number;
    totalAttempts?: number;
    correctAnswers?: number;
  }
) {
  return await prisma.lessonSession.update({
    where: { id: sessionId },
    data: {
      ...updates,
      lastAccessedAt: new Date()
    }
  });
}