/**
 * Mapeo entre niveles de rúbrica (1-5) y salidas de IA
 * Asegura consistencia entre evaluación y progreso
 */

import type { ResponseTag } from '@prisma/client';

export interface LevelMapping {
  level: number;
  name: string;
  tags: ResponseTag[];
  masteryDeltaRange: { min: number; max: number };
  description: string;
}

// Tabla de mapeo nivel → salida
export const levelMappings: LevelMapping[] = [
  {
    level: 5,
    name: "Dominio",
    tags: ["CORRECT"],
    masteryDeltaRange: { min: 0.25, max: 0.30 },
    description: "Comprensión completa y aplicación avanzada"
  },
  {
    level: 4,
    name: "Avanzado",
    tags: ["CORRECT"],
    masteryDeltaRange: { min: 0.15, max: 0.20 },
    description: "Comprensión sólida con aplicación correcta"
  },
  {
    level: 3,
    name: "Competente",
    tags: ["PARTIAL", "CORRECT"], // Puede ser PARTIAL o CORRECT
    masteryDeltaRange: { min: 0.05, max: 0.15 },
    description: "Comprensión adecuada con algunos gaps menores"
  },
  {
    level: 2,
    name: "Básico",
    tags: ["PARTIAL"],
    masteryDeltaRange: { min: -0.05, max: 0.05 },
    description: "Comprensión limitada, necesita refuerzo"
  },
  {
    level: 1,
    name: "Inicial",
    tags: ["INCORRECT", "NEEDS_HELP", "CONCEPTUAL"],
    masteryDeltaRange: { min: -0.20, max: -0.10 },
    description: "Comprensión insuficiente, requiere apoyo significativo"
  }
];

/**
 * Determina el nivel basado en el mastery actual (0-1)
 */
export function masteryToLevel(mastery: number): number {
  if (mastery < 0.2) return 1;  // Inicial
  if (mastery < 0.4) return 2;  // Básico
  if (mastery < 0.65) return 3; // Competente
  if (mastery < 0.85) return 4; // Avanzado
  return 5;  // Dominio
}

/**
 * Obtiene el mapping para un nivel específico
 */
export function getLevelMapping(level: number): LevelMapping | undefined {
  return levelMappings.find(m => m.level === level);
}

/**
 * Valida si los tags y masteryDelta son consistentes con el nivel
 * Retorna el masteryDelta corregido si es necesario
 */
export function validateAndCorrectMasteryDelta(
  level: number,
  tags: ResponseTag[],
  masteryDelta: number
): { isValid: boolean; correctedDelta: number; reason?: string } {
  const mapping = getLevelMapping(level);

  if (!mapping) {
    return {
      isValid: false,
      correctedDelta: 0,
      reason: `Nivel ${level} no válido`
    };
  }

  // Verificar si algún tag coincide con los esperados para el nivel
  const hasValidTag = tags.some(tag => mapping.tags.includes(tag));

  if (!hasValidTag) {
    return {
      isValid: false,
      correctedDelta: mapping.masteryDeltaRange.min,
      reason: `Tags ${tags.join(',')} no coinciden con nivel ${level}`
    };
  }

  // Verificar si masteryDelta está en el rango esperado
  const { min, max } = mapping.masteryDeltaRange;

  if (masteryDelta < min || masteryDelta > max) {
    // Corregir al valor más cercano dentro del rango
    const corrected = Math.max(min, Math.min(max, masteryDelta));
    return {
      isValid: false,
      correctedDelta: corrected,
      reason: `Delta ${masteryDelta} fuera de rango [${min}, ${max}] para nivel ${level}`
    };
  }

  return {
    isValid: true,
    correctedDelta: masteryDelta
  };
}

/**
 * Infiere el nivel basado en tags y masteryDelta
 * Útil para validación server-side
 */
export function inferLevelFromOutput(
  tags: ResponseTag[],
  masteryDelta: number
): number {
  // Buscar el nivel que mejor coincida con tags y delta
  for (const mapping of levelMappings) {
    const hasMatchingTag = tags.some(tag => mapping.tags.includes(tag));
    const deltaInRange = masteryDelta >= mapping.masteryDeltaRange.min &&
                         masteryDelta <= mapping.masteryDeltaRange.max;

    if (hasMatchingTag && deltaInRange) {
      return mapping.level;
    }
  }

  // Si no hay coincidencia exacta, usar masteryDelta como guía
  if (masteryDelta >= 0.25) return 5;
  if (masteryDelta >= 0.15) return 4;
  if (masteryDelta >= 0.05) return 3;
  if (masteryDelta >= -0.05) return 2;
  return 1;
}

/**
 * Calcula el mastery global ponderado
 * @param targetMasteries Mapa de targetId → mastery (0-1)
 * @param targetWeights Mapa de targetId → weight (default 1)
 */
export function calculateGlobalMastery(
  targetMasteries: Record<number, number>,
  targetWeights: Record<number, number> = {}
): number {
  const targetIds = Object.keys(targetMasteries).map(Number);

  if (targetIds.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const targetId of targetIds) {
    const mastery = targetMasteries[targetId] || 0;
    const weight = targetWeights[targetId] || 1;

    weightedSum += mastery * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Clamp de valores entre min y max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}