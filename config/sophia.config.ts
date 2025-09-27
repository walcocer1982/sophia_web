/**
 * Configuración centralizada de SOPHIA
 */

export const SOPHIA_CONFIG = {
  // Modelo de OpenAI
  model: 'gpt-4o-mini' as const,

  // Parámetros del modelo
  temperature: 0.3,
  maxTokens: 1000,

  // Límites de sesión
  limits: {
    maxAttemptsPerMoment: 3,
    sessionTimeoutMinutes: 30,
    maxClarifyTurns: 5
  },

  // Valores iniciales
  defaults: {
    initialMastery: 0.3,
    masteryThreshold: 0.7,
    minMasteryForAdvance: 0.6
  },

  // Configuración de evaluación
  evaluation: {
    correctBonus: 0.15,
    partialBonus: 0.05,
    incorrectPenalty: -0.10,
    clarifyDelta: 0
  }
} as const;