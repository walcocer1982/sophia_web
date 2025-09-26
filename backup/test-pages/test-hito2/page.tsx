'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { processSophiaTurn, getSessionMessages, getSessionState } from '@/app/actions/sophia';
import { lesson01 } from '@/data_lessons/lesson01';
import type { LessonAIResponseT } from '@/lib/ai/schemas';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface SessionState {
  currentMomentId: number;
  aggregateMastery: number;
  consecutiveCorrect: number;
  totalAttempts: number;
  correctAnswers: number;
  isCompleted: boolean;
}

export default function TestHito2Page() {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [lastResponse, setLastResponse] = useState<LessonAIResponseT | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Momento actual (hardcodeado para prueba)
  const currentMomentId = 0;
  const currentMoment = lesson01.moments?.find(m => m.id === currentMomentId);
  const currentQuestion = currentMoment?.referenceQuestions[0] ||
    "¿Qué entiendes por peligro y por riesgo en tu área de trabajo?";

  // Cargar mensajes si hay sesión
  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      const [msgs, state] = await Promise.all([
        getSessionMessages(sessionId),
        getSessionState(sessionId)
      ]);

      setMessages(msgs as Message[]);
      if (state) {
        setSessionState(state as SessionState);
      }
    } catch (err) {
      console.error('Error cargando sesión:', err);
    }
  };

  const handleSubmit = async () => {
    if (!studentAnswer.trim()) {
      setError('Por favor escribe una respuesta');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await processSophiaTurn({
        lessonId: '1',
        momentId: currentMomentId,
        questionShown: currentQuestion,
        studentAnswer: studentAnswer.trim()
      });

      if (!result.ok) {
        setError(result.error || 'Error desconocido');
        return;
      }

      if (result.data) {
        setLastResponse(result.data.aiResponse);
        setSessionId(result.data.sessionId);
        setStudentAnswer('');

        // Recargar mensajes y estado
        await loadSession();
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Hito 2 - OpenAI + Persistencia</h1>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
        <strong>⚠️ Modo de prueba:</strong> Usando usuario de prueba (test@sophia.local) en desarrollo
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Panel de Input */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Interacción con SOPHIA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Momento actual:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {currentMoment?.title} - {currentMoment?.goal}
              </p>
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-sm">{currentQuestion}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tu respuesta:
              </label>
              <textarea
                className="w-full p-3 border rounded-md"
                rows={4}
                value={studentAnswer}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                disabled={processing}
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={processing}
            >
              {processing ? '🤔 SOPHIA está pensando...' : 'Enviar respuesta'}
            </Button>

            {/* Estado de la sesión */}
            {sessionState && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-2">📊 Estado actual:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Dominio: {Math.round(sessionState.aggregateMastery * 100)}%</div>
                  <div>Correctas: {sessionState.correctAnswers}/{sessionState.totalAttempts}</div>
                  <div>Racha: {sessionState.consecutiveCorrect}</div>
                  <div>Momento: {sessionState.currentMomentId}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel de Respuesta */}
        <Card>
          <CardHeader>
            <CardTitle>🤖 Última respuesta de SOPHIA</CardTitle>
          </CardHeader>
          <CardContent>
            {lastResponse ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Mensaje:</h4>
                  <p className="text-sm bg-green-50 p-3 rounded">
                    {lastResponse.chat.message}
                  </p>
                  {lastResponse.chat.hints && lastResponse.chat.hints.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium">Pistas:</span>
                      <ul className="text-xs text-muted-foreground mt-1">
                        {lastResponse.chat.hints.map((hint, i) => (
                          <li key={i}>• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Progreso:</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Mastery Δ:</span>
                      <Badge variant={lastResponse.progress.masteryDelta > 0 ? 'default' : 'destructive'}>
                        {lastResponse.progress.masteryDelta > 0 ? '+' : ''}{lastResponse.progress.masteryDelta}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Next Step:</span>
                      <Badge>{lastResponse.progress.nextStep}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Tags:</span>
                      {lastResponse.progress.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {lastResponse.analytics && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Analytics:</h4>
                    <div className="text-xs space-y-1">
                      {lastResponse.analytics.difficulty && (
                        <div>Dificultad: {lastResponse.analytics.difficulty}</div>
                      )}
                      {lastResponse.analytics.confidenceScore !== undefined && (
                        <div>Confianza: {Math.round(lastResponse.analytics.confidenceScore * 100)}%</div>
                      )}
                      {lastResponse.analytics.reasoningSignals && (
                        <div>Señales: {lastResponse.analytics.reasoningSignals.join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Envía una respuesta para interactuar con SOPHIA
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial de mensajes */}
      {messages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📜 Historial de conversación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded ${
                    msg.role === 'user'
                      ? 'bg-blue-50 ml-12'
                      : 'bg-green-50 mr-12'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-xs">
                      {msg.role === 'user' ? '👤 Tú' : '🤖 SOPHIA'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>ℹ️ Información del Hito 2</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ Implementado:</h4>
              <ul className="space-y-1">
                <li>• OpenAI con structured outputs</li>
                <li>• Validación Zod estricta</li>
                <li>• Persistencia transaccional</li>
                <li>• Session summary (600 tokens)</li>
                <li>• Modelo AIOutcome completo</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💾 Datos guardados:</h4>
              <ul className="space-y-1">
                <li>• LessonSession con agregados</li>
                <li>• ChatMessage (user + assistant)</li>
                <li>• StudentResponse evaluada</li>
                <li>• AIOutcome con JSON raw</li>
                <li>• Métricas y progreso</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔍 Para verificar:</h4>
              <ul className="space-y-1">
                <li>• SOPHIA responde coherentemente</li>
                <li>• Tags y mastery correctos</li>
                <li>• Sesión persiste al recargar</li>
                <li>• Historial se mantiene</li>
                <li>• ID de sesión: {sessionId || 'Sin sesión'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}