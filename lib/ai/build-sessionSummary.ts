/**
 * Construye un resumen conciso de sesion para mantener contexto entre turnos.
 * Optimizado para ~120-180 tokens con informacion pedagogicamente relevante.
 */

import type { LessonStructure, LessonMoment, LessonTarget } from '@/types/lesson-types';
import type { ResponseTag, NextStep } from '@prisma/client';

// ---------------------------------------------------------------
// TIPOS DE ENTRADA
// ---------------------------------------------------------------
export interface SessionLike {
  currentMomentId: number;
  aggregateMastery: number;          // 0..1
  attemptsInCurrent: number;
  consecutiveCorrect: number;
  lastMasteryDelta: number | null;
  lastTags: string[];
  nextStepHint: string | null;
  // Nuevos campos para targets
  currentTargetId?: number;
  targetMastery?: Record<number, number>;  // {targetId: mastery}
  completedTargets?: number[];
}

export interface StudentResponseLike {
  question: string;
  studentAnswer: string;
}

export interface AIOutcomeLike {
  progress: {
    masteryDelta: number;
    nextStep: NextStep | string;  // Permitir string para compatibilidad
    tags: (ResponseTag | string)[];  // Permitir strings para tags adicionales
  };
  analytics?: {
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    reasoningSignals?: string[];
  };
  chat?: {
    message?: string;
  };
}

// ---------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------
// const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function words(s: string): string[] {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function summarize(text: string, maxWords = 18): string {
  const ws = words(text);
  if (ws.length <= maxWords) return text.trim();
  return ws.slice(0, maxWords).join(" ").trim() + "...";
}

function pct(n: number, decimals = 0) {
  return (n * 100).toFixed(decimals) + "%";
}

// Función comentada - mantener como referencia
// function containsAny(text: string, needles: string[]): boolean {
//   const t = text.toLowerCase();
//   return needles.some((n) => t.includes(n.toLowerCase()));
// }

// Determinar nivel basado en mastery (rúbrica de 5 niveles)
function masteryToLevel(mastery: number): number {
  if (mastery < 0.2) return 1;  // Inicial
  if (mastery < 0.4) return 2;  // Básico
  if (mastery < 0.65) return 3; // Competente
  if (mastery < 0.85) return 4; // Avanzado
  return 5;  // Dominio
}

// Extraer evidencia específica de la respuesta y tags
function extractEvidence(
  studentAnswer: string,
  tags: (ResponseTag | string)[],
  target?: LessonTarget
): string {
  const evidenceItems = [];

  // Evidencia por tags
  if (tags.includes("CORRECT")) {
    evidenceItems.push("respuesta_correcta");
  } else if (tags.includes("PARTIAL")) {
    evidenceItems.push("comprensión_parcial");
  } else if (tags.includes("INCORRECT")) {
    evidenceItems.push("error_conceptual");
  }

  // Evidencia específica del target
  if (target && tags.includes("CORRECT")) {
    const criterio = target.rubric5.levels[2]?.criteria[0]; // Criterio del nivel competente
    if (criterio) {
      evidenceItems.push(summarize(criterio, 5).toLowerCase());
    }
  }

  // Evidencia de la respuesta
  if (studentAnswer.length > 50) {
    evidenceItems.push("explicación_detallada");
  }

  return evidenceItems.slice(0, 3).join(", ");
}

// ---------------------------------------------------------------
// DETECCION DE BRECHA PEDAGOGICA
// ---------------------------------------------------------------
// Función comentada - mantener como referencia para futura implementación
/*
function inferGap(params: {
  tags: (ResponseTag | string)[];
  moment: LessonMoment;
  studentAnswer: string;
  reasoningSignals?: string[];
}): string {
  const { tags, moment, studentAnswer, reasoningSignals } = params;

  // 1) Tags fuertes primero
  if (tags.includes("CONCEPTUAL")) {
    return `CONCEPTUAL - necesita precision en: ${summarize(moment.goal, 8).toLowerCase()}.`;
  }
  if (tags.includes("COMPUTATIONAL")) {
    return "OPERATIVA - procedimiento impreciso; requiere guiar pasos.";
  }
  if (tags.includes("NEEDS_HELP")) {
    return "ASISTENCIA - alta confusion; necesita guia paso a paso.";
  }

  // 2) Senales del modelo
  const signal = (reasoningSignals?.[0] || "").trim();
  if (signal) {
    return `OBSERVACION - ${summarize(signal, 10)}`;
  }

  // 3) Heuristicas por contenido
  if (!studentAnswer || words(studentAnswer).length < 4) {
    return "INCOMPLETA - respuesta muy breve; falta desarrollo.";
  }
  if (containsAny(studentAnswer, ["no se", "no estoy seguro", "no entiendo", "ni idea"])) {
    return "BARRERA - inseguridad declarada; activar hint nivel 2.";
  }

  // 4) Por tags de desempeno
  if (tags.includes("INCORRECT")) {
    return "DESVIACION - concepto erroneo; requiere correccion.";
  }
  if (tags.includes("PARTIAL")) {
    return `PARCIAL - falta completar: ${summarize(moment.goal, 6).toLowerCase()}.`;
  }

  // 5) Sin brecha
  return "PROGRESO OK - mantener ritmo actual.";
}
*/

// ---------------------------------------------------------------
// DECISION PEDAGOGICA PARA PROXIMO TURNO
// ---------------------------------------------------------------
function decidePlan(params: {
  session: SessionLike;
  ai: AIOutcomeLike;
  moment: LessonMoment;
  totalMoments: number;
}): string {
  const { session, ai, moment, totalMoments } = params;
  const tags = ai.progress.tags;
  const attempts = session.attemptsInCurrent;
  const nextStep = (typeof ai.progress.nextStep === 'string'
    ? ai.progress.nextStep.toUpperCase()
    : ai.progress.nextStep) as string;

  // Anti-bucle: despues de 3 intentos sin exito
  if (attempts >= 3 && !tags.includes("CORRECT")) {
    if (tags.includes("CONCEPTUAL") || tags.includes("NEEDS_HELP")) {
      return "Dar mini-explicacion (2-3 frases) y ejemplo concreto; luego ADVANCE.";
    }
    return "Reformular pregunta con enfoque diferente; si mejora, ADVANCE.";
  }

  // Acciones segun nextStep
  if (nextStep === "ADVANCE") {
    const nextMomentId = moment.id + 1;
    if (nextMomentId < totalMoments) {
      return `Validar logro y avanzar al momento ${nextMomentId}.`;
    }
    return "Validar logro y preparar cierre de leccion.";
  }

  if (nextStep === "COMPLETE") {
    return "Cierre: recap de 3 puntos clave + 1 desafio opcional.";
  }

  if (nextStep === "RETRY") {
    if (tags.includes("INCORRECT") || tags.includes("NEEDS_HELP")) {
      return "Aplicar hint nivel 2 + ejemplo; pedir respuesta breve.";
    }
    return "Solicitar clarificacion o correccion puntual.";
  }

  if (nextStep === "REINFORCE") {
    return "Reforzar con pregunta similar pero mas guiada.";
  }

  // Fallback
  return "Replantear con pregunta mas concreta + hint sutil.";
}

// ---------------------------------------------------------------
// ANALISIS DE PATRON DE RESPUESTAS
// ---------------------------------------------------------------
function analyzePattern(session: SessionLike): string {
  const { consecutiveCorrect, aggregateMastery, attemptsInCurrent } = session;

  if (consecutiveCorrect >= 3) {
    return "FLUJO positivo";
  }
  if (consecutiveCorrect === 0 && attemptsInCurrent >= 2) {
    return "DIFICULTAD persistente";
  }
  if (aggregateMastery > 0.7) {
    return "DOMINIO alto";
  }
  if (aggregateMastery < 0.3) {
    return "FUNDAMENTOS debiles";
  }
  return "PROGRESO variable";
}

// ---------------------------------------------------------------
// FUNCION PRINCIPAL MEJORADA CON TARGETS
// ---------------------------------------------------------------
export function buildSessionSummary(args: {
  lesson: LessonStructure;
  session: SessionLike;
  lastSR?: StudentResponseLike;
  lastAI?: AIOutcomeLike;
}): string {
  const { lesson, session, lastSR, lastAI } = args;

  // Si no hay interaccion previa, resumen inicial
  if (!lastSR || !lastAI) {
    const firstMoment = lesson.moments[0];
    const firstTarget = lesson.targets?.find(t => t.id === firstMoment.primaryTargetId);
    return `Inicio de lección "${lesson.title}". Momento 0: "${firstMoment.title}". Target: ${firstTarget?.title || 'Sin definir'}. Sin interacciones previas.`;
  }

  const moment = lesson.moments.find((m) => m.id === session.currentMomentId) || lesson.moments[0];
  const currentTarget = lesson.targets?.find(t => t.id === moment.primaryTargetId);
  const totalMoments = lesson.moments.length;

  // 1. ESTADO - Ahora con información de targets
  const targetMastery = session.targetMastery || {};
  const targetStates = lesson.targets?.map(target => {
    const mastery = targetMastery[target.id] || 0;
    const level = masteryToLevel(mastery);
    const isCompleted = session.completedTargets?.includes(target.id);

    if (mastery > 0 || target.id === currentTarget?.id) {
      return `T${target.id}:L${level}(${pct(mastery)})${isCompleted ? '✓' : ''}`;
    }
    return null;
  }).filter(Boolean).join(', ') || `T${currentTarget?.id}:L1(0%)`;

  const pattern = analyzePattern(session);
  const estado = `${targetStates}, intentos:${session.attemptsInCurrent}, ${pattern}`;

  // 2. EVIDENCIA - Acumular evidencia histórica y actual
  const evidenceItems = [];

  // Evidencia del turno actual
  if (currentTarget && lastAI) {
    const currentEvidence = extractEvidence(
      lastSR.studentAnswer,
      lastAI.progress.tags,
      currentTarget
    );
    if (currentEvidence) {
      evidenceItems.push(`T${currentTarget.id}:${currentEvidence}`);
    }
  }

  // Agregar evidencia histórica relevante (últimos 2 turnos significativos)
  if (session.lastTags && session.lastTags.length > 0) {
    const prevEvidence = session.lastTags.includes("CORRECT")
      ? "progreso_previo"
      : session.lastTags.includes("PARTIAL")
        ? "avance_parcial"
        : "necesita_refuerzo";
    evidenceItems.push(prevEvidence);
  }

  const evidencia = evidenceItems.slice(0, 3).join('; ') || "sin_evidencia_clara";

  // 3. BRECHA - Específica del target actual
  let brecha = "sin_brecha_identificada";
  if (currentTarget) {
    const currentMastery = targetMastery[currentTarget.id] || 0;
    const gap = currentTarget.minMastery - currentMastery;

    if (gap > 0) {
      const level = masteryToLevel(currentMastery);
      const targetLevel = masteryToLevel(currentTarget.minMastery);
      brecha = `T${currentTarget.id}:${currentTarget.title.substring(0, 20)}_nivel_${level}_requiere_${targetLevel} (falta_${pct(gap)})`;

      // Agregar detalle de error si existe
      if (lastAI?.progress.tags.includes("INCORRECT") || lastAI?.progress.tags.includes("CONCEPTUAL")) {
        const errorComun = currentTarget.rubric5.commonErrors[0];
        if (errorComun) {
          brecha += `; error:${summarize(errorComun, 5).toLowerCase()}`;
        }
      }
    } else {
      brecha = `T${currentTarget.id}_logrado`;
    }
  }

  // 4. PLAN - Basado en targets y progreso
  const plan = decidePlan({
    session,
    ai: lastAI,
    moment,
    totalMoments
  });

  // Si hay información del target, enriquecer el plan
  if (currentTarget && targetMastery[currentTarget.id] !== undefined) {
    const mastery = targetMastery[currentTarget.id];
    if (mastery >= currentTarget.minMastery) {
      // Target logrado, sugerir avance
      const nextMoment = lesson.moments.find(m => m.id === moment.id + 1);
      const nextTarget = nextMoment ? lesson.targets?.find(t => t.id === nextMoment.primaryTargetId) : null;
      if (nextTarget) {
        return [
          `[ESTADO] ${estado}`,
          `[EVIDENCIA] ${evidencia}`,
          `[BRECHA] T${currentTarget.id}_logrado, siguiente:T${nextTarget.id}_${nextTarget.title.substring(0, 15)}`,
          `[PLAN] Validar_logro_T${currentTarget.id}, avanzar_a_T${nextTarget.id}`
        ].join('\n');
      }
    }
  }

  // 5. ENSAMBLAJE
  const lines = [
    `[ESTADO] ${estado}`,
    `[EVIDENCIA] ${evidencia}`,
    `[BRECHA] ${brecha}`,
    `[PLAN] ${plan}`
  ];

  // Proteccion de longitud (~600 chars)
  const result = lines.join("\n");
  if (result.length <= 600) {
    return result;
  }

  // Si excede, version compacta
  return [
    `[E] ${targetStates}`,
    `[V] ${evidenceItems[0] || 'sin_evidencia'}`,
    `[B] ${brecha.substring(0, 50)}`,
    `[P] ${plan.substring(0, 50)}`
  ].join('\n');
}

/**
 * Version simplificada para contexto inicial (sin historia)
 */
export function buildInitialSessionSummary(lesson: LessonStructure): string {
  const firstMoment = lesson.moments[0];
  return `Nueva sesion: "${lesson.title}". Comenzando con momento 0: "${firstMoment.title}". Meta: ${firstMoment.goal}. Sin interacciones previas.`;
}