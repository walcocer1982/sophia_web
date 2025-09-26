import type { LessonStructure } from "@/types/lesson-types";

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
  moments: [
    {
      id: 0,
      title: "Indagación inicial",
      goal: "Activar conocimientos previos sobre peligro",
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