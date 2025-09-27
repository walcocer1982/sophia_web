/**
 * Helper para construir el contexto de cada turno
 * Optimizado para reducir tokens mientras mantiene información clave
 */

import type { LessonStructure, LessonMoment, LessonTarget } from '@/types/lesson-types';

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
  targetMastery?: Record<number, number>; // Agregar mastery por target
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
 * Construye el contexto del target activo con rúbrica de 5 niveles
 */
function buildTargetContext(target: LessonTarget, currentMastery?: number): string {
  const parts = [];

  parts.push('## Target de Evaluación');
  parts.push(`ID: ${target.id}`);
  parts.push(`Título: ${target.title}`);
  parts.push(`Descripción: ${target.description}`);
  parts.push(`Mastery mínimo requerido: ${(target.minMastery * 100).toFixed(0)}%`);

  if (currentMastery !== undefined) {
    parts.push(`Mastery actual del estudiante: ${(currentMastery * 100).toFixed(0)}%`);
  }

  // Rúbrica de 5 niveles (resumida para optimizar tokens)
  parts.push('\n## Rúbrica de Evaluación (5 niveles)');
  target.rubric5.levels.forEach(level => {
    // Solo incluir 1-2 criterios clave por nivel para reducir tokens
    const criteriaResumen = level.criteria.slice(0, 2).join('; ');
    parts.push(`- Nivel ${level.level} (${level.name}): ${criteriaResumen}`);
  });

  // Errores comunes
  if (target.rubric5.commonErrors && target.rubric5.commonErrors.length > 0) {
    parts.push('\n## Errores comunes a detectar:');
    target.rubric5.commonErrors.slice(0, 3).forEach(error => {
      parts.push(`- ${error}`);
    });
  }

  // Hints disponibles
  if (target.rubric5.hints) {
    parts.push('\n## Pistas disponibles:');
    if (target.rubric5.hints.level1) {
      parts.push(`- Nivel 1 (sutil): ${target.rubric5.hints.level1}`);
    }
    if (target.rubric5.hints.level2) {
      parts.push(`- Nivel 2 (directo): ${target.rubric5.hints.level2}`);
    }
    if (target.rubric5.hints.level3) {
      parts.push(`- Nivel 3 (explícito): ${target.rubric5.hints.level3}`);
    }
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
  parts.push(`Meta narrativa: ${moment.goal}`);
  parts.push(`Target evaluado: ID ${moment.primaryTargetId}`);

  // Preguntas de referencia como inspiración
  if (moment.referenceQuestions && moment.referenceQuestions.length > 0) {
    parts.push('\n## Preguntas de referencia (SOLO INSPIRACIÓN)');
    parts.push('**IMPORTANTE**: NO uses estas preguntas literalmente. Son solo ideas.');
    parts.push('**DEBES**: Reformular, combinar o crear nuevas preguntas que:');
    parts.push('- Evalúen específicamente el target activo');
    parts.push('- Se ajusten al nivel actual del estudiante');
    parts.push('- Conecten naturalmente con la conversación previa');
    parts.push('\nIdeas base:');
    moment.referenceQuestions.forEach((q) => {
      const truncated = q.length > 150 ? q.substring(0, 147) + '...' : q;
      parts.push(`- ${truncated}`);
    });
    parts.push('\n**Tu pregunta debe evaluar el TARGET, no solo seguir el guión.**');
  }

  // Imágenes disponibles
  if (moment.images && moment.images.length > 0) {
    parts.push('\nImágenes contextuales:');
    moment.images.forEach(img => {
      parts.push(`- [Imagen ${img.id}]: ${img.description}`);
    });
  }

  // NOTA: La rúbrica ahora está en el Target, no en el momento

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

  // Si ambos están vacíos, es el modo init
  if (!questionShown && !studentAnswer) {
    parts.push('## Inicio de sesión');
    parts.push('Esta es la primera interacción del estudiante con la lección.');
    parts.push('DEBES: Dar una bienvenida breve, presentar 2-3 objetivos clave y formular tu primera pregunta.');
  } else {
    parts.push('## Turno actual');
    parts.push(`Pregunta mostrada: "${questionShown}"`);
    parts.push(`Respuesta del estudiante: "${studentAnswer}"`);
  }

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
    consecutiveCorrect,
    targetMastery = {}
  } = options;

  // Encontrar el momento actual
  const currentMoment = lesson.moments?.find(m => m.id === momentId);
  if (!currentMoment) {
    throw new Error(`Momento ${momentId} no encontrado en la lección`);
  }

  // Encontrar el target activo del momento
  const currentTarget = lesson.targets?.find(t => t.id === currentMoment.primaryTargetId);
  if (!currentTarget) {
    throw new Error(`Target ${currentMoment.primaryTargetId} no encontrado en la lección`);
  }

  // Obtener el mastery actual del target desde los datos pasados
  const targetMasteryActual = targetMastery[currentTarget.id] || 0.5;

  // Determinar si es modo init
  const isInitMode = !questionShown && !studentAnswer;

  // Construir las partes del contexto
  const parts = [
    '# CONTEXTO DEL TURNO',
    '',
    buildLessonContext(lesson),
    '',
    buildTargetContext(currentTarget, targetMasteryActual),
    '',
    buildMomentContext(currentMoment),
    '',
    buildSessionContext(sessionSummary, aggregateMastery, consecutiveCorrect),
    '',
    buildCurrentTurn(questionShown, studentAnswer),
    '',
    '# INSTRUCCIÓN'
  ];

  if (isInitMode) {
    parts.push(
      'Esta es la PRIMERA interacción del estudiante con esta lección.',
      '**DEBES**:',
      '1. Dar una bienvenida cálida y breve (1-2 frases máximo)',
      '2. Presentar 2-3 objetivos clave de aprendizaje de forma concisa',
      '3. Formular inmediatamente tu primera pregunta del momento actual',
      '',
      'NO evalúes ninguna respuesta (no hay respuesta aún).',
      'Tu mensaje debe fluir naturalmente: bienvenida → objetivos → pregunta.',
      'Usa progress.masteryDelta = 0, nextStep = "RETRY", tags = ["PARTIAL"].',
      'Genera tu respuesta siguiendo el schema JSON v1 exacto.',
      'Recuerda: eres SOPHIA, la tutora experta.',
      'Responde SOLO con el JSON, sin texto adicional.'
    );
  } else {
    parts.push(
      'Evalúa la respuesta del estudiante usando la rúbrica de 5 niveles del TARGET activo.',
      '**IMPORTANTE**: Evalúa EXCLUSIVAMENTE el target especificado arriba.',
      'Identifica el NIVEL alcanzado (1-5) según los criterios observables.',
      'Usa el nivel para determinar tags y masteryDelta según las reglas del sistema.',
      'NO evalúes aspectos fuera del target actual.',
      'Selecciona feedback apropiado para ayudar al estudiante a alcanzar el siguiente nivel.',
      'Si el estudiante está confundido, usa los hints del target (nivel 1, 2 o 3).',
      'Genera tu respuesta siguiendo el schema JSON v1 exacto.',
      'Recuerda: eres SOPHIA, la tutora experta. Sé empática pero exigente.',
      'Responde SOLO con el JSON, sin texto adicional.'
    );
  }

  return parts.join('\n');
}
