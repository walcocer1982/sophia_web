/**
 * Helper para construir el contexto de cada turno
 * Optimizado para reducir tokens mientras mantiene información clave
 */

import type { LessonStructure, LessonMoment } from '@/types/lesson-types';
import { getMomentRubric } from './moment-rubrics';

/**
 * Opciones para construir el payload del turno
 */
interface TurnPayloadOptions {
  lesson: LessonStructure;
  momentId: number;
  sessionSummary?: string;
  questionShown: string;
  studentAnswer: string;
  aggregateMastery?: number;
  consecutiveCorrect?: number;
}

/**
 * Construye el contexto de la lección (meta + objectives + checkPoints)
 * Mantiene brevedad para optimizar tokens
 */
function buildLessonContext(lesson: LessonStructure): string {
  const parts = [];

  // Meta información
  parts.push('## Lección');
  parts.push(`Título: ${lesson.title}`);
  parts.push(`Descripción: ${lesson.description}`);
  parts.push(`Idioma: ${lesson.language}`);

  // Learning objectives (máximo 5, resumidos si son más)
  if (lesson.learningObjectives && lesson.learningObjectives.length > 0) {
    parts.push('\n## Objetivos de aprendizaje');
    const objectives = lesson.learningObjectives.slice(0, 5);
    objectives.forEach((obj, i) => {
      // Truncar si es muy largo
      const truncated = obj.length > 100 ? obj.substring(0, 97) + '...' : obj;
      parts.push(`${i + 1}. ${truncated}`);
    });
    if (lesson.learningObjectives.length > 5) {
      parts.push(`... y ${lesson.learningObjectives.length - 5} objetivos más`);
    }
  }

  // Check points (solo para la IA, máximo 5)
  if (lesson.checkPoints && lesson.checkPoints.length > 0) {
    parts.push('\n## Puntos clave (solo para evaluación)');
    const points = lesson.checkPoints.slice(0, 5);
    points.forEach((point, index) => {
      const truncated = point.length > 80 ? point.substring(0, 77) + '...' : point;
      parts.push(`${index + 1}. ${truncated}`);
    });
  }

  return parts.join('\n');
}

/**
 * Construye el contexto del momento actual con rúbricas pedagógicas
 */
function buildMomentContext(moment: LessonMoment, lessonId: number = 1): string {
  const parts = [];

  parts.push('## Momento actual');
  parts.push(`ID: ${moment.id}`);
  parts.push(`Título: ${moment.title}`);
  parts.push(`Meta: ${moment.goal}`);

  // Preguntas de referencia
  if (moment.referenceQuestions && moment.referenceQuestions.length > 0) {
    parts.push('\nPreguntas disponibles:');
    moment.referenceQuestions.forEach((q) => {
      const truncated = q.length > 150 ? q.substring(0, 147) + '...' : q;
      parts.push(`- ${truncated}`);
    });
  }

  // Imágenes disponibles
  if (moment.images && moment.images.length > 0) {
    parts.push('\nImágenes contextuales:');
    moment.images.forEach(img => {
      parts.push(`- [Imagen ${img.id}]: ${img.description}`);
    });
  }

  // Obtener rúbrica pedagógica detallada del momento
  const rubric = getMomentRubric(lessonId, moment.id);
  if (rubric) {
    parts.push('\n## Rúbrica de Evaluación Pedagógica');

    // Criterios de evaluación
    parts.push('\nCriterios de evaluación:');
    parts.push(`✓ Correcto si: ${rubric.criteria.correct.join('; ')}`);
    parts.push(`~ Parcial si: ${rubric.criteria.partial.join('; ')}`);
    parts.push(`✗ Incorrecto si: ${rubric.criteria.incorrect.join('; ')}`);

    // Errores comunes a detectar
    parts.push('\nErrores comunes a detectar:');
    rubric.commonErrors.forEach(error => {
      parts.push(`- ${error}`);
    });

    // Respuestas ejemplares
    parts.push('\nRespuestas ejemplares:');
    rubric.exemplarResponses.forEach(exemplar => {
      const truncated = exemplar.length > 100 ? exemplar.substring(0, 97) + '...' : exemplar;
      parts.push(`- ${truncated}`);
    });

    // Templates de feedback disponibles
    parts.push('\nTemplates de feedback según desempeño:');
    parts.push(`- Correcto: ${rubric.feedbackTemplates.correct.length} opciones`);
    parts.push(`- Parcial: ${rubric.feedbackTemplates.partial.length} opciones`);
    parts.push(`- Incorrecto: ${rubric.feedbackTemplates.incorrect.length} opciones`);
    parts.push(`- Necesita ayuda: ${rubric.feedbackTemplates.needsHelp.length} opciones`);

    // Niveles de hints disponibles
    parts.push('\nNiveles de ayuda disponibles:');
    parts.push(`- Nivel 1 (sutil): ${rubric.hints.level1.length} hints`);
    parts.push(`- Nivel 2 (directo): ${rubric.hints.level2.length} hints`);
    parts.push(`- Nivel 3 (explícito): ${rubric.hints.level3.length} hints`);
  }

  return parts.join('\n');
}

/**
 * Construye el resumen de la sesión actual
 * Limita a ~300-600 tokens aproximadamente
 */
function buildSessionContext(
  sessionSummary?: string,
  aggregateMastery?: number,
  consecutiveCorrect?: number
): string {
  const parts = [];

  parts.push('## Estado del estudiante');

  if (sessionSummary) {
    // Truncar si es muy largo
    const truncated = sessionSummary.length > 500
      ? sessionSummary.substring(0, 497) + '...'
      : sessionSummary;
    parts.push(truncated);
  } else {
    parts.push('Primera interacción en esta sesión.');
  }

  // Métricas si están disponibles
  if (aggregateMastery !== undefined) {
    const masteryPercent = Math.round(aggregateMastery * 100);
    parts.push(`\nDominio actual: ${masteryPercent}%`);
  }

  if (consecutiveCorrect !== undefined && consecutiveCorrect > 0) {
    parts.push(`Respuestas correctas consecutivas: ${consecutiveCorrect}`);
  }

  return parts.join('\n');
}

/**
 * Construye el turno actual
 */
function buildCurrentTurn(
  questionShown: string,
  studentAnswer: string
): string {
  const parts = [];

  parts.push('## Turno actual');
  parts.push(`Pregunta mostrada: "${questionShown}"`);
  parts.push(`Respuesta del estudiante: "${studentAnswer}"`);

  return parts.join('\n');
}

/**
 * Función principal: construye el payload completo para el turno
 * Retorna el mensaje formateado para el rol "user"
 */
export function buildTurnPayload(options: TurnPayloadOptions): string {
  const {
    lesson,
    momentId,
    sessionSummary,
    questionShown,
    studentAnswer,
    aggregateMastery,
    consecutiveCorrect
  } = options;

  // Encontrar el momento actual
  const currentMoment = lesson.moments?.find(m => m.id === momentId);
  if (!currentMoment) {
    throw new Error(`Momento ${momentId} no encontrado en la lección`);
  }

  // Pasar el lessonId (por ahora hardcodeado a 1, TODO: hacer dinámico)
  const lessonId = typeof lesson.id === 'string' ? parseInt(lesson.id) : lesson.id || 1;

  // Construir las partes del contexto
  const parts = [
    '# CONTEXTO DEL TURNO',
    '',
    buildLessonContext(lesson),
    '',
    buildMomentContext(currentMoment, lessonId),
    '',
    buildSessionContext(sessionSummary, aggregateMastery, consecutiveCorrect),
    '',
    buildCurrentTurn(questionShown, studentAnswer),
    '',
    '# INSTRUCCIÓN',
    'Evalúa la respuesta del estudiante usando la rúbrica pedagógica provista.',
    'Selecciona feedback apropiado basado en el desempeño y las necesidades del estudiante.',
    'Si el estudiante está confundido, usa los hints graduales (nivel 1, 2 o 3).',
    'Genera tu respuesta siguiendo el schema JSON v1 exacto.',
    'Recuerda: eres SOPHIA, la tutora experta. Sé empática pero exigente.',
    'Responde SOLO con el JSON, sin texto adicional.'
  ];

  return parts.join('\n');
}

/**
 * Helper para construir un resumen de sesión actualizado
 * Usado para actualizar sessionSummary en la DB después de cada turno
 */
export function buildSessionSummary(
  previousSummary: string | null,
  currentMomentTitle: string,
  studentAnswer: string,
  aiResponse: string,
  wasCorrect: boolean,
  aggregateMastery: number
): string {
  const parts = [];

  // Agregar contexto previo (últimas 200 chars si existe)
  if (previousSummary && previousSummary.length > 0) {
    const truncated = previousSummary.length > 200
      ? '...' + previousSummary.substring(previousSummary.length - 200)
      : previousSummary;
    parts.push(truncated);
    parts.push('\n---');
  }

  // Agregar intercambio actual (muy resumido)
  const timestamp = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  parts.push(`[${timestamp}] Momento: ${currentMomentTitle}`);

  // Respuesta del estudiante (máx 100 chars)
  const studentTruncated = studentAnswer.length > 100
    ? studentAnswer.substring(0, 97) + '...'
    : studentAnswer;
  parts.push(`E: ${studentTruncated}`);

  // Evaluación
  const result = wasCorrect ? '✓' : '✗';
  const masteryPercent = Math.round(aggregateMastery * 100);
  parts.push(`Resultado: ${result} | Dominio: ${masteryPercent}%`);

  // Respuesta de SOPHIA (máx 100 chars)
  const aiTruncated = aiResponse.length > 100
    ? aiResponse.substring(0, 97) + '...'
    : aiResponse;
  parts.push(`S: ${aiTruncated}`);

  // Mantener máximo 600 caracteres total
  const summary = parts.join('\n');
  if (summary.length > 600) {
    return '...' + summary.substring(summary.length - 597);
  }

  return summary;
}