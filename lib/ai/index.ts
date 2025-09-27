/**
 * AI Module Facade - Punto de entrada público para el módulo de IA
 * Orquesta la lógica del dominio con los proveedores
 */

import {
  composePrompt,
  validate,
  distillSummary,
  calculateMasteryDelta,
  type PromptSlots,
  type TurnResult
} from './core';

import {
  getDefaultProvider,
  createProvider,
  type AIProvider,
  type ProviderConfig
} from './providers';

import type { LessonAIResponseT } from './schemas';

// ========== SECTION 1: PROVIDER MANAGEMENT ==========

/**
 * Cache del provider actual para evitar recrearlo en cada llamada
 */
let currentProvider: AIProvider | null = null;

/**
 * Obtiene o crea el provider activo
 */
function getActiveProvider(): AIProvider {
  if (!currentProvider) {
    currentProvider = getDefaultProvider();

    // Validar configuración del provider
    if (!currentProvider.validateConfig()) {
      throw new Error(`Provider "${currentProvider.name}" no está correctamente configurado`);
    }
  }

  return currentProvider;
}

/**
 * Cambia el provider activo (útil para testing o A/B)
 */
export function switchProvider(providerName: string, config?: ProviderConfig): void {
  currentProvider = createProvider(providerName, config);
}

// ========== SECTION 2: PUBLIC API ==========

/**
 * Llama a la IA con el prompt compuesto
 * Punto de entrada principal para obtener respuesta de IA
 */
export async function callAI(
  prompt: string,
  userMessage: string
): Promise<string> {
  const provider = getActiveProvider();

  try {

    const response = await provider.call(prompt, userMessage);

    return response;
  } catch (error) {
    console.error(`[AI Module] Error with provider ${provider.name}:`, error);
    throw error;
  }
}

/**
 * Procesa un turno completo de conversación
 * Orquesta: composición → llamada → validación → destilación
 */
export async function processTurn(
  slots: PromptSlots,
  previousSummary?: string
): Promise<TurnResult> {
  // 1. Componer prompt
  const prompt = composePrompt(slots);
  const tokensEstimate = Math.ceil(prompt.length / 3);

  // 2. Llamar a la IA
  const aiResponseJson = await callAI(prompt, slots.studentAnswer);

  // 3. Validar respuesta
  const aiResponse = validate(JSON.parse(aiResponseJson));
  if (!aiResponse) {
    throw new Error('Respuesta de IA no válida según schema');
  }

  // 4. Destilar nuevo resumen
  const evaluation = aiResponse.progress.tags.includes('CORRECT') ? 'Correcto' :
                     aiResponse.progress.tags.includes('PARTIAL') ? 'Parcialmente correcto' :
                     'Incorrecto';

  const newSummary = distillSummary(previousSummary, {
    question: slots.questionShown,
    answer: slots.studentAnswer,
    evaluation
  });

  return {
    aiResponse,
    newSummary,
    promptUsed: prompt,
    tokensEstimate
  };
}

/**
 * Obtiene métricas del provider actual
 */
export function getProviderMetrics(): {
  name: string;
  isConfigured: boolean;
  estimatedCostPerTurn?: number;
} {
  const provider = getActiveProvider();

  return {
    name: provider.name,
    isConfigured: provider.validateConfig(),
    estimatedCostPerTurn: provider.estimateCost ? provider.estimateCost(1200) : undefined
  };
}

// ========== SECTION 3: RE-EXPORTS ==========

// Re-exportar funciones de utilidad del core
export {
  composePrompt,
  validate,
  distillSummary,
  calculateMasteryDelta
};

// Re-exportar tipos necesarios
export type {
  PromptSlots,
  TurnResult,
  LessonAIResponseT
};

// Re-exportar utilidades de providers si necesario
export {
  createProvider,
  type AIProvider,
  type ProviderConfig
} from './providers';