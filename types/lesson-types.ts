export interface LessonImage {
  id: number;
  description: string;
  url: string;
  mustUse?: boolean; // si true, el modelo debe referenciarla/usar la info
}

// Rúbrica de 5 niveles para evaluación granular
export interface Rubric5Level {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;  // ej: "Inicial", "Básico", "Competente", "Avanzado", "Dominio"
  criteria: string[];  // criterios observables para este nivel
}

// Target: unidad real de evaluación (competencia/habilidad específica)
export interface LessonTarget {
  id: number;
  title: string;
  description: string;
  minMastery: number;  // umbral para considerar el target logrado (0.0-1.0)
  weight?: number;     // peso relativo para cálculo de masteryGlobal (default: 1)
  rubric5: {
    levels: Rubric5Level[];  // exactamente 5 niveles
    commonErrors: string[];   // errores típicos en este target
    hints: {
      level1?: string;  // pista sutil
      level2?: string;  // pista directa
      level3?: string;  // pista explícita
    };
  };
  referencePrompts?: string[];  // prompts de ejemplo para evaluar este target
}

export interface LessonMoment {
  id: number; // entero (0,1,2,...)
  title: string;
  goal: string; // 1 línea, resultado esperado
  primaryTargetId: number;  // ID del target que este momento evalúa
  referenceQuestions: string[]; // ideas de preguntas; el server elige 1 por turno
  images?: LessonImage[];       // opcional
  rubric?: {  // DEPRECATED: usar target.rubric5 en su lugar
    correct: string[];
    partial?: string[];
    incorrect?: string[];
    vague?: string[];         // respuestas ambiguas que necesitan clarificación
    commonErrors?: string[];  // errores típicos a detectar
    hints?: {                 // pistas graduales opcionales
      level1?: string;        // sutil
      level2?: string;        // directo
      level3?: string;        // explícito
    };
  }; // opcional, útil para feedback
}

export interface LessonStructure {
  id: number;
  title: string;                // visible en UI (tarjeta, detalles de la clase)
  description: string;          // visible en UI (tarjeta, detalles de la clase)
  language: "es"|"en";
  learningObjectives: string[];   // visible en UI (detalles de la clase)
  checkPoints: string[];          // SOLO para IA (no mostrar al estudiante)
  targets: LessonTarget[];        // targets de evaluación (competencias a desarrollar)
  moments: LessonMoment[];        // lineal, moment.id = number
}