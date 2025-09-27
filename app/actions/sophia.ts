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
import { calculateGlobalMastery, clamp, validateAndCorrectMasteryDelta, masteryToLevel } from '@/lib/ai/mapping';
import { detectTurnIntent, extractClarificationTerm } from '@/lib/ai/clarification-utils';

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

    // 3. Obtener sesión existente
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

    // 4. Construir contexto para IA
    // Usar el momento actual de la sesión en lugar del enviado (Hito 3)
    const actualMomentId = lessonSession.currentMomentId;

    // Obtener el target activo del momento actual
    const currentMoment = lesson.moments?.find(m => m.id === actualMomentId);
    const currentTarget = lesson.targets?.find(t => t.id === currentMoment?.primaryTargetId);

    // Obtener targetMastery actual desde la sesión
    const targetMasteries = (lessonSession.targetMastery as Record<number, number>) || {};
    const currentTargetMastery = currentTarget ? (targetMasteries[currentTarget.id] || 0.5) : 0.5;

    // console.log(`[SOPHIA] Momento: ${actualMomentId}, Target: ${currentTarget?.id} - ${currentTarget?.title}, Mastery actual: ${(currentTargetMastery * 100).toFixed(0)}%`);

    const turnContext = buildTurnPayload({
      lesson,
      momentId: actualMomentId,
      sessionSummary: lessonSession.sessionSummary || undefined,
      questionShown: input.questionShown,
      studentAnswer: input.studentAnswer,
      aggregateMastery: lessonSession.aggregateMastery,
      consecutiveCorrect: lessonSession.consecutiveCorrect,
      targetMastery: targetMasteries // Pasar el mastery real por target
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

    // 6.5. Aplicar heurística de fallback para turnIntent si es necesario
    const detectedIntent = detectTurnIntent(input.studentAnswer);

    // Si nuestra heurística detecta CLARIFY pero la IA no lo marcó, forzar corrección
    if (detectedIntent === 'CLARIFY' && aiResponse.turnIntent !== 'CLARIFY') {
      // console.log('[SOPHIA] Fallback: Forzando turnIntent=CLARIFY (detectado por heurística)');

      // Forzar valores apropiados para aclaración
      aiResponse.turnIntent = 'CLARIFY';
      aiResponse.progress.masteryDelta = 0;
      aiResponse.progress.nextStep = 'RETRY';

      // Asegurar tags apropiados
      if (!aiResponse.progress.tags.includes('NEEDS_HELP') &&
          !aiResponse.progress.tags.includes('CONCEPTUAL')) {
        aiResponse.progress.tags = ['NEEDS_HELP'];
      }

      // Agregar señal de MODE:CLARIFY si no está
      if (aiResponse.analytics && !aiResponse.analytics.reasoningSignals?.includes('MODE:CLARIFY')) {
        if (!aiResponse.analytics.reasoningSignals) {
          aiResponse.analytics.reasoningSignals = [];
        }
        aiResponse.analytics.reasoningSignals.push('MODE:CLARIFY');
      }

      // Extraer término de aclaración si es posible
      const term = extractClarificationTerm(input.studentAnswer);
      if (term) {
        // console.log(`[SOPHIA] Término a aclarar detectado: "${term}"`);
      }
    }

    // Log de decisión final
    // console.log(`[SOPHIA] turnIntent final: ${aiResponse.turnIntent} (heurística: ${detectedIntent}`);

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

    // 8. Guard de consigna para CLARIFY - mantener misma pregunta
    let finalMessage = personalizedMessage;
    const lastQuestionShown = lessonSession.lastQuestionShown || input.questionShown;

    if (aiResponse.turnIntent === 'CLARIFY') {
      // Extraer la pregunta del mensaje de la IA
      const messageLines = finalMessage.split('\n');
      const lastLine = messageLines[messageLines.length - 1];

      // Si la última línea no es la pregunta original, reemplazarla
      if (!lastLine.includes(lastQuestionShown.substring(0, 30))) {
        // console.log('[SOPHIA] Guard de consigna: Forzando re-pregunta original');
        // Mantener la explicación pero cambiar la pregunta final
        messageLines[messageLines.length - 1] = lastQuestionShown;
        finalMessage = messageLines.join('\n');
      }
    }

    // 9. Persistir en transacción atómica CON ROUTER DE TURNO

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

      // ROUTER DEL TURNO - Crear StudentResponse según turnIntent
      let studentResponse = null;
      let aiOutcome = null;
      let correctedMasteryDelta = 0;

      if (aiResponse.turnIntent === 'CLARIFY') {
        // RUTA CLARIFY: NO evaluar, NO cambiar mastery, NO incrementar intentos
        // console.log('[SOPHIA] Turno CLARIFY: Saltando evaluación y preservando estado');

        // Crear StudentResponse mínimo marcado como no evaluado
        studentResponse = await tx.studentResponse.create({
          data: {
            sessionId: lessonSession.id,
            messageId: userMessage.id,
            momentId: actualMomentId,
            targetId: currentTarget?.id,
            question: input.questionShown,
            studentAnswer: input.studentAnswer,
            isEvaluated: false, // IMPORTANTE: Marcar como no evaluado
            isCorrect: false, // Valor por defecto, no se usa
            score: 0, // Sin puntuación
            feedback: finalMessage,
            hintsGiven: [],
            attempt: lessonSession.attemptsInCurrent // NO incrementar
          }
        });

        // NO crear AIOutcome para CLARIFY

      } else {
        // RUTA ANSWER/OFFTOPIC: Flujo normal de evaluación
        const isCorrect = aiResponse.progress.tags.includes('CORRECT');
        const score = isCorrect ? 0.8 + aiResponse.progress.masteryDelta : 0.3 + aiResponse.progress.masteryDelta;

        studentResponse = await tx.studentResponse.create({
          data: {
            sessionId: lessonSession.id,
            messageId: userMessage.id,
            momentId: actualMomentId,
            targetId: currentTarget?.id,
            question: input.questionShown,
            studentAnswer: input.studentAnswer,
            isEvaluated: true, // Se evalúa normalmente
            isCorrect,
            score: Math.max(0, Math.min(1, score)),
            feedback: finalMessage,
            hintsGiven: aiResponse.chat.hints || [],
            attempt: lessonSession.attemptsInCurrent + 1
          }
        });

        // Validar y corregir masteryDelta según el nivel
        const inferredLevel = masteryToLevel(currentTargetMastery);
        const validation = validateAndCorrectMasteryDelta(
          inferredLevel,
          aiResponse.progress.tags.map(tag => tag.toUpperCase() as ResponseTag),
          aiResponse.progress.masteryDelta
        );

        if (!validation.isValid) {
          // console.log(`[SOPHIA] Corrigiendo masteryDelta: ${validation.reason}`);
        }

        correctedMasteryDelta = validation.correctedDelta;

        // Crear AIOutcome solo para turnos evaluados
        aiOutcome = await tx.aIOutcome.create({
        data: {
          sessionId: lessonSession.id,
          responseId: studentResponse.id,
          momentId: actualMomentId,
          targetId: currentTarget?.id, // Agregar targetId
          raw: jsonResponse,
          aiMessage: finalMessage, // Usar mensaje final con guard
          aiHints: aiResponse.chat.hints || [],
          masteryDelta: correctedMasteryDelta, // Usar delta corregido
          nextStep: aiResponse.progress.nextStep.toUpperCase() as NextStep,
          tags: aiResponse.progress.tags.map(tag => tag.toUpperCase() as ResponseTag),
          difficulty: aiResponse.analytics?.difficulty?.toUpperCase() as Difficulty || null,
          reasoningSignals: aiResponse.analytics?.reasoningSignals || []
        }
      });
      } // Fin del else (ANSWER/OFFTOPIC)

      // Solo actualizar mastery y progreso si NO es CLARIFY
      const updatedTargetMasteries = { ...targetMasteries };
      let newGlobalMastery = lessonSession.masteryGlobal;
      const completedTargets = lessonSession.completedTargets || [];
      let newConsecutive = lessonSession.consecutiveCorrect;
      let newAttemptsInCurrent = lessonSession.attemptsInCurrent;

      if (aiResponse.turnIntent !== 'CLARIFY') {
        // Solo actualizar si NO es aclaración
        if (currentTarget) {
          const newTargetMastery = clamp(
            currentTargetMastery + correctedMasteryDelta,
            0,
            1
          );
          updatedTargetMasteries[currentTarget.id] = newTargetMastery;

          // console.log(`[SOPHIA] Target ${currentTarget.id} mastery: ${(currentTargetMastery * 100).toFixed(0)}% → ${(newTargetMastery * 100).toFixed(0)}% (Δ ${(correctedMasteryDelta * 100).toFixed(0)}%`);
        }

        // Calcular mastery global ponderado
        const targetWeights: Record<number, number> = {};
        lesson.targets?.forEach(t => {
          targetWeights[t.id] = t.weight || 1;
        });
        newGlobalMastery = calculateGlobalMastery(updatedTargetMasteries, targetWeights);

        // Determinar targets completados
        if (currentTarget && updatedTargetMasteries[currentTarget.id] >= currentTarget.minMastery) {
          if (!completedTargets.includes(currentTarget.id)) {
            completedTargets.push(currentTarget.id);
            // console.log(`[SOPHIA] ✓ Target ${currentTarget.id} completado! Alcanzó ${(currentTarget.minMastery * 100).toFixed(0)}% requerido`);
          }
        }

        const isCorrect = aiResponse.progress.tags.includes('CORRECT');
        newConsecutive = isCorrect
          ? lessonSession.consecutiveCorrect + 1
          : 0;

        // Incrementar intentos solo en turnos evaluados
        newAttemptsInCurrent = lessonSession.attemptsInCurrent + 1;
      } // Fin del if (turnIntent !== 'CLARIFY')

      // Construir nuevo session summary con targetMastery real
      const updatedSummary = buildSessionSummary({
        lesson,
        session: {
          currentMomentId: actualMomentId,
          aggregateMastery: newGlobalMastery,
          attemptsInCurrent: newAttemptsInCurrent,
          consecutiveCorrect: newConsecutive,
          lastMasteryDelta: correctedMasteryDelta,
          lastTags: aiResponse.progress.tags,
          nextStepHint: lessonSession.nextStepHint,
          // Campos reales de targets
          currentTargetId: currentTarget?.id,
          targetMastery: updatedTargetMasteries,
          completedTargets: completedTargets
        },
        lastSR: {
          question: input.questionShown,
          studentAnswer: input.studentAnswer
        },
        lastAI: {
          progress: {
            ...aiResponse.progress,
            masteryDelta: correctedMasteryDelta
          },
          analytics: {
            ...aiResponse.analytics,
            // Agregar MODE:CLARIFY si es turno de aclaración
            reasoningSignals: aiResponse.turnIntent === 'CLARIFY'
              ? [...(aiResponse.analytics?.reasoningSignals || []), 'MODE:CLARIFY']
              : aiResponse.analytics?.reasoningSignals
          },
          chat: aiResponse.chat
        }
      });

      // Debug: Ver el nuevo formato del sessionSummary
      // console.log('[SOPHIA] SessionSummary actualizado:\n', updatedSummary);

      // Lógica de transición entre momentos basada en targets
      let newCurrentMomentId = lessonSession.currentMomentId;
      let newCurrentTargetId = lessonSession.currentTargetId || currentTarget?.id;
      const newCompletedMoments = [...lessonSession.completedMoments];
      let isCompleted = lessonSession.isCompleted;

      const totalMoments = lesson.moments?.length || 1;
      const nextStep = aiResponse.progress.nextStep.toUpperCase();

      // Decidir avance basado en mastery del target
      const shouldAdvance = currentTarget &&
        updatedTargetMasteries[currentTarget.id] >= currentTarget.minMastery;

      // Aplicar reglas de transición
      if (nextStep === 'ADVANCE' || shouldAdvance) {
        // Marcar momento actual como completado si no lo está
        if (!newCompletedMoments.includes(lessonSession.currentMomentId)) {
          newCompletedMoments.push(lessonSession.currentMomentId);
        }

        // Avanzar al siguiente momento
        if (lessonSession.currentMomentId < totalMoments - 1) {
          newCurrentMomentId = lessonSession.currentMomentId + 1;
          newAttemptsInCurrent = 0; // Reset intentos

          // Actualizar target activo
          const nextMoment = lesson.moments?.find(m => m.id === newCurrentMomentId);
          newCurrentTargetId = nextMoment?.primaryTargetId;
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

      // Determinar si hubo respuesta correcta (para conteo)
      const wasCorrectAnswer = aiResponse.turnIntent !== 'CLARIFY' &&
                              aiResponse.progress.tags.includes('CORRECT');

      await tx.lessonSession.update({
        where: { id: lessonSession.id },
        data: {
          currentMomentId: newCurrentMomentId,
          currentTargetId: newCurrentTargetId,
          completedMoments: newCompletedMoments,
          completedTargets: completedTargets,
          attemptsInCurrent: newAttemptsInCurrent,
          isCompleted,
          aggregateMastery: newGlobalMastery,
          masteryGlobal: newGlobalMastery,
          targetMastery: updatedTargetMasteries,
          lastMasteryDelta: correctedMasteryDelta,
          consecutiveCorrect: newConsecutive,
          lastTags: aiResponse.progress.tags.map(tag => tag.toUpperCase() as ResponseTag),
          lastDifficulty: aiResponse.analytics?.difficulty?.toUpperCase() as Difficulty || null,
          nextStepHint: aiResponse.progress.nextStep,
          sessionSummary: updatedSummary,
          // Nuevos campos para tracking de aclaraciones
          lastQuestionShown: input.questionShown, // Guardar última pregunta
          clarifyTurns: aiResponse.turnIntent === 'CLARIFY'
            ? lessonSession.clarifyTurns + 1
            : lessonSession.clarifyTurns,
          // Solo incrementar totalAttempts si NO es CLARIFY
          totalAttempts: aiResponse.turnIntent !== 'CLARIFY'
            ? lessonSession.totalAttempts + 1
            : lessonSession.totalAttempts,
          correctAnswers: lessonSession.correctAnswers + (wasCorrectAnswer ? 1 : 0),
          lastAccessedAt: new Date()
        }
      });

      // Crear mensaje de SOPHIA
      await tx.chatMessage.create({
        data: {
          sessionId: lessonSession.id,
          role: 'assistant',
          content: finalMessage, // Usar mensaje final con guard
          momentId: actualMomentId,
          sequence: nextSequence + 1
        }
      });

      return {
        sessionId: lessonSession.id,
        responseId: studentResponse?.id || '',
        aiOutcomeId: aiOutcome?.id || ''
      };
    });


    // Actualizar el response con el mensaje final
    const enhancedResponse = {
      ...aiResponse,
      chat: {
        ...aiResponse.chat,
        message: finalMessage
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
 * Server Action para iniciar una nueva sesión con SOPHIA
 * Genera la bienvenida y primera pregunta
 */
export async function initSophiaSession(lessonId: string): Promise<ProcessSophiaTurnResult> {
  try {
    // Verificar autenticación
    const userSession = await auth();

    if (!userSession?.user?.id) {
      return { ok: false, error: 'Usuario no autenticado. Por favor inicia sesión.' };
    }

    const userId = userSession.user.id;

    // Cargar lección
    const lesson = getLessonById(parseInt(lessonId));
    if (!lesson) {
      return { ok: false, error: 'Lección no encontrada' };
    }

    // Verificar si ya existe sesión activa
    const existingSession = await prisma.lessonSession.findFirst({
      where: {
        userId,
        lessonId,
        isCompleted: false
      },
      orderBy: { startedAt: 'desc' }
    });

    if (existingSession) {
      // Ya existe sesión, usar el flujo normal
      return {
        ok: true,
        data: {
          aiResponse: {
            turnIntent: 'ANSWER' as const,
            chat: {
              message: 'Continuemos con la lección donde quedamos.',
              hints: []
            },
            progress: {
              masteryDelta: 0,
              nextStep: 'RETRY',
              tags: ['PARTIAL']
            }
          },
          sessionId: existingSession.id,
          responseId: '',
        }
      };
    }

    // Obtener el primer target de la lección
    const firstMoment = lesson.moments?.[0];
    const firstTarget = lesson.targets?.find(t => t.id === firstMoment?.primaryTargetId);

    // Crear nueva sesión con target inicial
    const sessionNumber = await getNextSessionNumber(userId, lessonId);
    const newSession = await prisma.lessonSession.create({
      data: {
        userId,
        lessonId,
        sessionNumber,
        currentMomentId: 0,
        currentTargetId: firstTarget?.id,
        completedMoments: [],
        completedTargets: [],
        targetMastery: {}, // Inicializar vacío
        aggregateMastery: 0.5,
        masteryGlobal: 0.0,
        consecutiveCorrect: 0,
        attemptsInCurrent: 0,
        sessionSummary: 'Primera interacción con la lección.',
        isCompleted: false
      }
    });

    // Construir contexto especial para inicio
    const initialSummary = `Inicio de lección "${lesson.title}". Target: ${firstTarget?.title || 'Sin definir'}. Sin interacciones previas.`;

    const turnContext = buildTurnPayload({
      lesson,
      momentId: 0,
      sessionSummary: initialSummary,
      questionShown: '', // Sin pregunta previa
      studentAnswer: '', // Sin respuesta previa
      aggregateMastery: 0.5,
      consecutiveCorrect: 0
    });

    // Llamar a OpenAI para generar bienvenida
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

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
      temperature: 0.6,
      max_tokens: 600
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { ok: false, error: 'Respuesta vacía de OpenAI' };
    }

    const jsonResponse = JSON.parse(responseContent);
    const validationResult = safeValidateAIResponse(jsonResponse);

    if (!validationResult.success) {
      return { ok: false, error: 'Respuesta de IA no válida' };
    }

    const aiResponse = validationResult.data;

    // Persistir mensaje inicial de SOPHIA
    await prisma.chatMessage.create({
      data: {
        sessionId: newSession.id,
        role: 'assistant',
        content: aiResponse.chat.message,
        momentId: 0,
        sequence: 0
      }
    });

    // Actualizar sesión con el summary inicial
    await prisma.lessonSession.update({
      where: { id: newSession.id },
      data: {
        sessionSummary: `Sesión iniciada. Sophia presentó objetivos de la lección ${lesson.title}.`,
        lastAccessedAt: new Date()
      }
    });

    return {
      ok: true,
      data: {
        aiResponse,
        sessionId: newSession.id,
        responseId: ''
      }
    };

  } catch (error) {
    console.error('[SOPHIA INIT] Error:', error);
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'Error al iniciar sesión con SOPHIA' };
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