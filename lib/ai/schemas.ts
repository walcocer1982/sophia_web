/**
 * Schema de respuesta de IA con validación Zod
 * Contrato estricto para OpenAI Structured Outputs
 */

import { z } from 'zod';

// Enums para validación (matching Prisma schema)
export const ResponseTagEnum = z.enum([
  'CORRECT',
  'PARTIAL',
  'INCORRECT',
  'CONCEPTUAL',
  'COMPUTATIONAL',
  'NEEDS_HELP',
  'SHOWING_MASTERY'
]);

export const NextStepEnum = z.enum([
  'ADVANCE',
  'REINFORCE',
  'RETRY',
  'COMPLETE'
]);

export const DifficultyEnum = z.enum([
  'EASY',
  'MEDIUM',
  'HARD'
]);

// Schema principal de respuesta IA
export const LessonAIResponse = z.object({
  chat: z.object({
    message: z.string()
      .min(10, 'Message must be at least 10 characters')
      .max(500, 'Message must be less than 500 characters'),
    hints: z.array(z.string().max(100))
      .optional()
      .describe('Optional hints for student guidance')
  }),

  progress: z.object({
    masteryDelta: z.number()
      .min(-0.3)
      .max(0.3)
      .describe('Change in mastery level (-0.3 to 0.3)'),
    nextStep: NextStepEnum,
    tags: z.array(ResponseTagEnum)
      .min(1, 'At least one tag required')
      .max(3, 'Maximum 3 tags')
  }),

  analytics: z.object({
    difficulty: DifficultyEnum.optional(),
    confidenceScore: z.number()
      .min(0)
      .max(1)
      .optional()
      .describe('Confidence in evaluation (0-1)'),
    reasoningSignals: z.array(z.string().max(50))
      .optional()
      .describe('Key reasoning indicators observed')
  }).optional()
});

// Type inference
export type LessonAIResponseT = z.infer<typeof LessonAIResponse>;

// JSON Schema para OpenAI (structured output format)
export const LessonAIResponseJSONSchema = {
  type: "object",
  properties: {
    chat: {
      type: "object",
      properties: {
        message: { type: "string", minLength: 10, maxLength: 500 },
        hints: {
          type: "array",
          items: { type: "string", maxLength: 100 },
          maxItems: 3
        }
      },
      required: ["message", "hints"],
      additionalProperties: false
    },
    progress: {
      type: "object",
      properties: {
        masteryDelta: { type: "number", minimum: -0.3, maximum: 0.3 },
        nextStep: {
          type: "string",
          enum: ["ADVANCE", "REINFORCE", "RETRY", "COMPLETE"]
        },
        tags: {
          type: "array",
          items: {
            type: "string",
            enum: ["CORRECT", "PARTIAL", "INCORRECT", "CONCEPTUAL", "COMPUTATIONAL", "NEEDS_HELP", "SHOWING_MASTERY"]
          },
          minItems: 1,
          maxItems: 3
        }
      },
      required: ["masteryDelta", "nextStep", "tags"],
      additionalProperties: false
    },
    analytics: {
      type: "object",
      properties: {
        difficulty: {
          type: "string",
          enum: ["EASY", "MEDIUM", "HARD"]
        },
        confidenceScore: {
          type: "number",
          minimum: 0,
          maximum: 1
        },
        reasoningSignals: {
          type: "array",
          items: { type: "string", maxLength: 50 },
          maxItems: 5
        }
      },
      required: ["difficulty", "confidenceScore", "reasoningSignals"],
      additionalProperties: false
    }
  },
  required: ["chat", "progress", "analytics"],
  additionalProperties: false
} as const;

// Validation helpers
export function validateAIResponse(data: unknown): LessonAIResponseT {
  return LessonAIResponse.parse(data);
}

export function safeValidateAIResponse(data: unknown):
  | { success: true; data: LessonAIResponseT }
  | { success: false; error: z.ZodError } {
  const result = LessonAIResponse.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}