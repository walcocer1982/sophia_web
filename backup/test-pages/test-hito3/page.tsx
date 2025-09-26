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
  momentId: number;
  createdAt: Date;
}

interface SessionState {
  currentMomentId: number;
  completedMoments: number[];
  aggregateMastery: number;
  consecutiveCorrect: number;
  totalAttempts: number;
  correctAnswers: number;
  isCompleted: boolean;
}

export default function TestHito3Page() {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [processing, setProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [lastResponse, setLastResponse] = useState<LessonAIResponseT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);

  // Obtener momento actual basado en el estado de sesión
  const currentMomentId = sessionState?.currentMomentId ?? 0;
  const currentMoment = lesson01.moments?.find(m => m.id === currentMomentId);
  const totalMoments = lesson01.moments?.length || 0;

  // Seleccionar pregunta del momento actual solo cuando cambia el momento
  useEffect(() => {
    if (currentMoment && currentMoment.referenceQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentMoment.referenceQuestions.length);
      const selectedQuestion = currentMoment.referenceQuestions[randomIndex];
      setCurrentQuestion(selectedQuestion);
    } else {
      setCurrentQuestion("¿Qué entiendes por peligro y por riesgo en tu área de trabajo?");
    }
  }, [currentMomentId]); // Solo cambiar cuando cambia el momento

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
        questionShown: currentQuestion || "¿Qué entiendes por peligro y por riesgo en tu área de trabajo?",
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
        setTimeout(async () => {
          await loadSession();
        }, 500); // Pequeño delay para asegurar que la DB se actualizó
      }

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setProcessing(false);
    }
  };

  // Calcular progreso de la lección
  const lessonProgress = sessionState ? {
    percentage: Math.round(((sessionState.completedMoments?.length || 0) / totalMoments) * 100),
    momentText: `${currentMomentId + 1} / ${totalMoments}`,
    completedCount: sessionState.completedMoments?.length || 0
  } : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">🚀 Test Hito 3 - Transiciones y Progresión</h1>

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
        <strong>⚠️ Modo de prueba:</strong> Usando usuario de prueba (test@sophia.local) en desarrollo
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Barra de progreso de la lección */}
      {sessionState && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>📚 Progreso de la Lección</span>
              {sessionState.isCompleted && (
                <Badge className="bg-green-600">✅ COMPLETADO</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Momento: {lessonProgress?.momentText}</span>
                  <span>{lessonProgress?.percentage}% completado</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-yellow-400 h-3 rounded-full transition-all"
                    style={{ width: `${lessonProgress?.percentage}%` }}
                  />
                </div>
              </div>

              {/* Momentos de la lección */}
              <div className="grid grid-cols-4 gap-2">
                {lesson01.moments?.map((moment) => {
                  const isCompleted = sessionState.completedMoments?.includes(moment.id);
                  const isCurrent = moment.id === currentMomentId;

                  return (
                    <div
                      key={moment.id}
                      className={`p-2 rounded text-center text-xs ${
                        isCompleted
                          ? 'bg-green-100 text-green-800'
                          : isCurrent
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="font-semibold">M{moment.id + 1}</div>
                      <div className="truncate">{moment.title}</div>
                      {isCompleted && '✓'}
                      {isCurrent && '👈'}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
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
                <Badge className="mr-2">M{currentMomentId + 1}</Badge>
                {currentMoment?.title}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Meta: {currentMoment?.goal}
              </p>
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-sm">{currentQuestion || "Cargando pregunta..."}</p>
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
                disabled={processing || sessionState?.isCompleted}
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={processing || sessionState?.isCompleted}
            >
              {sessionState?.isCompleted
                ? '🎉 Lección Completada'
                : processing
                ? '🤔 SOPHIA está pensando...'
                : 'Enviar respuesta'}
            </Button>

            {/* Estado de la sesión */}
            {sessionState && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-2">📊 Métricas de progreso:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Dominio: {Math.round(sessionState.aggregateMastery * 100)}%</div>
                  <div>Correctas: {sessionState.correctAnswers}/{sessionState.totalAttempts}</div>
                  <div>Racha: {sessionState.consecutiveCorrect}</div>
                  <div>Completados: {sessionState.completedMoments?.length || 0}/{totalMoments}</div>
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
                  <h4 className="font-semibold text-sm mb-2">Decisión de progreso:</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Next Step:</span>
                      <Badge
                        variant={
                          lastResponse.progress.nextStep === 'ADVANCE' ? 'default' :
                          lastResponse.progress.nextStep === 'COMPLETE' ? 'default' :
                          'secondary'
                        }
                      >
                        {lastResponse.progress.nextStep}
                      </Badge>
                      {lastResponse.progress.nextStep === 'ADVANCE' && '→ Siguiente momento'}
                      {lastResponse.progress.nextStep === 'COMPLETE' && '🎉 Completar lección'}
                      {lastResponse.progress.nextStep === 'REINFORCE' && '🔄 Reforzar actual'}
                      {lastResponse.progress.nextStep === 'RETRY' && '🔁 Reintentar'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">Mastery Δ:</span>
                      <Badge variant={lastResponse.progress.masteryDelta > 0 ? 'default' : 'destructive'}>
                        {lastResponse.progress.masteryDelta > 0 ? '+' : ''}{lastResponse.progress.masteryDelta}
                      </Badge>
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
                      <Badge variant="outline" className="ml-2 text-xs">M{(msg.momentId || 0) + 1}</Badge>
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
          <CardTitle>ℹ️ Información del Hito 3</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">✅ Implementado:</h4>
              <ul className="space-y-1">
                <li>• Transición automática entre momentos</li>
                <li>• Progresión basada en nextStep</li>
                <li>• Tracking de momentos completados</li>
                <li>• Límite de 3 intentos por momento</li>
                <li>• Detección de lección completada</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🎯 Reglas de transición:</h4>
              <ul className="space-y-1">
                <li>• ADVANCE → Siguiente momento</li>
                <li>• REINFORCE/RETRY → Permanecer</li>
                <li>• COMPLETE → Finalizar lección</li>
                <li>• &gt;3 intentos → Forzar avance</li>
                <li>• Último momento → Complete</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔍 Para verificar:</h4>
              <ul className="space-y-1">
                <li>• Progresión entre momentos</li>
                <li>• Barra de progreso actualizada</li>
                <li>• Estados de momentos (actual/completado)</li>
                <li>• Rehidratación al recargar</li>
                <li>• ID de sesión: {sessionId || 'Sin sesión'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}