/**
 * AI Providers - Adaptadores para diferentes servicios de IA
 * Implementa el patrón adapter para abstraer proveedores
 */

import OpenAI from 'openai';
import { LessonAIResponseJSONSchema } from './schemas';
import { SOPHIA_SYSTEM_PROMPT } from './system-prompt';

// ========== SECTION 1: INTERFACES ==========

/**
 * Interface común para todos los proveedores de IA
 */
export interface AIProvider {
  name: string;
  call(prompt: string, userMessage: string): Promise<string>;
  validateConfig(): boolean;
  estimateCost?(tokens: number): number;
}

/**
 * Configuración para proveedores
 */
export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ========== SECTION 2: OPENAI PROVIDER ==========

/**
 * Proveedor OpenAI con structured outputs
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ProviderConfig = {}) {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key no configurada');
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model || 'gpt-4o-mini';
    this.temperature = config.temperature ?? 0.6;
    this.maxTokens = config.maxTokens || 600;
  }

  async call(prompt: string, userMessage: string): Promise<string> {
    try {
      // Combinar prompt del sistema con el contexto
      const fullPrompt = `${prompt}\n\nRespuesta del estudiante actual:\n${userMessage}`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SOPHIA_SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'lesson_ai_response',
            strict: true,
            schema: LessonAIResponseJSONSchema
          }
        } as Parameters<typeof this.client.chat.completions.create>[0]['response_format'],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Respuesta vacía de OpenAI');
      }

      return content;
    } catch (error) {
      console.error('[OpenAIProvider] Error:', error);
      throw new Error(`Error llamando a OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateConfig(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  estimateCost(tokens: number): number {
    // Precios aproximados para gpt-4o-mini (Enero 2025)
    // Input: $0.15 per 1M tokens
    // Output: $0.60 per 1M tokens
    // Asumimos 70% input, 30% output como promedio
    const inputCost = (tokens * 0.7) * 0.00000015;
    const outputCost = (tokens * 0.3) * 0.00000060;
    return inputCost + outputCost;
  }
}

// ========== SECTION 3: VERCEL AI PROVIDER (STUB) ==========

/**
 * Proveedor Vercel AI SDK (stub para futura implementación)
 */
export class VercelAIProvider implements AIProvider {
  name = 'vercel';

  constructor(_config: ProviderConfig = {}) {
    // Configuración futura
  }

  async call(_prompt: string, _userMessage: string): Promise<string> {
    throw new Error(
      'VercelAIProvider no implementado aún. ' +
      'Para implementar: npm install ai @ai-sdk/openai y configurar según docs de Vercel AI SDK v3'
    );
  }

  validateConfig(): boolean {
    // Verificar configuración cuando se implemente
    return false;
  }

  estimateCost(_tokens: number): number {
    // Costos dependerán del modelo usado con Vercel
    return 0;
  }
}

// ========== SECTION 4: ANTHROPIC PROVIDER (STUB) ==========

/**
 * Proveedor Anthropic Claude (stub para futura implementación)
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  constructor(_config: ProviderConfig = {}) {
    // Configuración futura
  }

  async call(_prompt: string, _userMessage: string): Promise<string> {
    throw new Error(
      'AnthropicProvider no implementado aún. ' +
      'Para implementar: npm install @anthropic-ai/sdk y usar Claude 3 Haiku para costos bajos'
    );
  }

  validateConfig(): boolean {
    return false;
  }

  estimateCost(_tokens: number): number {
    // Claude 3 Haiku: ~$0.25/$1.25 per 1M tokens (input/output)
    return 0;
  }
}

// ========== SECTION 5: MOCK PROVIDER (PARA TESTS) ==========

/**
 * Proveedor Mock para testing sin llamadas reales
 */
export class MockProvider implements AIProvider {
  name = 'mock';
  private mockResponse: string;

  constructor(config: ProviderConfig & { mockResponse?: string } = {}) {
    this.mockResponse = config.mockResponse || JSON.stringify({
      turnIntent: 'ANSWER',
      chat: {
        message: 'Mock response: Tu respuesta ha sido evaluada.',
        hints: ['Mock hint 1', 'Mock hint 2']
      },
      progress: {
        masteryDelta: 0.1,
        nextStep: 'ADVANCE',
        tags: ['CORRECT']
      },
      analytics: {
        difficulty: 'MEDIUM',
        reasoningSignals: ['Mock signal']
      }
    });
  }

  async call(_prompt: string, _userMessage: string): Promise<string> {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockResponse;
  }

  validateConfig(): boolean {
    return true;
  }

  estimateCost(): number {
    return 0;
  }
}

// ========== SECTION 6: PROVIDER FACTORY ==========

/**
 * Factory para crear instancias de proveedores
 */
export function createProvider(
  providerName: string = 'openai',
  config?: ProviderConfig
): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(config);

    case 'vercel':
      return new VercelAIProvider(config);

    case 'anthropic':
      return new AnthropicProvider(config);

    case 'mock':
      return new MockProvider(config);

    default:
      console.warn(`Provider "${providerName}" no reconocido, usando OpenAI por defecto`);
      return new OpenAIProvider(config);
  }
}

/**
 * Obtiene el proveedor configurado por defecto
 */
export function getDefaultProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER || 'openai';
  return createProvider(providerName);
}