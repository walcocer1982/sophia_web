/**
 * Turn Processor - Procesamiento de turnos de conversación
 */

import { prisma } from '@/lib/db';
import type { ResponseTag, NextStep, Difficulty, Prisma } from '@prisma/client';

/**
 * Crea mensaje del usuario en la DB
 */
export async function createUserMessage(
  sessionId: string,
  content: string,
  momentId: number
) {
  const lastMessage = await prisma.chatMessage.findFirst({
    where: { sessionId },
    orderBy: { sequence: 'desc' }
  });

  const nextSequence = (lastMessage?.sequence || 0) + 1;

  return await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content,
      momentId,
      sequence: nextSequence
    }
  });
}

/**
 * Crea mensaje de asistente en la DB
 */
export async function createAssistantMessage(
  sessionId: string,
  content: string,
  momentId: number
) {
  const lastMessage = await prisma.chatMessage.findFirst({
    where: { sessionId },
    orderBy: { sequence: 'desc' }
  });

  const nextSequence = (lastMessage?.sequence || 0) + 1;

  return await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'assistant',
      content,
      momentId,
      sequence: nextSequence
    }
  });
}

/**
 * Guarda respuesta del estudiante
 */
export async function saveStudentResponse(
  params: {
    sessionId: string;
    messageId: string;
    momentId: number;
    targetId?: number;
    question: string;
    studentAnswer: string;
    isEvaluated: boolean;
    isCorrect: boolean;
    score: number;
    feedback: string;
    hintsGiven: string[];
    attempt: number;
  }
) {
  return await prisma.studentResponse.create({
    data: params
  });
}

/**
 * Guarda resultado de IA
 */
export async function saveAIOutcome(
  params: {
    sessionId: string;
    responseId: string;
    momentId: number;
    targetId?: number;
    raw: Prisma.InputJsonValue;
    aiMessage: string;
    aiHints: string[];
    masteryDelta: number;
    nextStep: NextStep;
    tags: ResponseTag[];
    difficulty?: Difficulty | null;
    reasoningSignals: string[];
  }
) {
  return await prisma.aIOutcome.create({
    data: params
  });
}