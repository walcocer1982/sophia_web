/**
 * Construye un resumen conciso de sesion para mantener contexto entre turnos.
 * Optimizado para ~120-180 tokens con informacion pedagogicamente relevante.
 */

import type { LessonStructure, LessonMoment } from '@/types/lesson-types';
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
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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

function containsAny(text: string, needles: string[]): boolean {
  const t = text.toLowerCase();
  return needles.some((n) => t.includes(n.toLowerCase()));
}

// ---------------------------------------------------------------
// DETECCION DE BRECHA PEDAGOGICA
// ---------------------------------------------------------------
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
// FUNCION PRINCIPAL
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
    return `Inicio de leccion "${lesson.title}". Momento 0: "${lesson.moments[0].title}". Sin interacciones previas. Objetivo: ${lesson.moments[0].goal}.`;
  }

  const moment = lesson.moments.find((m) => m.id === session.currentMomentId) || lesson.moments[0];
  const totalMoments = lesson.moments.length;

  // 1. ESTADO
  const mastery = clamp(session.aggregateMastery, 0, 1);
  const delta = lastAI.progress.masteryDelta;
  const pattern = analyzePattern(session);

  const estado = `M${moment.id}/${totalMoments} "${moment.title}". Mastery: ${pct(mastery)}(Delta${delta >= 0 ? '+' : ''}${pct(delta, 0)}). Patron: ${pattern}. Intentos: ${session.attemptsInCurrent}.`;

  // 2. EVIDENCIA
  const gist = summarize(lastSR.studentAnswer, 15);
  const tags = lastAI.progress.tags.join(",");
  const evidencia = `Ultima: "${gist}" -> [${tags}].`;

  // 3. BRECHA
  const brecha = inferGap({
    tags: lastAI.progress.tags,
    moment,
    studentAnswer: lastSR.studentAnswer,
    reasoningSignals: lastAI.analytics?.reasoningSignals,
  });

  // 4. PLAN
  const plan = decidePlan({
    session,
    ai: lastAI,
    moment,
    totalMoments
  });

  // 5. ENSAMBLAJE
  const lines = [
    `[ESTADO] ${estado}`,
    `[EVIDENCIA] ${evidencia}`,
    `[BRECHA] ${brecha}`,
    `[PLAN] ${plan}`
  ];

  // Proteccion de longitud (~150 tokens, ~600 chars)
  const result = lines.join("\n");
  if (result.length <= 600) {
    return result;
  }

  // Si excede, version compacta
  return [
    `M${moment.id}/${totalMoments}. Mastery:${pct(mastery)}. ${pattern}.`,
    `"${summarize(lastSR.studentAnswer, 10)}" -> [${tags}].`,
    brecha,
    plan
  ].join("\n");
}

/**
 * Version simplificada para contexto inicial (sin historia)
 */
export function buildInitialSessionSummary(lesson: LessonStructure): string {
  const firstMoment = lesson.moments[0];
  return `Nueva sesion: "${lesson.title}". Comenzando con momento 0: "${firstMoment.title}". Meta: ${firstMoment.goal}. Sin interacciones previas.`;
}