'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import {
  LessonAIResponseJSONSchema,
  safeValidateAIResponse,
  type LessonAIResponseT
} from '@/lib/ai/schemas';
import { buildTurnPayload } from '@/lib/ai/build-context';
import { buildSessionSummary } from '@/lib/ai/build-sessionSummary';
import { SOPHIA_SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { getLessonById } from '@/data_lessons';
import { analyzeStudentProfile, generatePedagogicalRecommendations, personalizeFeedback } from '@/lib/ai/pedagogical-analytics';
import type { ResponseTag, NextStep, Difficulty } from '@prisma/client';

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
 * Incluye llamada a OpenAI + persistencia transaccional
 */
export async function processSophiaTurn(
  input: ProcessSophiaTurnInput
): Promise<ProcessSophiaTurnResult> {
  try {
    // 1. Verificar autenticación
    const userSession = await auth();

    if (!userSession?.user?.id) {
      return { ok: false, error: 'Usuario no autenticado. Por favor inicia sesión.' };
    }

    const userId = userSession.user.id;

    // 2. Cargar lección (desde TypeScript, no DB por ahora)
    const lesson = getLessonById(parseInt(input.lessonId));
    if (!lesson) {
      return { ok: false, error: 'Lección no encontrada' };
    }

    // 3. Obtener o crear sesión
    let lessonSession = await prisma.lessonSession.findFirst({
      where: {
        userId,
        lessonId: input.lessonId,
        isCompleted: false
      },
      orderBy: { startedAt: 'desc' }
    });

    if (!lessonSession) {
      // Crear nueva sesión
      const sessionNumber = await getNextSessionNumber(userId, input.lessonId);

      lessonSession = await prisma.lessonSession.create({
        data: {
          userId,
          lessonId: input.lessonId,
          sessionNumber,
          currentMomentId: 0,
          completedMoments: [],
          aggregateMastery: 0.5,
          consecutiveCorrect: 0,
          attemptsInCurrent: 0,
          sessionSummary: 'Primera interacción con la lección.',
          isCompleted: false
        }
      });

      // Guardar la pregunta inicial de SOPHIA como primer mensaje
      await prisma.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'assistant',
          content: input.questionShown,
          momentId: 0,
          sequence: 0
        }
      });
    }

    // 4. Construir contexto para IA
    // Usar el momento actual de la sesión en lugar del enviado (Hito 3)
    const actualMomentId = lessonSession.currentMomentId;

    const turnContext = buildTurnPayload({
      lesson,
      momentId: actualMomentId,
      sessionSummary: lessonSession.sessionSummary || undefined,
      questionShown: input.questionShown,
      studentAnswer: input.studentAnswer,
      aggregateMastery: lessonSession.aggregateMastery,
      consecutiveCorrect: lessonSession.consecutiveCorrect
    });

    // 5. Llamar a OpenAI con structured output
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Ajustar temperatura basada en el estado del estudiante
    // Más determinístico para estudiantes con dificultades, más creativo para avanzados
    const temperature = lessonSession.aggregateMastery < 0.4 ? 0.5 :
                       lessonSession.aggregateMastery < 0.7 ? 0.6 : 0.7;


    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SOPHIA_SYSTEM_PROMPT },
        { role: 'user', content: turnContext }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lesson_ai_response',
          strict: true,
          schema: LessonAIResponseJSONSchema
        }
      } as Parameters<typeof openai.chat.completions.create>[0]['response_format'],
      temperature,
      max_tokens: 600 // Aumentado para permitir feedback más rico
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { ok: false, error: 'Respuesta vacía de OpenAI' };
    }


    // 6. Parsear y validar respuesta
    const jsonResponse = JSON.parse(responseContent);
    const validationResult = safeValidateAIResponse(jsonResponse);


    if (!validationResult.success) {
      return { ok: false, error: 'Respuesta de IA no válida' };
    }

    const aiResponse = validationResult.data;

    // 7. Analizar historial para personalización (si existe suficiente data)
    let personalizedMessage = aiResponse.chat.message;

    // Obtener historial de respuestas del estudiante en esta sesión
    const studentHistory = await prisma.studentResponse.findMany({
      where: { sessionId: lessonSession.id },
      orderBy: { answeredAt: 'asc' },
      include: {
        // Por ahora no incluimos aiOutcome en el include
        // TODO: Actualizar cuando tengamos relación correcta
      }
    });

    // Si hay al menos 3 respuestas previas, personalizar el feedback
    if (studentHistory.length >= 3) {
      const historyData = studentHistory.map(sr => ({
        tags: [], // TODO: obtener tags de AIOutcome cuando esté relacionado
        isCorrect: sr.isCorrect,
        momentId: sr.momentId,
        masteryDelta: 0 // TODO: obtener masteryDelta de AIOutcome
      }));

      const studentProfile = analyzeStudentProfile(historyData);
      const currentPerformance = aiResponse.progress.tags.includes('CORRECT') ? 'correct' :
                                 aiResponse.progress.tags.includes('PARTIAL') ? 'partial' : 'incorrect';

      const recommendations = generatePedagogicalRecommendations(
        studentProfile,
        actualMomentId,
        currentPerformance
      );

      // Personalizar el mensaje basado en el perfil
      personalizedMessage = personalizeFeedback(
        aiResponse.chat.message,
        studentProfile,
        recommendations
      );

    }

    // 8. Persistir en transacción atómica

    const result = await prisma.$transaction(async (tx) => {
      // Obtener siguiente sequence para mensajes
      const lastMessage = await tx.chatMessage.findFirst({
        where: { sessionId: lessonSession.id },
        orderBy: { sequence: 'desc' }
      });
      const nextSequence = (lastMessage?.sequence || 0) + 1;

      // Crear mensaje del usuario
      const userMessage = await tx.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'user',
          content: input.studentAnswer,
          momentId: actualMomentId,
          sequence: nextSequence
        }
      });

      // Crear StudentResponse
      const isCorrect = aiResponse.progress.tags.includes('CORRECT');
      const score = isCorrect ? 0.8 + aiResponse.progress.masteryDelta : 0.3 + aiResponse.progress.masteryDelta;

      const studentResponse = await tx.studentResponse.create({
        data: {
          sessionId: lessonSession.id,
          messageId: userMessage.id,
          momentId: actualMomentId,
          question: input.questionShown,
          studentAnswer: input.studentAnswer,
          isCorrect,
          score: Math.max(0, Math.min(1, score)),
          feedback: personalizedMessage, // Usar mensaje personalizado
          hintsGiven: aiResponse.chat.hints || [],
          attempt: lessonSession.attemptsInCurrent + 1
        }
      });

      // Crear AIOutcome
      const aiOutcome = await tx.aIOutcome.create({
        data: {
          sessionId: lessonSession.id,
          responseId: studentResponse.id,
          momentId: actualMomentId,
          raw: jsonResponse,
          aiMessage: personalizedMessage, // Usar mensaje personalizado
          aiHints: aiResponse.chat.hints || [],
          masteryDelta: aiResponse.progress.masteryDelta,
          nextStep: aiResponse.progress.nextStep.toUpperCase() as NextStep,
          tags: aiResponse.progress.tags.map(tag => tag.toUpperCase() as ResponseTag),
          difficulty: aiResponse.analytics?.difficulty?.toUpperCase() as Difficulty || null,
          reasoningSignals: aiResponse.analytics?.reasoningSignals || []
        }
      });

      // Actualizar agregados de la sesión
      const newMastery = Math.max(0, Math.min(1,
        lessonSession.aggregateMastery + aiResponse.progress.masteryDelta
      ));

      const newConsecutive = isCorrect
        ? lessonSession.consecutiveCorrect + 1
        : 0;

      // Construir nuevo session summary con la función mejorada
      const updatedSummary = buildSessionSummary({
        lesson,
        session: {
          currentMomentId: actualMomentId,
          aggregateMastery: newMastery,
          attemptsInCurrent: lessonSession.attemptsInCurrent + 1,
          consecutiveCorrect: newConsecutive,
          lastMasteryDelta: aiResponse.progress.masteryDelta,
          lastTags: aiResponse.progress.tags,
          nextStepHint: lessonSession.nextStepHint
        },
        lastSR: {
          question: input.questionShown,
          studentAnswer: input.studentAnswer
        },
        lastAI: {
          progress: aiResponse.progress,
          analytics: aiResponse.analytics,
          chat: aiResponse.chat
        }
      });

      // Lógica de transición entre momentos (Hito 3)
      let newCurrentMomentId = lessonSession.currentMomentId;
      const newCompletedMoments = [...lessonSession.completedMoments];
      let newAttemptsInCurrent = lessonSession.attemptsInCurrent + 1;
      let isCompleted = lessonSession.isCompleted;

      const totalMoments = lesson.moments?.length || 1;
      const nextStep = aiResponse.progress.nextStep.toUpperCase();

      // Aplicar reglas de transición
      if (nextStep === 'ADVANCE') {
        // Marcar momento actual como completado si no lo está
        if (!newCompletedMoments.includes(lessonSession.currentMomentId)) {
          newCompletedMoments.push(lessonSession.currentMomentId);
        }

        // Avanzar al siguiente momento
        if (lessonSession.currentMomentId < totalMoments - 1) {
          newCurrentMomentId = lessonSession.currentMomentId + 1;
          newAttemptsInCurrent = 0; // Reset intentos
        } else {
          // Último momento + ADVANCE = completado
          isCompleted = true;
        }
      } else if (nextStep === 'COMPLETE') {
        // Marcar lección como completada
        if (!newCompletedMoments.includes(lessonSession.currentMomentId)) {
          newCompletedMoments.push(lessonSession.currentMomentId);
        }
        isCompleted = true;
      } else if (nextStep === 'REINFORCE' || nextStep === 'RETRY') {
        // Permanecer en el momento actual
        // Si hay demasiados intentos, forzar avance
        if (newAttemptsInCurrent > 3) {
          // Forzar avance después de 3 intentos
          if (!newCompletedMoments.includes(lessonSession.currentMomentId)) {
            newCompletedMoments.push(lessonSession.currentMomentId);
          }

          if (lessonSession.currentMomentId < totalMoments - 1) {
            newCurrentMomentId = lessonSession.currentMomentId + 1;
            newAttemptsInCurrent = 0;
          } else {
            isCompleted = true;
          }
        }
      }

      await tx.lessonSession.update({
        where: { id: lessonSession.id },
        data: {
          currentMomentId: newCurrentMomentId,
          completedMoments: newCompletedMoments,
          attemptsInCurrent: newAttemptsInCurrent,
          isCompleted,
          aggregateMastery: newMastery,
          lastMasteryDelta: aiResponse.progress.masteryDelta,
          consecutiveCorrect: newConsecutive,
          lastTags: aiResponse.progress.tags.map(tag => tag.toUpperCase() as ResponseTag),
          lastDifficulty: aiResponse.analytics?.difficulty?.toUpperCase() as Difficulty || null,
          nextStepHint: aiResponse.progress.nextStep,
          sessionSummary: updatedSummary,
          totalAttempts: lessonSession.totalAttempts + 1,
          correctAnswers: lessonSession.correctAnswers + (isCorrect ? 1 : 0),
          lastAccessedAt: new Date()
        }
      });

      // Crear mensaje de SOPHIA
      await tx.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'assistant',
          content: personalizedMessage, // Usar mensaje personalizado
          momentId: actualMomentId,
          sequence: nextSequence + 1
        }
      });

      return {
        sessionId: lessonSession.id,
        responseId: studentResponse.id,
        aiOutcomeId: aiOutcome.id
      };
    });


    // Actualizar el response con el mensaje personalizado
    const enhancedResponse = {
      ...aiResponse,
      chat: {
        ...aiResponse.chat,
        message: personalizedMessage
      }
    };

    return {
      ok: true,
      data: {
        aiResponse: enhancedResponse,
        sessionId: result.sessionId,
        responseId: result.responseId
      }
    };

  } catch (error) {
    console.error('[SOPHIA] Error:', error);

    if (error instanceof Error) {
      // Manejar errores específicos de OpenAI
      if (error.message.includes('API')) {
        return { ok: false, error: 'Error al comunicarse con OpenAI. Verifica tu API key.' };
      }

      return { ok: false, error: error.message };
    }

    return { ok: false, error: 'Error desconocido al procesar turno' };
  }
}

/**
 * Helper: Obtiene el siguiente número de sesión
 */
async function getNextSessionNumber(userId: string, lessonId: string): Promise<number> {
  const lastSession = await prisma.lessonSession.findFirst({
    where: { userId, lessonId },
    orderBy: { sessionNumber: 'desc' }
  });

  return (lastSession?.sessionNumber || 0) + 1;
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