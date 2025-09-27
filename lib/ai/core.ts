/**
 * Core AI Logic - Lógica pura del dominio
 * Sin dependencias externas, solo transformación de datos
 */

import {
  safeValidateAIResponse,
  type LessonAIResponseT
} from './schemas';

// ========== SECTION 1: TYPES ==========

/**
 * Input para componer un prompt
 */
export interface PromptSlots {
  // Facts del momento/lección
  lessonTitle: string;
  momentTitle: string;
  momentGoal: string;
  targetInfo?: {
    id: number;
    title: string;
    minMastery: number;
    currentMastery: number;
  };

  // Estado del estudiante
  aggregateMastery: number;
  consecutiveCorrect: number;
  attemptsInCurrent: number;

  // Contexto de la conversación
  sessionSummary?: string;
  recentTurns?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;

  // Turno actual
  questionShown: string;
  studentAnswer: string;
}

/**
 * Resultado de un turno procesado
 */
export interface TurnResult {
  aiResponse: LessonAIResponseT;
  newSummary: string;
  promptUsed: string;
  tokensEstimate: number;
}

// ========== SECTION 2: PURE LOGIC ==========

/**
 * Estima tokens de un texto (aproximado)
 */
function estimateTokens(text: string): number {
  // Regla aproximada: 1 token ≈ 4 caracteres en inglés, 2-3 en español
  return Math.ceil(text.length / 3);
}

/**
 * Trunca texto a un máximo de tokens
 */
function truncateToTokens(text: string, maxTokens: number): string {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  // Truncar proporcionalmente
  const ratio = maxTokens / estimated;
  const targetLength = Math.floor(text.length * ratio * 0.9); // 0.9 para margen
  return text.substring(0, targetLength) + '...';
}

/**
 * Compone un prompt estructurado por slots con límites de tokens
 */
export function composePrompt(slots: PromptSlots): string {
  // SLOT 1: ROL/TAREA (≤100 tokens)
  const roleSection = truncateToTokens(`
## CONTEXTO DE LA LECCIÓN
Lección: ${slots.lessonTitle}
Momento: ${slots.momentTitle}
Objetivo: ${slots.momentGoal}
${slots.targetInfo ? `Target: ${slots.targetInfo.title} (${(slots.targetInfo.currentMastery * 100).toFixed(0)}%/${(slots.targetInfo.minMastery * 100).toFixed(0)}%)` : ''}
`, 100);

  // SLOT 2: PERFIL/ESTADO (≤150 tokens)
  const profileSection = truncateToTokens(`
## ESTADO DEL ESTUDIANTE
Mastery global: ${(slots.aggregateMastery * 100).toFixed(0)}%
Correctas consecutivas: ${slots.consecutiveCorrect}
Intentos en momento actual: ${slots.attemptsInCurrent}
${slots.targetInfo ? `Progreso en target: ${((slots.targetInfo.currentMastery / slots.targetInfo.minMastery) * 100).toFixed(0)}%` : ''}
`, 150);

  // SLOT 3: RESUMEN VIVO (≤250 tokens)
  const summarySection = slots.sessionSummary
    ? truncateToTokens(`
## RESUMEN DE LA SESIÓN
${slots.sessionSummary}
`, 250)
    : '';

  // SLOT 4: ÚLTIMOS K TURNOS (≤350 tokens)
  let recentSection = '';
  if (slots.recentTurns && slots.recentTurns.length > 0) {
    const turns = slots.recentTurns
      .slice(-3) // Últimos 3 turnos máximo
      .map(t => `${t.role === 'user' ? 'Estudiante' : 'Sophia'}: ${truncateToTokens(t.content, 100)}`)
      .join('\n');

    recentSection = truncateToTokens(`
## CONVERSACIÓN RECIENTE
${turns}
`, 350);
  }

  // SLOT 5: TURNO ACTUAL (sin límite estricto pero conciso)
  const currentTurn = `
## TURNO ACTUAL
Pregunta mostrada: ${slots.questionShown}
Respuesta del estudiante: ${slots.studentAnswer}

Por favor evalúa esta respuesta y proporciona feedback pedagógico apropiado.
`;

  // Ensamblar prompt completo
  const fullPrompt = [
    roleSection,
    profileSection,
    summarySection,
    recentSection,
    currentTurn
  ].filter(Boolean).join('\n');

  return fullPrompt.trim();
}

/**
 * Valida la respuesta JSON de la IA
 */
export function validate(jsonResponse: unknown): LessonAIResponseT | null {
  const result = safeValidateAIResponse(jsonResponse);
  return result.success ? result.data : null;
}

/**
 * Destila un resumen para mantenerlo bajo 250 tokens
 * Preserva información crítica y descarta detalles antiguos
 */
export function distillSummary(
  prevSummary: string | undefined,
  lastTurn: { question: string; answer: string; evaluation: string }
): string {
  // Si no hay resumen previo, crear uno inicial
  if (!prevSummary) {
    return truncateToTokens(
      `Sesión iniciada. Última interacción: ${lastTurn.question.substring(0, 50)}... → Estudiante: ${lastTurn.answer.substring(0, 50)}... → Evaluación: ${lastTurn.evaluation}`,
      250
    );
  }

  // Estrategia de destilación:
  // 1. Mantener primera línea (contexto inicial)
  // 2. Comprimir turnos antiguos
  // 3. Agregar último turno con más detalle

  const lines = prevSummary.split('\n').filter(Boolean);
  const firstLine = lines[0] || 'Sesión en progreso.';

  // Comprimir historia (tomar solo lo esencial)
  const historyCompressed = lines
    .slice(1, -1) // Quitar primera y última
    .map(line => {
      // Extraer solo palabras clave
      if (line.includes('✓')) return 'Progreso previo registrado.';
      if (line.includes('error') || line.includes('incorrecto')) return 'Errores previos detectados.';
      if (line.includes('mastery')) {
        const match = line.match(/(\d+)%/);
        return match ? `Mastery histórico: ${match[1]}%` : '';
      }
      return '';
    })
    .filter(Boolean)
    .slice(-2) // Mantener solo 2 líneas de historia
    .join(' ');

  // Agregar turno actual
  const currentTurnSummary = `Último: "${lastTurn.question.substring(0, 40)}..." → "${lastTurn.answer.substring(0, 40)}..." → ${lastTurn.evaluation}`;

  // Ensamblar nuevo resumen
  const newSummary = [
    firstLine,
    historyCompressed,
    currentTurnSummary
  ].filter(Boolean).join('\n');

  return truncateToTokens(newSummary, 250);
}

/**
 * Calcula el mastery delta corregido basado en reglas pedagógicas
 */
export function calculateMasteryDelta(
  currentMastery: number,
  isCorrect: boolean,
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD',
  consecutiveCorrect?: number
): number {
  let delta = 0;

  if (isCorrect) {
    // Incremento base por respuesta correcta
    const baseDelta = difficulty === 'HARD' ? 0.15 :
                     difficulty === 'MEDIUM' ? 0.10 :
                     0.08;

    // Bonus por racha
    const streakBonus = Math.min(consecutiveCorrect || 0, 5) * 0.01;

    // Reducir incremento si ya tiene alto mastery
    const highMasteryPenalty = currentMastery > 0.8 ? 0.5 : 1.0;

    delta = baseDelta * highMasteryPenalty + streakBonus;
  } else {
    // Decremento por respuesta incorrecta
    const basePenalty = difficulty === 'EASY' ? -0.10 :
                       difficulty === 'MEDIUM' ? -0.08 :
                       -0.05;

    // Proteger contra caídas excesivas en mastery bajo
    const lowMasteryProtection = currentMastery < 0.3 ? 0.5 : 1.0;

    delta = basePenalty * lowMasteryProtection;
  }

  // Clamp final delta
  return Math.max(-0.15, Math.min(0.20, delta));
}