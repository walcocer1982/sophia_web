'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { validateAIResponse, safeValidateAIResponse, LessonAIResponseT } from '@/lib/ai/schemas';
import { buildTurnPayload } from '@/lib/ai/build-context';
import { lesson01 } from '@/data_lessons/lesson01';

export default function TestHito1Page() {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [context, setContext] = useState('');
  const [validationResult, setValidationResult] = useState<string>('');
  const [parsedResponse, setParsedResponse] = useState<LessonAIResponseT | null>(null);

  // Mock de una respuesta de IA para probar validación
  const mockAIResponse = {
    chat: {
      message: "Excelente observación. Has identificado correctamente el peligro de caída. ¿Qué medidas de control propondrías?",
      hints: ["Piensa en EPP", "Considera barreras físicas"]
    },
    progress: {
      masteryDelta: 0.15,
      nextStep: "ADVANCE",
      tags: ["CORRECT", "CONCEPTUAL"]
    },
    analytics: {
      difficulty: "MEDIUM",
      confidenceScore: 0.85,
      reasoningSignals: ["identifica_peligro", "usa_terminologia_correcta"]
    }
  };

  // Respuesta inválida para probar validación
  const invalidResponse = {
    chat: {
      message: "OK", // Muy corto, debe ser min 10 chars
      hints: ["hint1", "hint2", "hint3", "hint4"] // Máximo 3 permitidos
    },
    progress: {
      masteryDelta: 0.5, // Fuera de rango (-0.3 a 0.3)
      nextStep: "INVALID_STEP", // No es un valor válido del enum
      tags: [] // Debe tener al menos 1 tag
    }
  };

  const testContext = () => {
    const payload = buildTurnPayload({
      lesson: lesson01,
      momentId: 0,
      sessionSummary: "El estudiante está comenzando la lección. Primera interacción.",
      questionShown: "¿Qué entiendes por peligro y por riesgo en tu área de trabajo?",
      studentAnswer: studentAnswer || "Un peligro es algo que puede causar daño, como un piso mojado. El riesgo es la probabilidad de que ocurra.",
      aggregateMastery: 0.3,
      consecutiveCorrect: 1
    });

    setContext(payload);
  };

  const testValidation = (useValid: boolean) => {
    const responseToTest = useValid ? mockAIResponse : invalidResponse;

    const result = safeValidateAIResponse(responseToTest);

    if (result.success) {
      setValidationResult('✅ Validación exitosa! El schema es válido.');
      setParsedResponse(result.data);
    } else {
      setValidationResult(`❌ Error de validación:\n${result.error.errors.map(e => `- ${e.path.join('.')}: ${e.message}`).join('\n')}`);
      setParsedResponse(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Hito 1 - Schemas y Context</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de Context Builder */}
        <Card>
          <CardHeader>
            <CardTitle>1️⃣ Build Context Helper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Respuesta del estudiante:
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Escribe una respuesta de prueba..."
              />
            </div>

            <Button
              onClick={testContext}
              className="w-full"
            >
              Construir Contexto del Turno
            </Button>

            {context && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Contexto generado:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
                  {context}
                </pre>
                <p className="text-sm text-muted-foreground mt-2">
                  📊 Caracteres: {context.length} (~{Math.round(context.length / 4)} tokens aprox)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de Schema Validation */}
        <Card>
          <CardHeader>
            <CardTitle>2️⃣ Zod Schema Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                onClick={() => testValidation(true)}
                className="w-full"
                variant="default"
              >
                Probar con Respuesta Válida
              </Button>

              <Button
                onClick={() => testValidation(false)}
                className="w-full"
                variant="destructive"
              >
                Probar con Respuesta Inválida
              </Button>
            </div>

            {validationResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Resultado de validación:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                  {validationResult}
                </pre>
              </div>
            )}

            {parsedResponse && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Respuesta parseada:</h3>
                <pre className="bg-green-50 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(parsedResponse, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Panel de Información */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 Resumen del Hito 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">✅ Implementado:</h4>
              <ul className="text-sm space-y-1">
                <li>• Schema Zod con validación estricta</li>
                <li>• Helper buildTurnPayload</li>
                <li>• System prompt de SOPHIA</li>
                <li>• Tipos compatibles con Prisma</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎯 Schema validado:</h4>
              <ul className="text-sm space-y-1">
                <li>• chat.message (10-500 chars)</li>
                <li>• progress.masteryDelta (-0.3 a 0.3)</li>
                <li>• progress.nextStep enum</li>
                <li>• progress.tags (1-3 tags)</li>
                <li>• analytics opcional</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔄 Próximo (Hito 2):</h4>
              <ul className="text-sm space-y-1">
                <li>• Migración Prisma</li>
                <li>• Server Action con OpenAI</li>
                <li>• Persistencia en DB</li>
                <li>• Integración en /lessons/1</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}