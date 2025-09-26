/**
 * Analytics pedagógicos y personalización de feedback
 */

import { getMomentRubric } from './moment-rubrics';
import type { ResponseTag } from '@prisma/client';

/**
 * Analiza el historial del estudiante para personalizar el feedback
 */
export interface StudentProfile {
  strengthAreas: string[];
  weaknessAreas: string[];
  learningStyle: 'visual' | 'kinesthetic' | 'auditory' | 'mixed';
  preferredPace: 'slow' | 'moderate' | 'fast';
  needsEncouragement: boolean;
}

/**
 * Obtiene el perfil del estudiante basado en su historial
 */
export function analyzeStudentProfile(
  sessionHistory: {
    tags: ResponseTag[];
    isCorrect: boolean;
    momentId: number;
    masteryDelta: number;
  }[]
): StudentProfile {
  // Análisis de fortalezas y debilidades
  const momentPerformance: Record<number, { correct: number; total: number }> = {};

  sessionHistory.forEach(response => {
    if (!momentPerformance[response.momentId]) {
      momentPerformance[response.momentId] = { correct: 0, total: 0 };
    }
    momentPerformance[response.momentId].total++;
    if (response.isCorrect) {
      momentPerformance[response.momentId].correct++;
    }
  });

  const strengthAreas: string[] = [];
  const weaknessAreas: string[] = [];

  Object.entries(momentPerformance).forEach(([momentId, perf]) => {
    const accuracy = perf.correct / perf.total;
    const momentName = getMomentName(parseInt(momentId));

    if (accuracy >= 0.7) {
      strengthAreas.push(momentName);
    } else if (accuracy < 0.4) {
      weaknessAreas.push(momentName);
    }
  });

  // Análisis del ritmo de aprendizaje
  const avgMasteryDelta = sessionHistory.reduce((sum, r) => sum + r.masteryDelta, 0) / sessionHistory.length;
  const preferredPace = avgMasteryDelta > 0.1 ? 'fast' :
                        avgMasteryDelta > 0 ? 'moderate' : 'slow';

  // Detectar necesidad de aliento
  const recentFailures = sessionHistory.slice(-5).filter(r => !r.isCorrect).length;
  const needsEncouragement = recentFailures >= 3;

  // Por ahora asumimos estilo mixto (puede expandirse con más análisis)
  const learningStyle = 'mixed';

  return {
    strengthAreas,
    weaknessAreas,
    learningStyle,
    preferredPace,
    needsEncouragement
  };
}

/**
 * Genera recomendaciones pedagógicas basadas en el perfil
 */
export function generatePedagogicalRecommendations(
  profile: StudentProfile,
  currentMomentId: number,
  currentPerformance: 'correct' | 'partial' | 'incorrect'
): {
  feedbackTone: 'encouraging' | 'neutral' | 'challenging';
  hintLevel: 1 | 2 | 3;
  includeExample: boolean;
  suggestReview: boolean;
} {
  const feedbackTone = profile.needsEncouragement ? 'encouraging' :
                       profile.preferredPace === 'fast' ? 'challenging' : 'neutral';

  const hintLevel = currentPerformance === 'correct' ? 1 :
                    currentPerformance === 'partial' ? 2 :
                    profile.preferredPace === 'slow' ? 3 : 2;

  const includeExample = profile.preferredPace === 'slow' ||
                         currentPerformance === 'incorrect';

  const momentName = getMomentName(currentMomentId);
  const suggestReview = profile.weaknessAreas.includes(momentName) &&
                       currentPerformance !== 'correct';

  return {
    feedbackTone,
    hintLevel: hintLevel as 1 | 2 | 3,
    includeExample,
    suggestReview
  };
}

/**
 * Personaliza el mensaje de feedback basado en el perfil y desempeño
 */
export function personalizeFeedback(
  baseMessage: string,
  profile: StudentProfile,
  recommendations: ReturnType<typeof generatePedagogicalRecommendations>
): string {
  let personalizedMessage = baseMessage;

  // Agregar tono de aliento si es necesario
  if (recommendations.feedbackTone === 'encouraging' && profile.needsEncouragement) {
    const encouragements = [
      "No te desanimes, vas mejorando. ",
      "Sigue así, cada intento cuenta. ",
      "Buen esfuerzo, sigamos trabajando. ",
      "Estás progresando, no te rindas. "
    ];
    personalizedMessage = encouragements[Math.floor(Math.random() * encouragements.length)] + personalizedMessage;
  }

  // Ajustar para ritmo rápido
  if (profile.preferredPace === 'fast' && recommendations.feedbackTone === 'challenging') {
    const challenges = [
      " ¿Puedes profundizar más?",
      " ¿Qué más podrías agregar?",
      " Llevémoslo al siguiente nivel.",
      " Excelente, ahora un reto mayor."
    ];
    personalizedMessage += challenges[Math.floor(Math.random() * challenges.length)];
  }

  // Sugerir revisión si es necesario
  if (recommendations.suggestReview) {
    personalizedMessage += " Revisemos este concepto una vez más para consolidarlo.";
  }

  return personalizedMessage;
}

/**
 * Helper para obtener el nombre del momento
 */
function getMomentName(momentId: number): string {
  const momentNames: Record<number, string> = {
    0: "Identificación de peligros",
    1: "Evaluación de riesgos",
    2: "Establecimiento de controles",
    3: "Síntesis IPERC"
  };
  return momentNames[momentId] || `Momento ${momentId}`;
}

/**
 * Calcula métricas de sesión para el debug log
 */
export function calculateSessionMetrics(
  sessionHistory: any[]
): {
  overallAccuracy: number;
  avgResponseTime?: number;
  strongestMoment: string;
  weakestMoment: string;
  learningVelocity: number;
} {
  if (!sessionHistory.length) {
    return {
      overallAccuracy: 0,
      strongestMoment: 'N/A',
      weakestMoment: 'N/A',
      learningVelocity: 0
    };
  }

  const correctCount = sessionHistory.filter(r => r.isCorrect).length;
  const overallAccuracy = correctCount / sessionHistory.length;

  // Calcular momento más fuerte y más débil
  const momentStats: Record<number, { correct: number; total: number }> = {};
  sessionHistory.forEach(response => {
    const mid = response.momentId;
    if (!momentStats[mid]) momentStats[mid] = { correct: 0, total: 0 };
    momentStats[mid].total++;
    if (response.isCorrect) momentStats[mid].correct++;
  });

  let strongestMoment = 'N/A';
  let weakestMoment = 'N/A';
  let highestAccuracy = 0;
  let lowestAccuracy = 1;

  Object.entries(momentStats).forEach(([mid, stats]) => {
    const acc = stats.correct / stats.total;
    if (acc > highestAccuracy) {
      highestAccuracy = acc;
      strongestMoment = getMomentName(parseInt(mid));
    }
    if (acc < lowestAccuracy) {
      lowestAccuracy = acc;
      weakestMoment = getMomentName(parseInt(mid));
    }
  });

  // Calcular velocidad de aprendizaje (cambio promedio en mastery)
  const masteryDeltas = sessionHistory.map(r => r.masteryDelta || 0);
  const learningVelocity = masteryDeltas.reduce((a, b) => a + b, 0) / masteryDeltas.length;

  return {
    overallAccuracy,
    strongestMoment,
    weakestMoment,
    learningVelocity
  };
}