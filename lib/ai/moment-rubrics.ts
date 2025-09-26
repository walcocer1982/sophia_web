/**
 * Rúbricas específicas por momento para evaluación pedagógica
 * Proporciona criterios detallados y feedback contextualizado
 */

export interface MomentRubric {
  momentId: number;
  criteria: {
    correct: string[];
    partial: string[];
    incorrect: string[];
  };
  commonErrors: string[];
  exemplarResponses: string[];
  feedbackTemplates: {
    correct: string[];
    partial: string[];
    incorrect: string[];
    needsHelp: string[];
  };
  hints: {
    level1: string[]; // Pistas sutiles
    level2: string[]; // Pistas más directas
    level3: string[]; // Guía explícita
  };
}

/**
 * Rúbricas para la lección 1: IPERC
 */
export const lesson1Rubrics: MomentRubric[] = [
  {
    momentId: 0,
    criteria: {
      correct: [
        "Diferencia clara entre peligro (fuente de daño) y riesgo (probabilidad)",
        "Proporciona ejemplos concretos del área de trabajo",
        "Demuestra comprensión de que el riesgo es evaluable/medible"
      ],
      partial: [
        "Entiende uno de los conceptos pero no ambos claramente",
        "No proporciona ejemplos específicos",
        "Confunde parcialmente los términos"
      ],
      incorrect: [
        "No diferencia entre peligro y riesgo",
        "Usa los términos como sinónimos",
        "Respuesta vaga sin demostrar comprensión"
      ]
    },
    commonErrors: [
      "Usar peligro y riesgo como sinónimos",
      "Pensar que el riesgo es el daño en sí",
      "No considerar la probabilidad en el riesgo",
      "Dar ejemplos genéricos sin contexto laboral"
    ],
    exemplarResponses: [
      "Un peligro es una fuente o situación con potencial de causar daño, como una máquina sin guarda de protección. El riesgo es la probabilidad de que ese daño ocurra considerando la exposición, como el riesgo alto de atrapamiento si opero esa máquina diariamente."
    ],
    feedbackTemplates: {
      correct: [
        "¡Excelente distinción! Has identificado correctamente que el peligro es la fuente y el riesgo es la probabilidad.",
        "Muy bien explicado. Tu ejemplo de {ejemplo} demuestra comprensión clara de ambos conceptos.",
        "¡Perfecto! Has captado la esencia: peligro = qué puede dañar, riesgo = qué tan probable es."
      ],
      partial: [
        "Vas por buen camino. Has identificado {aspecto_correcto}, pero necesitamos clarificar {aspecto_faltante}.",
        "Buena base. Ahora, ¿podrías darme un ejemplo específico de tu área de trabajo?",
        "Entiendo tu punto sobre {concepto}. Profundicemos en la diferencia con el otro término."
      ],
      incorrect: [
        "Veo que hay confusión entre los términos. Piensa: el peligro es el 'qué' y el riesgo es el 'qué tan probable'.",
        "No te preocupes, es común confundirlos al inicio. El peligro existe siempre, pero el riesgo varía según la exposición.",
        "Intentemos con un ejemplo simple: una escalera es un peligro (puede causar caídas), pero el riesgo depende de cómo la uses."
      ],
      needsHelp: [
        "Te voy a guiar paso a paso. Primero, identifiquemos algo en tu trabajo que podría causar daño...",
        "Empecemos con algo concreto. ¿Qué herramientas o situaciones en tu trabajo podrían lastimarte?",
        "No hay problema, vamos despacio. Un peligro es como un cuchillo afilado - siempre puede cortar. El riesgo es qué tan probable es que te cortes usándolo."
      ]
    },
    hints: {
      level1: [
        "Piensa en la diferencia entre 'lo que puede dañar' y 'qué tan probable es que dañe'",
        "Considera ejemplos de tu área de trabajo específica",
        "Recuerda: uno es la fuente, el otro es la probabilidad"
      ],
      level2: [
        "El peligro es el objeto o situación (ej: piso mojado), el riesgo es la chance de accidente",
        "¿Qué máquinas o sustancias en tu trabajo son peligrosas? ¿Siempre tienen el mismo nivel de riesgo?",
        "Peligro = sustantivo (cosa), Riesgo = probabilidad (medible)"
      ],
      level3: [
        "Un peligro es una fuente de daño potencial. El riesgo es la probabilidad de que ese daño ocurra.",
        "Ejemplo: Electricidad = peligro. Riesgo alto si trabajas sin EPP, riesgo bajo con protección adecuada.",
        "Para identificar: Peligro responde '¿qué puede dañar?', Riesgo responde '¿qué tan probable?'"
      ]
    }
  },
  {
    momentId: 1,
    criteria: {
      correct: [
        "Identifica al menos 3 peligros específicos del entorno mostrado",
        "Los peligros identificados son reales y observables",
        "Usa terminología apropiada de seguridad"
      ],
      partial: [
        "Identifica 1-2 peligros correctamente",
        "Algunos peligros son válidos pero otros son especulativos",
        "Identificación correcta pero sin usar términos técnicos"
      ],
      incorrect: [
        "No identifica peligros reales del entorno",
        "Confunde peligros con riesgos o consecuencias",
        "Respuesta demasiado vaga o general"
      ]
    },
    commonErrors: [
      "Mencionar consecuencias en lugar de peligros",
      "Ser demasiado general ('accidentes pueden pasar')",
      "No observar detalles específicos del entorno",
      "Inventar peligros no visibles en el contexto"
    ],
    exemplarResponses: [
      "Identifico: 1) Superficies resbalosas por posible derrame, 2) Objetos en altura que pueden caer, 3) Cables eléctricos expuestos sin protección, 4) Falta de señalización de seguridad, 5) Espacios reducidos para circulación."
    ],
    feedbackTemplates: {
      correct: [
        "¡Excelente observación! Has identificado peligros clave como {peligros_mencionados}.",
        "Muy bien. Tu identificación de {peligro_específico} muestra buena atención al detalle.",
        "¡Perfecto! Has aplicado correctamente lo aprendido sobre peligros al contexto real."
      ],
      partial: [
        "Buen inicio con {peligros_correctos}. ¿Qué otros peligros observas en {área_no_mencionada}?",
        "Has identificado algunos peligros importantes. Observa más detenidamente {aspecto_a_revisar}.",
        "Correcto en {elementos_bien}. Ahora enfócate en peligros más específicos del entorno mostrado."
      ],
      incorrect: [
        "Recuerda que buscamos peligros (fuentes de daño), no consecuencias. Observa nuevamente.",
        "Necesitas ser más específico. ¿Qué elementos concretos del entorno pueden causar daño?",
        "Volvamos a observar. Busca objetos, condiciones o situaciones que podrían lastimar a alguien."
      ],
      needsHelp: [
        "Te ayudo a empezar. Mira el piso: ¿está en condiciones seguras? ¿Y los objetos en altura?",
        "Hagamos un recorrido visual: piso, paredes, techo, equipos. ¿Qué podría causar daño en cada área?",
        "Imagina que caminas por ese espacio. ¿Con qué podrías tropezar, golpearte o lastimarte?"
      ]
    },
    hints: {
      level1: [
        "Observa las condiciones del piso y superficies",
        "Revisa si hay objetos que puedan caer",
        "Busca elementos eléctricos o mecánicos expuestos"
      ],
      level2: [
        "¿Hay líquidos derramados o superficies resbalosas?",
        "¿Los objetos en altura están asegurados?",
        "¿Ves cables, equipos sin protección o bordes filosos?"
      ],
      level3: [
        "Busca: pisos mojados, objetos mal almacenados, cables sueltos, falta de señalización",
        "Considera: iluminación, ventilación, espacios de circulación, estado de equipos",
        "Peligros comunes: caídas, golpes, cortes, atrapamientos, contacto eléctrico"
      ]
    }
  },
  {
    momentId: 2,
    criteria: {
      correct: [
        "Evalúa correctamente la probabilidad (alta/media/baja)",
        "Considera la severidad del daño potencial",
        "Justifica la evaluación con factores observables",
        "Usa matriz o método sistemático de evaluación"
      ],
      partial: [
        "Evalúa probabilidad O severidad, pero no ambas",
        "Evaluación razonable pero sin justificación clara",
        "Usa intuición más que método sistemático"
      ],
      incorrect: [
        "No diferencia niveles de riesgo",
        "Evaluación sin fundamento observable",
        "Confunde evaluación de riesgo con identificación de peligros"
      ]
    },
    commonErrors: [
      "Evaluar todos los riesgos como altos por precaución",
      "No considerar la frecuencia de exposición",
      "Ignorar la severidad potencial del daño",
      "No usar criterios consistentes"
    ],
    exemplarResponses: [
      "Para el piso mojado: Riesgo ALTO - Probabilidad alta (tránsito frecuente) x Severidad media (caídas, golpes). Para cables en altura: Riesgo MEDIO - Probabilidad baja (bien instalados) x Severidad alta (electrocución). Uso matriz 3x3 considerando exposición diaria."
    ],
    feedbackTemplates: {
      correct: [
        "¡Excelente evaluación! Has considerado tanto probabilidad como severidad en tu análisis.",
        "Muy bien estructurado. Tu uso de {método} demuestra comprensión sistemática del proceso.",
        "Perfecto. Tu justificación basada en {factores} es exactamente lo que buscamos en IPERC."
      ],
      partial: [
        "Buen análisis de {aspecto_correcto}. Ahora necesitamos considerar también {aspecto_faltante}.",
        "Tu evaluación tiene sentido, pero ¿podrías justificarla con factores observables?",
        "Vas bien. Intenta usar una matriz de probabilidad x severidad para ser más sistemático."
      ],
      incorrect: [
        "La evaluación de riesgos necesita considerar tanto la probabilidad como la severidad del daño.",
        "Recuerda: Riesgo = Probabilidad x Severidad. Evalúa ambos factores.",
        "Necesitamos ser más específicos. ¿Qué tan probable es? ¿Qué tan grave sería el daño?"
      ],
      needsHelp: [
        "Usemos una matriz simple: Probabilidad (Baja/Media/Alta) x Severidad (Leve/Moderada/Grave)",
        "Para cada peligro, pregúntate: 1) ¿Qué tan seguido podría pasar? 2) ¿Qué tan grave sería?",
        "Empecemos con un peligro. El piso mojado: ¿cuánta gente pasa por ahí? ¿qué lesiones causaría una caída?"
      ]
    },
    hints: {
      level1: [
        "Considera frecuencia de exposición y gravedad potencial",
        "Usa una escala consistente para todos los riesgos",
        "Piensa en el peor escenario razonable"
      ],
      level2: [
        "Probabilidad: ¿Diario, semanal, mensual, raro?",
        "Severidad: ¿Molestia, lesión menor, lesión grave, fatalidad?",
        "Multiplica ambos factores para obtener el nivel de riesgo"
      ],
      level3: [
        "Usa matriz: Probabilidad (1-3) x Severidad (1-3) = Riesgo (1-9)",
        "Alto: 6-9 puntos, Medio: 3-5 puntos, Bajo: 1-2 puntos",
        "Considera: frecuencia, duración de exposición, número de personas expuestas"
      ]
    }
  },
  {
    momentId: 3,
    criteria: {
      correct: [
        "Propone controles siguiendo la jerarquía (eliminación > sustitución > ingeniería > administrativos > EPP)",
        "Los controles son específicos y aplicables",
        "Considera múltiples tipos de control para cada riesgo",
        "Justifica por qué cada control es efectivo"
      ],
      partial: [
        "Propone controles válidos pero solo EPP",
        "Controles apropiados pero sin seguir jerarquía",
        "Controles genéricos sin especificidad"
      ],
      incorrect: [
        "No propone controles viables",
        "Confunde controles con identificación de peligros",
        "Propuestas no relacionadas con los riesgos identificados"
      ]
    },
    commonErrors: [
      "Ir directo al EPP sin considerar controles superiores",
      "Proponer solo señalización como solución",
      "Controles demasiado costosos o imprácticos",
      "No considerar la efectividad real del control"
    ],
    exemplarResponses: [
      "Para piso mojado: 1) Ingeniería: instalar drenaje y superficie antideslizante, 2) Administrativo: procedimiento de limpieza inmediata y señalización temporal, 3) EPP: calzado antideslizante obligatorio. Priorizo el control de ingeniería por ser más efectivo a largo plazo."
    ],
    feedbackTemplates: {
      correct: [
        "¡Excelente aplicación de la jerarquía de controles! Tu propuesta de {control_principal} es muy efectiva.",
        "Muy bien pensado. Has considerado múltiples niveles de control, priorizando correctamente.",
        "Perfecto. Tu enfoque sistemático desde {nivel_superior} hasta EPP es exactamente correcto."
      ],
      partial: [
        "Buenos controles, pero recuerda la jerarquía: ¿podemos eliminar o sustituir antes que proteger?",
        "El EPP es importante, pero ¿qué controles de ingeniería o administrativos podríamos implementar primero?",
        "Tus ideas son válidas. Ahora hazlas más específicas: ¿cómo exactamente implementarías {control}?"
      ],
      incorrect: [
        "Los controles deben abordar directamente los riesgos identificados. Revisemos la conexión.",
        "Recuerda la jerarquía: Eliminar > Sustituir > Ingeniería > Administrativo > EPP",
        "Necesitamos controles más prácticos y específicos. ¿Qué se puede implementar realmente?"
      ],
      needsHelp: [
        "Empecemos con la jerarquía: ¿Podemos eliminar el peligro completamente? Si no, ¿podemos sustituirlo?",
        "Para cada riesgo, piensa: 1) ¿Puedo quitarlo? 2) ¿Puedo cambiarlo? 3) ¿Puedo aislarlo? 4) ¿Puedo controlarlo con reglas? 5) ¿Qué protección necesito?",
        "Ejemplo para piso mojado: No puedo eliminar el agua, pero puedo: mejorar drenaje (ingeniería), limpiar rápido (administrativo), usar calzado especial (EPP)"
      ]
    },
    hints: {
      level1: [
        "Recuerda la jerarquía de controles de mayor a menor efectividad",
        "Piensa en soluciones permanentes antes que temporales",
        "Considera factibilidad y costo-beneficio"
      ],
      level2: [
        "¿Se puede eliminar el peligro? ¿Sustituir por algo menos peligroso?",
        "¿Qué barreras físicas o modificaciones de ingeniería ayudarían?",
        "¿Qué procedimientos, capacitación o EPP complementarían?"
      ],
      level3: [
        "Eliminación: quitar el peligro. Sustitución: reemplazar por algo más seguro",
        "Ingeniería: barreras, ventilación, automatización. Administrativo: procedimientos, rotación, capacitación",
        "EPP: último recurso - cascos, guantes, lentes, arneses según el riesgo"
      ]
    }
  }
];

/**
 * Obtener rúbrica para un momento específico
 */
export function getMomentRubric(lessonId: number, momentId: number): MomentRubric | undefined {
  // Por ahora solo tenemos lesson 1
  if (lessonId === 1) {
    return lesson1Rubrics.find(r => r.momentId === momentId);
  }
  return undefined;
}

/**
 * Obtener feedback apropiado basado en la evaluación
 */
export function getFeedbackTemplate(
  rubric: MomentRubric,
  evaluation: 'correct' | 'partial' | 'incorrect' | 'needsHelp'
): string {
  const templates = rubric.feedbackTemplates[evaluation];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Obtener pista apropiada según el nivel de ayuda necesario
 */
export function getHint(rubric: MomentRubric, level: 1 | 2 | 3): string {
  const hints = level === 1 ? rubric.hints.level1 :
                level === 2 ? rubric.hints.level2 :
                rubric.hints.level3;
  return hints[Math.floor(Math.random() * hints.length)];
}

/**
 * Detectar errores comunes en la respuesta
 */
export function detectCommonErrors(rubric: MomentRubric, answer: string): string[] {
  const detectedErrors: string[] = [];
  const lowerAnswer = answer.toLowerCase();

  // Análisis simple basado en palabras clave
  rubric.commonErrors.forEach(error => {
    // Aquí podrías implementar lógica más sofisticada de detección
    // Por ahora es un placeholder para el concepto
    if (error.includes("sinónimos") && lowerAnswer.includes("lo mismo")) {
      detectedErrors.push(error);
    }
    if (error.includes("vaga") && answer.length < 50) {
      detectedErrors.push(error);
    }
  });

  return detectedErrors;
}