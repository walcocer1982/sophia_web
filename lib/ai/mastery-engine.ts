/**
 * Mastery Engine - Cálculos y validación de dominio/maestría
 */

import { clamp } from './mapping';
import type { ResponseTag } from '@prisma/client';

/**
 * Calcula el mastery global ponderado
 */
export function calculateGlobalMastery(
  targetMasteries: Record<number, number>,
  targetWeights: Record<number, number>
): number {
  const entries = Object.entries(targetMasteries);
  if (entries.length === 0) return 0.3;

  let totalWeightedMastery = 0;
  let totalWeight = 0;

  entries.forEach(([targetId, mastery]) => {
    const weight = targetWeights[parseInt(targetId)] || 1;
    totalWeightedMastery += mastery * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? totalWeightedMastery / totalWeight : 0.3;
}

/**
 * Actualiza el mastery de un target específico
 */
export function updateTargetMastery(
  currentMastery: number,
  masteryDelta: number
): number {
  return clamp(currentMastery + masteryDelta, 0, 1);
}

/**
 * Determina si un target está completado
 */
export function isTargetComplete(
  mastery: number,
  minMastery: number
): boolean {
  return mastery >= minMastery;
}

/**
 * Calcula el número de respuestas consecutivas correctas
 */
export function updateConsecutiveCorrect(
  currentConsecutive: number,
  tags: ResponseTag[]
): number {
  const isCorrect = tags.includes('CORRECT' as ResponseTag);
  return isCorrect ? currentConsecutive + 1 : 0;
}