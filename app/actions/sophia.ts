'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getLessonById } from '@/data_lessons';

// Importar desde el módulo de IA unificado
import {
  processTurn,
  type PromptSlots,
  type LessonAIResponseT
} from '@/lib/ai';

// Importar utilidades auxiliares
import { detectTurnIntent, extractClarificationTerm } from '@/lib/ai/clarification-utils';
import { analyzeStudentProfile, generatePedagogicalRecommendations, personalizeFeedback } from '@/lib/ai/pedagogical-analytics';
import { calculateGlobalMastery, clamp, validateAndCorrectMasteryDelta } from '@/lib/ai/mapping';

import type { ResponseTag, NextStep, Difficulty, Prisma } from '@prisma/client';

/**
 * Input para el server action
 */
interface ProcessSophiaTurnInput {
  lessonId: string;
  momentId: number;
  questionShown: string;
  studentAnswer: string;
}

/**
 * Resultado del server action
 */
interface ProcessSophiaTurnResult {
  ok: boolean;
  data?: {
    aiResponse: LessonAIResponseT;
    sessionId: string;
    responseId: string;
    momentProgressId?: string;
  };
  error?: string;
}

/**
 * Server Action principal para procesar un turno con SOPHIA
 * Ahora es un orquestador delgado que delega al módulo de IA
 */
export async function processSophiaTurn(
  input: ProcessSophiaTurnInput
): Promise<ProcessSophiaTurnResult> {
  try {
    // ========== 1. VALIDACIÓN Y CARGA DE DATOS ==========

    const userSession = await auth();
    if (!userSession?.user?.id) {
      return { ok: false, error: 'Usuario no autenticado. Por favor inicia sesión.' };
    }

    const userId = userSession.user.id;

    // Cargar lección
    const lesson = getLessonById(parseInt(input.lessonId));
    if (!lesson) {
      return { ok: false, error: 'Lección no encontrada' };
    }

    // Obtener sesión activa
    const lessonSession = await prisma.lessonSession.findFirst({
      where: {
        userId,
        lessonId: input.lessonId,
        isCompleted: false
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!lessonSession) {
      return { ok: false, error: 'No hay sesión activa. Por favor inicia la lección primero.' };
    }

    const actualMomentId = lessonSession.currentMomentId;
    const currentMoment = lesson.moments?.find(m => m.id === actualMomentId);
    const currentTarget = lesson.targets?.find(t => t.id === currentMoment?.primaryTargetId);

    // Obtener mastery por target
    const targetMasteries = (lessonSession.targetMastery as Record<number, number>) || {};
    const currentTargetMastery = currentTarget ? (targetMasteries[currentTarget.id] || 0.5) : 0.5;

    // ========== 2. PREPARAR SLOTS PARA EL MÓDULO DE IA ==========

    const promptSlots: PromptSlots = {
      lessonTitle: lesson.title,
      momentTitle: currentMoment?.title || 'Momento no encontrado',
      momentGoal: currentMoment?.goal || '',
      targetInfo: currentTarget ? {
        id: currentTarget.id,
        title: currentTarget.title,
        minMastery: currentTarget.minMastery,
        currentMastery: currentTargetMastery
      } : undefined,
      aggregateMastery: lessonSession.aggregateMastery,
      consecutiveCorrect: lessonSession.consecutiveCorrect,
      attemptsInCurrent: lessonSession.attemptsInCurrent,
      sessionSummary: lessonSession.sessionSummary || undefined,
      questionShown: input.questionShown,
      studentAnswer: input.studentAnswer,
      // TODO: Agregar recentTurns cuando tengamos tiempo
    };

    // ========== 3. LLAMAR AL MÓDULO DE IA ==========

    const turnResult = await processTurn(
      promptSlots,
      lessonSession.sessionSummary || undefined
    );

    const aiResponse = turnResult.aiResponse;

    // ========== 4. POST-PROCESAMIENTO: FALLBACK DE CLARIFICATION ==========

    const detectedIntent = detectTurnIntent(input.studentAnswer);

    if (detectedIntent === 'CLARIFY' && aiResponse.turnIntent !== 'CLARIFY') {
      // Forzar valores apropiados para aclaración
      aiResponse.turnIntent = 'CLARIFY';
      aiResponse.progress.masteryDelta = 0;
      aiResponse.progress.nextStep = 'RETRY';

      // Asegurar tags apropiados
      if (!aiResponse.progress.tags.includes('NEEDS_HELP')) {
        aiResponse.progress.tags = ['NEEDS_HELP'];
      }

      // Agregar señal de MODE:CLARIFY
      if (aiResponse.analytics && !aiResponse.analytics.reasoningSignals?.includes('MODE:CLARIFY')) {
        if (!aiResponse.analytics.reasoningSignals) {
          aiResponse.analytics.reasoningSignals = [];
        }
        aiResponse.analytics.reasoningSignals.push('MODE:CLARIFY');
      }

      const term = extractClarificationTerm(input.studentAnswer);
      if (term) {
      }
    }

    // ========== 5. PERSONALIZACIÓN DE FEEDBACK ==========

    let finalMessage = aiResponse.chat.message;

    // Obtener historial para personalización
    const studentHistory = await prisma.studentResponse.findMany({
      where: { sessionId: lessonSession.id },
      orderBy: { answeredAt: 'asc' }
    });

    if (studentHistory.length >= 3) {
      const historyData = studentHistory.map(sr => ({
        tags: [],
        isCorrect: sr.isCorrect,
        momentId: sr.momentId,
        masteryDelta: 0
      }));

      const studentProfile = analyzeStudentProfile(historyData);
      const currentPerformance = aiResponse.progress.tags.includes('CORRECT') ? 'correct' :
                                 aiResponse.progress.tags.includes('PARTIAL') ? 'partial' : 'incorrect';

      const recommendations = generatePedagogicalRecommendations(
        studentProfile,
        actualMomentId,
        currentPerformance
      );

      finalMessage = personalizeFeedback(
        aiResponse.chat.message,
        studentProfile,
        recommendations
      );
    }

    // Guard de consigna para CLARIFY
    const lastQuestionShown = lessonSession.lastQuestionShown || input.questionShown;
    if (aiResponse.turnIntent === 'CLARIFY') {
      const messageLines = finalMessage.split('\n');
      const lastLine = messageLines[messageLines.length - 1];

      if (!lastLine.includes(lastQuestionShown.substring(0, 30))) {
        messageLines[messageLines.length - 1] = lastQuestionShown;
        finalMessage = messageLines.join('\n');
      }
    }

    // ========== 6. PERSISTENCIA TRANSACCIONAL ==========

    const result = await prisma.$transaction(async (tx) => {
      // Determinar valores de evaluación
      const isCorrect = aiResponse.progress.tags.includes('CORRECT');
      const tags = aiResponse.progress.tags;
      const isPartial = tags.includes('PARTIAL');

      // 6.1 Crear mensaje del usuario
      const lastMessage = await tx.chatMessage.findFirst({
        where: { sessionId: lessonSession.id },
        orderBy: { sequence: 'desc' }
      });

      const userMessage = await tx.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'user',
          content: input.studentAnswer,
          momentId: actualMomentId,
          sequence: (lastMessage?.sequence || 0) + 1
        }
      });

      // 6.2 Crear respuesta del estudiante
      const studentResponse = await tx.studentResponse.create({
        data: {
          sessionId: lessonSession.id,
          messageId: userMessage.id,
          momentId: actualMomentId,
          targetId: currentTarget?.id,
          question: input.questionShown,
          studentAnswer: input.studentAnswer,
          isEvaluated: true,
          isCorrect,
          score: isCorrect ? 1.0 : isPartial ? 0.5 : 0.0,
          feedback: finalMessage,
          hintsGiven: aiResponse.chat.hints || [],
          attempt: lessonSession.attemptsInCurrent + 1
        }
      });

      // 6.3 Crear AIOutcome
      const aiOutcome = await tx.aIOutcome.create({
        data: {
          sessionId: lessonSession.id,
          responseId: studentResponse.id,
          momentId: actualMomentId,
          targetId: currentTarget?.id,
          raw: turnResult.aiResponse as Prisma.InputJsonValue,
          aiMessage: finalMessage,
          aiHints: aiResponse.chat.hints || [],
          masteryDelta: aiResponse.progress.masteryDelta,
          nextStep: aiResponse.progress.nextStep as NextStep,
          tags: aiResponse.progress.tags as ResponseTag[],
          difficulty: aiResponse.analytics?.difficulty as Difficulty || null,
          reasoningSignals: aiResponse.analytics?.reasoningSignals || []
        }
      });

      // 6.4 Crear mensaje del asistente
      await tx.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'assistant',
          content: finalMessage,
          momentId: actualMomentId,
          sequence: userMessage.sequence + 1
        }
      });

      // 6.5 Actualizar sesión con router de intención
      let updatedSession;

      if (aiResponse.turnIntent === 'CLARIFY') {
        // RAMA CLARIFY: no cambiar momento ni mastery
        updatedSession = await tx.lessonSession.update({
          where: { id: lessonSession.id },
          data: {
            clarifyTurns: { increment: 1 },
            lastQuestionShown: input.questionShown,
            sessionSummary: turnResult.newSummary,
            lastAccessedAt: new Date()
          }
        });
      } else {
        // RAMA ANSWER: actualizar normalmente
        const masteryDeltaResult = validateAndCorrectMasteryDelta(
          currentTargetMastery,
          tags as ResponseTag[],
          aiResponse.progress.masteryDelta || 0
        );
        const masteryDelta = masteryDeltaResult.correctedDelta;

        const newAggregateMastery = clamp(lessonSession.aggregateMastery + masteryDelta, 0, 1);
        const newTargetMastery = currentTarget ?
          clamp(currentTargetMastery + masteryDelta, 0, 1) :
          currentTargetMastery;

        // Actualizar mapa de mastery por target
        if (currentTarget) {
          targetMasteries[currentTarget.id] = newTargetMastery;
        }

        const newConsecutive = isCorrect ? lessonSession.consecutiveCorrect + 1 : 0;
        const nextStep = aiResponse.progress.nextStep as NextStep;

        // Determinar próximo momento
        let nextMomentId = actualMomentId;
        let isCompleted = false;
        const completedTargets = [...(lessonSession.completedTargets || [])];

        // Marcar target como completado si alcanza minMastery
        if (currentTarget && newTargetMastery >= currentTarget.minMastery) {
          if (!completedTargets.includes(currentTarget.id)) {
            completedTargets.push(currentTarget.id);
          }
        }

        if (nextStep === 'ADVANCE' && actualMomentId < lesson.moments.length - 1) {
          nextMomentId = actualMomentId + 1;
        } else if (nextStep === 'COMPLETE' || actualMomentId >= lesson.moments.length - 1) {
          isCompleted = true;
        }

        updatedSession = await tx.lessonSession.update({
          where: { id: lessonSession.id },
          data: {
            currentMomentId: nextMomentId,
            currentTargetId: lesson.moments?.find(m => m.id === nextMomentId)?.primaryTargetId,
            completedMoments: lessonSession.completedMoments.includes(actualMomentId) ?
              lessonSession.completedMoments :
              [...lessonSession.completedMoments, actualMomentId],
            completedTargets,
            attemptsInCurrent: nextMomentId !== actualMomentId ? 0 : lessonSession.attemptsInCurrent + 1,
            isCompleted,
            aggregateMastery: newAggregateMastery,
            targetMastery: targetMasteries as Prisma.InputJsonValue,
            masteryGlobal: calculateGlobalMastery(targetMasteries),
            lastMasteryDelta: masteryDelta,
            consecutiveCorrect: newConsecutive,
            lastTags: tags as ResponseTag[],
            lastDifficulty: aiResponse.analytics?.difficulty as Difficulty || null,
            nextStepHint: aiResponse.chat.hints?.[0] || null,
            sessionSummary: turnResult.newSummary,
            lastQuestionShown: input.questionShown,
            totalAttempts: { increment: 1 },
            correctAnswers: isCorrect ? { increment: 1 } : undefined,
            lastAccessedAt: new Date()
          }
        });
      }

      return {
        studentResponse,
        aiOutcome,
        session: updatedSession
      };
    });

    // ========== 7. RETORNAR RESULTADO ==========

    return {
      ok: true,
      data: {
        aiResponse,
        sessionId: lessonSession.id,
        responseId: result.studentResponse.id
      }
    };

  } catch (error) {
    console.error('[processSophiaTurn] Error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error al procesar turno con SOPHIA'
    };
  }
}

/**
 * Server Action para inicializar una sesión de lección
 */
export async function initializeLessonSession(lessonId: string) {
  const userSession = await auth();

  if (!userSession?.user?.id) {
    return { ok: false, error: 'Usuario no autenticado' };
  }

  const userId = userSession.user.id;
  const lessonIdNum = parseInt(lessonId, 10);
  const lesson = getLessonById(lessonIdNum);

  if (!lesson) {
    return { ok: false, error: 'Lección no encontrada' };
  }

  try {
    // Buscar sesión existente no completada
    let session = await prisma.lessonSession.findFirst({
      where: {
        userId,
        lessonId,
        isCompleted: false
      },
      orderBy: { startedAt: 'desc' }
    });

    // Si no existe, crear nueva
    if (!session) {
      const initialTargetMastery: Record<number, number> = {};
      lesson.targets?.forEach(target => {
        initialTargetMastery[target.id] = 0.3;
      });

      const firstTarget = lesson.targets?.[0];

      session = await prisma.lessonSession.create({
        data: {
          userId,
          lessonId,
          currentMomentId: 0,
          completedMoments: [],
          sessionSummary: 'Primera interacción con la lección. Comenzando evaluación inicial.',
          aggregateMastery: 0.3,
          currentTargetId: firstTarget?.id,
          targetMastery: initialTargetMastery as Prisma.InputJsonValue,
          masteryGlobal: 0.3
        }
      });
    }

    return { ok: true, sessionId: session.id };
  } catch (error) {
    console.error('[initializeLessonSession] Error:', error);
    return { ok: false, error: 'Error al inicializar sesión' };
  }
}

/**
 * Inicializa sesión con SOPHIA y genera mensaje de bienvenida
 * Esta función crea la sesión Y genera el primer mensaje con IA
 */
export async function initSophiaSession(lessonId: string): Promise<ProcessSophiaTurnResult> {
  try {
    // Primero crear/obtener la sesión
    const sessionResult = await initializeLessonSession(lessonId);

    if (!sessionResult.ok || !sessionResult.sessionId) {
      return {
        ok: false,
        error: sessionResult.error || 'No se pudo crear la sesión'
      };
    }

    // Obtener información de la lección
    const lesson = getLessonById(parseInt(lessonId));
    if (!lesson) {
      return { ok: false, error: 'Lección no encontrada' };
    }

    // Obtener la sesión creada
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionResult.sessionId }
    });

    if (!session) {
      return { ok: false, error: 'Sesión no encontrada después de crearla' };
    }

    // Preparar contexto inicial para SOPHIA
    const firstMoment = lesson.moments?.[0];
    const firstTarget = lesson.targets?.find(t => t.id === firstMoment?.primaryTargetId);

    const promptSlots: PromptSlots = {
      lessonTitle: lesson.title,
      momentTitle: firstMoment?.title || 'Introducción',
      momentGoal: firstMoment?.goal || 'Comenzar la lección',
      targetInfo: firstTarget ? {
        id: firstTarget.id,
        title: firstTarget.title,
        minMastery: firstTarget.minMastery,
        currentMastery: 0.3
      } : undefined,
      aggregateMastery: 0.3,
      consecutiveCorrect: 0,
      attemptsInCurrent: 0,
      sessionSummary: `Nueva sesión iniciada para la lección "${lesson.title}". Estudiante listo para comenzar.`,
      questionShown: '',
      studentAnswer: '[INICIO DE SESIÓN]' // Indicador especial para SOPHIA
    };

    // Llamar al módulo de IA para generar bienvenida
    const turnResult = await processTurn(promptSlots);
    const aiResponse = turnResult.aiResponse;

    // Crear mensaje de bienvenida en la DB
    const welcomeMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: aiResponse.chat.message,
        momentId: 0,
        sequence: 1
      }
    });

    // Actualizar sesión con el resumen inicial
    await prisma.lessonSession.update({
      where: { id: session.id },
      data: {
        sessionSummary: turnResult.newSummary,
        lastQuestionShown: aiResponse.chat.message // Guardar el mensaje inicial como pregunta mostrada
      }
    });

    return {
      ok: true,
      data: {
        aiResponse,
        sessionId: session.id,
        responseId: welcomeMessage.id
      }
    };
  } catch (error) {
    console.error('[initSophiaSession] Error:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Error al iniciar sesión con SOPHIA'
    };
  }
}

/**
 * Obtener mensajes de una sesión (para UI)
 */
export async function getSessionMessages(sessionId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { sequence: 'asc' }
  });

  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    momentId: msg.momentId,
    sequence: msg.sequence,
    createdAt: msg.createdAt
  }));
}

/**
 * Obtener estado actual de la sesión
 */
export async function getSessionState(sessionId: string) {
  const session = await prisma.lessonSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) return null;

  return {
    currentMomentId: session.currentMomentId,
    completedMoments: session.completedMoments,
    aggregateMastery: session.aggregateMastery,
    consecutiveCorrect: session.consecutiveCorrect,
    isCompleted: session.isCompleted,
    totalAttempts: session.totalAttempts,
    correctAnswers: session.correctAnswers
  };
}