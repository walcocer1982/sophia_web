/**
 * Helper para construir el contexto de cada turno
 * Optimizado para reducir tokens mientras mantiene información clave
 */

import type { LessonStructure, LessonMoment } from '@/types/lesson-types';

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
  // parts.push(`Idioma: ${lesson.language}`);

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
function buildMomentContext(moment: LessonMoment): string {
  const parts = [];

  parts.push('## Momento actual');
  parts.push(`ID: ${moment.id}`);
  parts.push(`Título: ${moment.title}`);
  parts.push(`Meta: ${moment.goal}`);

  // Preguntas de referencia como inspiración
  if (moment.referenceQuestions && moment.referenceQuestions.length > 0) {
    parts.push('\n## Preguntas de referencia (SOLO INSPIRACIÓN)');
    parts.push('**IMPORTANTE**: NO uses estas preguntas literalmente. Son solo ideas.');
    parts.push('**DEBES**: Reformular, combinar o crear nuevas preguntas que:');
    parts.push('- Sean más claras y específicas para el estudiante actual');
    parts.push('- Se ajusten mejor al nivel de mastery y contexto');
    parts.push('- Conecten naturalmente con la conversación previa');
    parts.push('\nIdeas base:');
    moment.referenceQuestions.forEach((q) => {
      const truncated = q.length > 150 ? q.substring(0, 147) + '...' : q;
      parts.push(`- ${truncated}`);
    });
    parts.push('\n**Tu pregunta debe ser ORIGINAL y ADAPTADA al momento actual.**');
  }

  // Imágenes disponibles
  if (moment.images && moment.images.length > 0) {
    parts.push('\nImágenes contextuales:');
    moment.images.forEach(img => {
      parts.push(`- [Imagen ${img.id}]: ${img.description}`);
    });
  }

  // Incluir rúbrica pedagógica del momento si existe
  if (moment.rubric) {
    parts.push('\n## Rúbrica de Evaluación Pedagógica');

    // Criterios de evaluación
    parts.push('\nCriterios de evaluación:');
    parts.push(`✓ Correcto si: ${moment.rubric.correct.join('; ')}`);
    if (moment.rubric.partial) {
      parts.push(`~ Parcial si: ${moment.rubric.partial.join('; ')}`);
    }
    if (moment.rubric.vague) {
      parts.push(`? Vago si: ${moment.rubric.vague.join('; ')}`);
    }
    if (moment.rubric.incorrect) {
      parts.push(`✗ Incorrecto si: ${moment.rubric.incorrect.join('; ')}`);
    }

    // Errores comunes si están definidos
    if (moment.rubric.commonErrors && moment.rubric.commonErrors.length > 0) {
      parts.push('\nErrores comunes a detectar:');
      moment.rubric.commonErrors.forEach(error => {
        parts.push(`- ${error}`);
      });
    }

    // Hints disponibles si están definidos
    if (moment.rubric.hints) {
      parts.push('\nPistas disponibles por nivel:');
      if (moment.rubric.hints.level1) {
        parts.push(`- Nivel 1 (sutil): ${moment.rubric.hints.level1}`);
      }
      if (moment.rubric.hints.level2) {
        parts.push(`- Nivel 2 (directo): ${moment.rubric.hints.level2}`);
      }
      if (moment.rubric.hints.level3) {
        parts.push(`- Nivel 3 (explícito): ${moment.rubric.hints.level3}`);
      }
    }
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

  // Construir las partes del contexto
  const parts = [
    '# CONTEXTO DEL TURNO',
    '',
    buildLessonContext(lesson),
    '',
    buildMomentContext(currentMoment),
    '',
    buildSessionContext(sessionSummary, aggregateMastery, consecutiveCorrect),
    '',
    buildCurrentTurn(questionShown, studentAnswer),
    '',
    '# INSTRUCCIÓN',
    'Evalúa la respuesta del estudiante usando la rúbrica pedagógica provista.',
    '**IMPORTANTE**: EVALÚA SOLO lo que la pregunta específicamente solicita.',
    'NO agregues requisitos adicionales de la rúbrica que no fueron pedidos en la pregunta.',
    'Si la pregunta pide UN concepto, evalúa ESE concepto. No exijas comparaciones no solicitadas.',
    'Selecciona feedback apropiado basado en el desempeño y las necesidades del estudiante.',
    'Si el estudiante está confundido, usa los hints graduales (nivel 1, 2 o 3).',
    'Genera tu respuesta siguiendo el schema JSON v1 exacto.',
    'Recuerda: eres SOPHIA, la tutora experta. Sé empática pero exigente.',
    'Responde SOLO con el JSON, sin texto adicional.'
  ];

  return parts.join('\n');
}
