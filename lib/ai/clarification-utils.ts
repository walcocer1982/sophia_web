/**
 * Utilidades para detección de preguntas de aclaración
 * Heurística de fallback para cuando la IA no detecta correctamente
 */

/**
 * Detecta si el texto del estudiante es una pregunta de aclaración
 * @param text - Texto del estudiante
 * @returns true si es una pregunta de aclaración
 */
export function isClarification(text: string): boolean {
  if (!text || text.trim().length === 0) {
    return false;
  }

  const lowerText = text.toLowerCase().trim();

  // Patrones de aclaración comunes en español
  const clarificationPatterns = [
    // Preguntas directas de definición
    /^¿qué es/i,
    /^¿qué son/i,
    /^¿a qué te refieres/i,
    /^¿qué significa/i,
    /^¿qué quiere decir/i,
    /^¿cómo es/i,
    /^¿cuál es/i,

    // Expresiones de confusión
    /^no entiendo/i,
    /^no comprendo/i,
    /^no me queda claro/i,
    /^no sé qué es/i,
    /^no sé a qué/i,
    /^estoy confundido/i,
    /^me confunde/i,

    // Solicitudes de explicación
    /^¿puedes explicar/i,
    /^¿podrías explicar/i,
    /^¿me puedes decir/i,
    /^¿me podrías decir/i,
    /^explícame/i,
    /^explica/i,

    // Preguntas sobre términos específicos
    /^¿.*\?$/, // Cualquier pregunta corta (menos de 30 chars)
  ];

  // Verificar patrones
  const matchesPattern = clarificationPatterns.some(pattern => pattern.test(lowerText));

  if (matchesPattern) {
    // Verificación adicional para preguntas cortas
    if (lowerText.endsWith('?') && lowerText.length < 30) {
      return true;
    }
    return true;
  }

  // Palabras clave de confusión en cualquier parte del texto
  const confusionKeywords = [
    'no entiendo',
    'no comprendo',
    'qué significa',
    'qué es',
    'a qué te refieres',
    'no sé qué',
    'podrías explicar',
    'puedes explicar',
    'me confunde',
    'estoy confundido',
    'no me queda claro',
    'aclarar',
    'clarificar'
  ];

  // Si contiene palabras clave de confusión Y es una pregunta
  const hasConfusionKeyword = confusionKeywords.some(keyword =>
    lowerText.includes(keyword)
  );

  if (hasConfusionKeyword && lowerText.includes('?')) {
    return true;
  }

  // Preguntas muy cortas sobre términos específicos (ej: "¿fuente?", "¿IPERC?")
  if (lowerText.endsWith('?') && lowerText.length <= 15) {
    // Verificar que no sea una respuesta tipo "¿sí?" o "¿no?"
    const simpleResponses = ['sí', 'si', 'no', 'tal vez', 'quizás', 'quizas'];
    const withoutQuestion = lowerText.replace('?', '').replace('¿', '').trim();

    if (!simpleResponses.includes(withoutQuestion)) {
      return true;
    }
  }

  return false;
}

/**
 * Extrae el término o concepto sobre el que el estudiante pregunta
 * @param text - Texto del estudiante
 * @returns El término extraído o null
 */
export function extractClarificationTerm(text: string): string | null {
  const lowerText = text.toLowerCase().trim();

  // Patrones para extraer términos
  const patterns = [
    /¿qué es (?:un |una |el |la )?(.+?)\?/i,
    /¿qué son (?:los |las )?(.+?)\?/i,
    /¿a qué te refieres con (.+?)\?/i,
    /¿qué significa (.+?)\?/i,
    /no entiendo (?:qué es |qué son |lo de )?(.+?)(?:\.|$)/i,
    /¿(.+?)\?$/, // Pregunta simple de una palabra
  ];

  for (const pattern of patterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Determina el tipo de intención del turno con heurística
 * @param text - Texto del estudiante
 * @returns El tipo de intención detectado
 */
export function detectTurnIntent(
  text: string
): 'ANSWER' | 'CLARIFY' | 'OFFTOPIC' {
  // Primero verificar si es aclaración
  if (isClarification(text)) {
    return 'CLARIFY';
  }

  // Verificar si es off-topic (muy básico por ahora)
  const lowerText = text.toLowerCase();
  const offTopicKeywords = [
    'hola',
    'adiós',
    'adios',
    'cómo estás',
    'como estas',
    'qué tal',
    'buenos días',
    'buenas tardes',
    'buenas noches',
    'gracias',
    'chau',
    'bye'
  ];

  // Si es un saludo o despedida muy corto
  if (text.length < 20 && offTopicKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'OFFTOPIC';
  }

  // Por defecto, asumimos que es una respuesta
  return 'ANSWER';
}