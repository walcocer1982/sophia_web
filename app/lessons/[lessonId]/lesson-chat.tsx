"use client"

import { useState, useEffect } from "react"
import { ChatContainer } from "@/components/chat-container"
import ChatPrompt from "@/components/chat-prompt"
import { processSophiaTurn, getSessionMessages, getSessionState, initSophiaSession } from "@/app/actions/sophia"
import type { ChatMessage as ChatMessageType } from "@/app/actions/lessons"
import type { LessonStructure } from "@/types/lesson-types"
import type { Session } from "next-auth"

interface SessionState {
  currentMomentId: number;
  completedMoments: number[];
  aggregateMastery: number;
  consecutiveCorrect: number;
  totalAttempts: number;
  correctAnswers: number;
  isCompleted: boolean;
}

interface LessonChatProps {
  lesson: LessonStructure;
  lessonId: string;
  initialSessionId?: string;
  initialSessionState?: SessionState;
  userSession?: Session | null;
}

export default function LessonChat({
  lesson,
  lessonId,
  initialSessionId,
  initialSessionState,
  userSession
}: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [sessionState, setSessionState] = useState<SessionState | null>(initialSessionState || null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)

  // Obtener momento actual basado en el estado de sesión
  const currentMomentId = sessionState?.currentMomentId ?? 0
  const currentMoment = lesson.moments?.find(m => m.id === currentMomentId)

  // Seleccionar pregunta del momento actual solo cuando cambia el momento
  useEffect(() => {
    if (currentMoment && currentMoment.referenceQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * currentMoment.referenceQuestions.length)
      const selectedQuestion = currentMoment.referenceQuestions[randomIndex]
      setCurrentQuestion(selectedQuestion)
    }
  }, [currentMomentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar mensajes si hay sesión existente o iniciar nueva
  useEffect(() => {
    if (sessionId) {
      loadSession()
    } else if (!sessionId && messages.length === 0) {
      // Iniciar nueva sesión con SOPHIA
      initSession()
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const initSession = async () => {
    try {
      setLoading(true)
      setIsThinking(true)

      // Llamar a SOPHIA para obtener bienvenida
      const result = await initSophiaSession(lessonId)

      if (result.ok && result.data) {
        setSessionId(result.data.sessionId)

        // Agregar mensaje de bienvenida
        const welcomeMessage: ChatMessageType = {
          id: `sophia-init`,
          message: result.data.aiResponse.chat.message,
          time: new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isUser: false,
          username: 'SOPHIA'
        }
        setMessages([welcomeMessage])

        // Actualizar estado de sesión
        const newState = await getSessionState(result.data.sessionId)
        if (newState) {
          setSessionState(newState as SessionState)
        }
      } else {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      console.error('[LESSON-CHAT] Error al iniciar sesión:', err)
      setError('Error al iniciar la lección')
    } finally {
      setLoading(false)
      setIsThinking(false)
    }
  }

  const loadSession = async () => {
    if (!sessionId) return

    try {
      setLoading(true)
      const [msgs, state] = await Promise.all([
        getSessionMessages(sessionId),
        getSessionState(sessionId)
      ])

      // Convertir mensajes al formato esperado por ChatContainer
      const formattedMessages: ChatMessageType[] = msgs.map((msg: {
        id: string;
        content: string;
        createdAt: Date;
        role: string;
      }) => ({
        id: msg.id,
        message: msg.content,
        time: new Date(msg.createdAt).toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isUser: msg.role === 'user',
        username: msg.role === 'user' ? 'Tú' : 'SOPHIA'
      }))

      setMessages(formattedMessages)

      if (state) {
        setSessionState(state as SessionState)
      }
    } catch (err) {
      console.error('[LESSON-CHAT] Error cargando sesión:', err)
      setError('Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  const processSophiaResponse = async (studentAnswer: string) => {
    if (sessionState?.isCompleted) {
      setError('La lección ya está completada')
      return
    }

    try {
      setIsBlocked(true)
      setError(null)

      // Actualización optimista: agregar mensaje del usuario inmediatamente
      const userMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        message: studentAnswer,
        time: new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isUser: true,
        username: 'Tú'
      }

      setMessages(prev => [...prev, userMessage])

      // Mostrar estados de SOPHIA pensando
      setIsThinking(true)
      await new Promise(resolve => setTimeout(resolve, 1600)) // Simular el proceso de pensamiento

      // Llamar a la IA real
      const result = await processSophiaTurn({
        lessonId: lessonId,
        momentId: currentMomentId,
        questionShown: currentQuestion || "Pregunta de la lección",
        studentAnswer: studentAnswer.trim()
      })

      setIsThinking(false)

      if (!result.ok) {
        throw new Error(result.error || 'Error desconocido')
      }

      if (result.data) {
        // Mostrar typing animation
        setIsTyping(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsTyping(false)

        // Agregar mensaje de SOPHIA
        const sophiaMessage: ChatMessageType = {
          id: `sophia-${Date.now()}`,
          message: result.data.aiResponse.chat.message,
          time: new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          isUser: false,
          username: 'SOPHIA'
        }

        setMessages(prev => [...prev, sophiaMessage])
        setSessionId(result.data.sessionId)

        // Recargar estado de la sesión y emitir evento para actualizar debug info
        setTimeout(async () => {
          const newState = await getSessionState(result.data!.sessionId)
          if (newState) {
            setSessionState(newState as SessionState)
          }
          // Emitir evento para actualizar el debug panel
          window.dispatchEvent(new CustomEvent('sophia-response-complete'))
        }, 500)
      }

    } catch (err) {
      console.error('[LESSON-CHAT] Error en procesamiento:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar tu respuesta')
      setIsThinking(false)
      setIsTyping(false)
    } finally {
      setIsBlocked(false)
    }
  }

  if (error && !messages.length) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Error en la lección
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <ChatContainer
          messages={messages}
          loading={loading}
          isThinking={isThinking}
          isTyping={isTyping}
          session={userSession || null}
        />

        {/* Error message inline */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="border-t p-4 flex justify-center">
        <ChatPrompt
          disabled={isBlocked || loading || sessionState?.isCompleted}
          onSend={processSophiaResponse}
        />
      </div>
    </div>
  )
}