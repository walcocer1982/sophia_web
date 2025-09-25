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
      goal: "Activar conocimientos previos sobre peligro y riesgo",
      referenceQuestions: [
        "¿Qué entiendes por peligro y por riesgo en tu área de trabajo?",
        "Dame un ejemplo real y separa: peligro vs riesgo."
      ],
      images: [{ id: 1, description: "Señal de resbalón", url: "/img/iperc/sign-slip.png" }],
      rubric: { correct: ["Diferencia peligro vs riesgo"], partial: ["Define uno"], incorrect: ["Los confunde"] }
    },
    {
      id: 1,
      title: "Tipos de peligros",
      goal: "Reconocer categorías (físicos, químicos, ergonómicos, etc.)",
      referenceQuestions: [
        "Clasifica: ‘Derrame de aceite en pasillo’. ¿Qué tipo de peligro es y por qué?",
        "Cita 2 categorías presentes en tu área y ejemplifica."
      ],
      images: [{ id: 2, description: "Piso con aceite", url: "/img/iperc/oil-spill.jpg" }],
      rubric: { correct: ["Tipo + justificación"], partial: ["Tipo sin justificar"], incorrect: ["Tipo incorrecto"] }
    },
    {
      id: 2,
      title: "Evaluar riesgo (P x I)",
      goal: "Asignar Probabilidad e Impacto cualitativos con justificación",
      referenceQuestions: [
        "Para ‘ruido continuo de 90 dB’, asigna P/I (Bajo/Medio/Alto) y justifica.",
        "Si la exposición es diaria y sin protección, ¿cómo cambian P e I?"
      ]
    },
    {
      id: 3,
      title: "Jerarquía de controles",
      goal: "Elegir controles adecuados según la jerarquía",
      referenceQuestions: [
        "Para ‘exposición a solventes volátiles’, propone 2 controles y ubícalos en la jerarquía."
      ]
    },
    {
      id: 4,
      title: "Checkpoint IPERC",
      goal: "Completar ciclo: peligro → riesgo → controles",
      referenceQuestions: [
        "Caso: ‘Manipulación de cargas’. Identifica peligro, evalúa P/I y propone controles por jerarquía."
      ]
    }
  ]
};
