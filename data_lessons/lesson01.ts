import type { LessonStructure, LessonTarget } from "@/types/lesson-types";

// Targets de evaluación: competencias específicas a desarrollar
const targets: LessonTarget[] = [
  {
    id: 1,
    title: "Identificación de Peligros",
    description: "Capacidad de reconocer y definir peligros en el entorno laboral",
    minMastery: 0.7, // 70% para considerar logrado
    weight: 1,
    rubric5: {
      levels: [
        {
          level: 1,
          name: "Inicial",
          criteria: [
            "No logra definir qué es un peligro",
            "Confunde peligros con otros conceptos",
            "No puede dar ejemplos relevantes"
          ]
        },
        {
          level: 2,
          name: "Básico",
          criteria: [
            "Define peligro de forma general",
            "Da ejemplos simples pero poco específicos",
            "Reconoce algunos peligros obvios"
          ]
        },
        {
          level: 3,
          name: "Competente",
          criteria: [
            "Define peligro como fuente potencial de daño",
            "Proporciona ejemplos específicos del área de trabajo",
            "Comprende el concepto de potencialidad"
          ]
        },
        {
          level: 4,
          name: "Avanzado",
          criteria: [
            "Define con precisión técnica",
            "Identifica peligros menos evidentes",
            "Relaciona peligros con contexto específico"
          ]
        },
        {
          level: 5,
          name: "Dominio",
          criteria: [
            "Identifica sistemáticamente peligros complejos",
            "Anticipa peligros potenciales",
            "Explica mecanismos de daño con claridad"
          ]
        }
      ],
      commonErrors: [
        "Confundir peligro con el daño en sí",
        "No mencionar el potencial o posibilidad",
        "Dar ejemplos domésticos en vez de laborales"
      ],
      hints: {
        level1: "Piensa en algo en tu trabajo que podría lastimar a alguien",
        level2: "Un peligro es una fuente o situación con potencial de causar daño",
        level3: "Peligro = cualquier cosa que puede causar daño. Ejemplo: piso mojado, máquina sin guarda"
      }
    }
  },
  {
    id: 2,
    title: "Clasificación de Peligros",
    description: "Habilidad para categorizar peligros según su naturaleza (físicos, químicos, ergonómicos, etc.)",
    minMastery: 0.65,
    weight: 1,
    rubric5: {
      levels: [
        {
          level: 1,
          name: "Inicial",
          criteria: [
            "No reconoce categorías de peligros",
            "Confunde tipos de peligros",
            "No puede clasificar ejemplos"
          ]
        },
        {
          level: 2,
          name: "Básico",
          criteria: [
            "Identifica tipo pero sin justificar",
            "Conoce algunas categorías básicas",
            "Clasificación inconsistente"
          ]
        },
        {
          level: 3,
          name: "Competente",
          criteria: [
            "Clasifica correctamente con justificación",
            "Usa terminología apropiada",
            "Identifica múltiples categorías"
          ]
        },
        {
          level: 4,
          name: "Avanzado",
          criteria: [
            "Clasifica con precisión técnica",
            "Reconoce peligros mixtos o complejos",
            "Justifica con criterios profesionales"
          ]
        },
        {
          level: 5,
          name: "Dominio",
          criteria: [
            "Aplica clasificación sistemática completa",
            "Identifica interacciones entre categorías",
            "Propone subclasificaciones útiles"
          ]
        }
      ],
      commonErrors: [
        "Confundir peligros físicos con mecánicos",
        "No diferenciar químicos de biológicos",
        "Ser demasiado general en la clasificación"
      ],
      hints: {
        level1: "Revisa las categorías: físico, químico, biológico, ergonómico, psicosocial",
        level2: "¿Es algo que puedes tocar (físico) o respirar (químico)?",
        level3: "El aceite derramado es un peligro físico - puede causar resbalones"
      }
    }
  },
  {
    id: 3,
    title: "Evaluación de Riesgos",
    description: "Competencia para evaluar riesgos usando probabilidad e impacto",
    minMastery: 0.75,
    weight: 1.5,  // más peso por ser competencia crítica
    rubric5: {
      levels: [
        {
          level: 1,
          name: "Inicial",
          criteria: [
            "No diferencia niveles de riesgo",
            "Evaluación sin fundamento",
            "No comprende P x I"
          ]
        },
        {
          level: 2,
          name: "Básico",
          criteria: [
            "Evalúa solo probabilidad O severidad",
            "Asigna niveles sin justificación clara",
            "Comprensión parcial del concepto"
          ]
        },
        {
          level: 3,
          name: "Competente",
          criteria: [
            "Evalúa probabilidad e impacto correctamente",
            "Justifica con factores observables",
            "Usa matriz de riesgo básica"
          ]
        },
        {
          level: 4,
          name: "Avanzado",
          criteria: [
            "Evaluación precisa con múltiples factores",
            "Considera exposición y vulnerabilidad",
            "Aplica criterios cuantitativos cuando es posible"
          ]
        },
        {
          level: 5,
          name: "Dominio",
          criteria: [
            "Evaluación integral considerando todos los factores",
            "Proyecta escenarios y consecuencias",
            "Propone métricas de seguimiento"
          ]
        }
      ],
      commonErrors: [
        "Evaluar todo como alto por precaución",
        "No considerar frecuencia de exposición",
        "Confundir probabilidad con severidad"
      ],
      hints: {
        level1: "Considera frecuencia de exposición y gravedad potencial",
        level2: "Probabilidad: ¿Diario, semanal, raro? Severidad: ¿Leve, grave, fatal?",
        level3: "Usa matriz: Probabilidad (1-3) x Severidad (1-3) = Riesgo"
      }
    }
  },
  {
    id: 4,
    title: "Aplicación de Controles",
    description: "Capacidad de proponer y priorizar controles según jerarquía",
    minMastery: 0.7,
    weight: 1.5,
    rubric5: {
      levels: [
        {
          level: 1,
          name: "Inicial",
          criteria: [
            "No propone controles viables",
            "Propuestas no relacionadas con riesgos",
            "Desconoce jerarquía de controles"
          ]
        },
        {
          level: 2,
          name: "Básico",
          criteria: [
            "Propone solo EPP",
            "Controles genéricos sin especificidad",
            "No sigue jerarquía"
          ]
        },
        {
          level: 3,
          name: "Competente",
          criteria: [
            "Propone controles siguiendo jerarquía",
            "Controles específicos y aplicables",
            "Considera factibilidad básica"
          ]
        },
        {
          level: 4,
          name: "Avanzado",
          criteria: [
            "Prioriza controles por efectividad",
            "Combina múltiples niveles de control",
            "Evalúa costo-beneficio"
          ]
        },
        {
          level: 5,
          name: "Dominio",
          criteria: [
            "Diseña sistema integral de controles",
            "Anticipa efectos secundarios",
            "Propone indicadores de efectividad"
          ]
        }
      ],
      commonErrors: [
        "Ir directo al EPP sin considerar eliminación/sustitución",
        "Solo proponer señalización",
        "No considerar mantenimiento de controles"
      ],
      hints: {
        level1: "Recuerda la jerarquía: Eliminar > Sustituir > Ingeniería > Administrativo > EPP",
        level2: "¿Puedes eliminar el peligro completamente? Si no, ¿sustituirlo?",
        level3: "Para solventes: ventilación (ingeniería), procedimientos (admin), guantes (EPP)"
      }
    }
  }
];

export const lesson01: LessonStructure = {
  id: 1,
  title: "IPERC Continuo — Identificación, Evaluación y Control",
  language: "es",
  description: "Aprende a identificar peligros, evaluar riesgos y aplicar controles en tu entorno laboral usando la metodología IPERC de manera continua.",
  learningObjectives: [
    "Identificar los diferentes tipos de peligros en el lugar de trabajo",
    "Evaluar los riesgos asociados a cada peligro identificado",
    "Implementar medidas de control efectivas para mitigar los riesgos",
    "Aplicar la metodología IPERC de manera continua en las operaciones"
  ],
  checkPoints: [
    "La identificación de peligros debe ser sistemática y continua",
    "La evaluación de riesgos considera probabilidad e impacto",
    "Las medidas de control siguen la jerarquía: eliminación, sustitución, controles de ingeniería, administrativos y EPP",
    "El IPERC es un proceso dinámico que requiere actualización constante"
  ],
  targets,  // Agregamos los targets definidos arriba
  moments: [
    {
      id: 0,
      title: "Indagación inicial",
      goal: "Activar conocimientos previos sobre peligro",
      primaryTargetId: 1,  // Target: Identificación de Peligros
      referenceQuestions: [
        "¿Alguna vez has escuchado sobre 'peligros'?",
        "¿Qué entiendes por peligro en tu área de trabajo?",
        "Dame un ejemplo real de un peligro"
      ],
      images: [{ id: 1, description: "Señal de resbalón", url: "/img/iperc/sign-slip.png" }],
      rubric: {
        correct: ["Define peligro como situación/fuente que puede causar daño", "Proporciona ejemplos concretos del área de trabajo", "Comprende el concepto de potencial de daño"],
        partial: ["Define peligro pero sin ejemplos específicos", "Definición correcta pero muy general"],
        incorrect: ["No logra definir qué es un peligro", "Confunde con otros conceptos de seguridad"],
        vague: ["Respuesta muy general sin definición clara", "Solo menciona 'es peligroso' sin explicar", "Responde con pregunta"],
        commonErrors: ["Confundir peligro con el daño en sí", "No mencionar el potencial o posibilidad", "Dar ejemplos domésticos en vez de laborales"],
        hints: {
          level1: "Piensa en algo en tu trabajo que podría lastimar a alguien",
          level2: "Un peligro es una fuente o situación con potencial de causar daño",
          level3: "Peligro = cualquier cosa (objeto, sustancia, condición) que puede causar daño. Ejemplo: piso mojado, máquina sin guarda."
        }
      }
    },
    {
      id: 1,
      title: "Tipos de peligros",
      goal: "Reconocer categorías (físicos, químicos, ergonómicos, etc.)",
      primaryTargetId: 2,  // Target: Clasificación de Peligros
      referenceQuestions: [
        "Clasifica: 'Derrame de aceite en pasillo'. ¿Qué tipo de peligro es y por qué?",
        "Cita 2 categorías presentes en tu área y ejemplifica."
      ],
      images: [{ id: 2, description: "Piso con aceite", url: "/img/iperc/oil-spill.jpg" }],
      rubric: {
        correct: ["Tipo + justificación", "Usa terminología apropiada", "Identifica múltiples categorías"],
        partial: ["Tipo sin justificar", "Identificación correcta sin términos técnicos"],
        incorrect: ["Tipo incorrecto", "Confunde categorías"],
        vague: ["Solo dice 'es peligroso'", "No especifica tipo", "Respuesta demasiado general"],
        commonErrors: ["Confundir peligros con consecuencias", "Ser demasiado general"],
        hints: {
          level1: "Revisa las categorías: físico, químico, biológico, ergonómico, psicosocial",
          level2: "¿Es algo que puedes tocar (físico) o respirar (químico)?",
          level3: "El aceite derramado es un peligro físico - puede causar resbalones"
        }
      }
    },
    {
      id: 2,
      title: "Evaluar riesgo (P x I)",
      goal: "Asignar Probabilidad e Impacto cualitativos con justificación",
      primaryTargetId: 3,  // Target: Evaluación de Riesgos
      referenceQuestions: [
        "Para 'ruido continuo de 90 dB', asigna P/I (Bajo/Medio/Alto) y justifica.",
        "Si la exposición es diaria y sin protección, ¿cómo cambian P e I?"
      ],
      rubric: {
        correct: ["Evalúa probabilidad correctamente", "Considera severidad del daño", "Justifica con factores observables"],
        partial: ["Evalúa solo probabilidad O severidad", "Evaluación sin justificación clara"],
        incorrect: ["No diferencia niveles de riesgo", "Evaluación sin fundamento"],
        vague: ["Solo dice 'es riesgoso'", "No asigna niveles", "Respuesta sin especificar P o I"],
        commonErrors: ["Evaluar todo como alto por precaución", "No considerar frecuencia de exposición"],
        hints: {
          level1: "Considera frecuencia de exposición y gravedad potencial",
          level2: "Probabilidad: ¿Diario, semanal, raro? Severidad: ¿Leve, grave, fatal?",
          level3: "Usa matriz: Probabilidad (1-3) x Severidad (1-3) = Riesgo"
        }
      }
    },
    {
      id: 3,
      title: "Jerarquía de controles",
      goal: "Elegir controles adecuados según la jerarquía",
      primaryTargetId: 4,  // Target: Aplicación de Controles
      referenceQuestions: [
        "Para 'exposición a solventes volátiles', propone 2 controles y ubícalos en la jerarquía."
      ],
      rubric: {
        correct: ["Propone controles siguiendo jerarquía", "Controles específicos y aplicables"],
        partial: ["Controles válidos pero solo EPP", "Sin seguir jerarquía"],
        incorrect: ["No propone controles viables", "Propuestas no relacionadas con riesgos"],
        commonErrors: ["Ir directo al EPP sin considerar eliminación/sustitución", "Solo proponer señalización"],
        hints: {
          level1: "Recuerda la jerarquía: Eliminar > Sustituir > Ingeniería > Administrativo > EPP",
          level2: "¿Se puede eliminar el peligro? ¿Sustituir por algo menos peligroso?",
          level3: "Para solventes: ventilación (ingeniería), procedimientos (admin), respirador (EPP)"
        }
      }
    },
    {
      id: 4,
      title: "Checkpoint IPERC",
      goal: "Completar ciclo: peligro → riesgo → controles",
      primaryTargetId: 3,  // Target: Evaluación de Riesgos (integración)
      referenceQuestions: [
        "Caso: 'Manipulación de cargas'. Identifica peligro, evalúa P/I y propone controles por jerarquía."
      ],
      rubric: {
        correct: ["Completa ciclo IPERC correctamente", "Integra identificación-evaluación-control"],
        partial: ["Completa parcialmente el ciclo", "Falta algún componente"],
        incorrect: ["No logra integrar los conceptos", "Confunde pasos del proceso"],
        commonErrors: ["Saltar directamente a controles sin evaluar", "No conectar peligro con riesgo"],
        hints: {
          level1: "Sigue el orden: 1) Identifica peligro, 2) Evalúa P x I, 3) Propón controles",
          level2: "Para cargas: ¿Qué puede dañar? ¿Qué tan probable/grave? ¿Cómo controlarlo?",
          level3: "Peligro: sobreesfuerzo. Riesgo: Alto (diario x lesión). Control: ayuda mecánica"
        }
      }
    }
  ]
};