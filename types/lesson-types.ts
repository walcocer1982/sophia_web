export interface LessonImage {
  id: number;
  description: string;
  url: string;
  mustUse?: boolean; // si true, el modelo debe referenciarla/usar la info
}

export interface LessonMoment {
  id: number; // entero (0,1,2,...)
  title: string;
  goal: string; // 1 línea, resultado esperado
  referenceQuestions: string[]; // ideas de preguntas; el server elige 1 por turno
  images?: LessonImage[];       // opcional
  rubric?: {
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
  moments: LessonMoment[];        // lineal, moment.id = number
}