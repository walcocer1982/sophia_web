"use client"

import { ChatContainer } from "@/components/chat-container"
import { getChats } from "@/app/actions/lessons"
import ChatPrompt from "@/components/chat-prompt"
import { SophiaThinking, SophiaTyping } from "@/components/ui/sophia-thinking"
import { useEffect, useState } from "react"
import type { ChatMessage as ChatMessageType } from "@/app/actions/lessons"
import type { Session } from "next-auth"

interface LessonChatProps {
  lessonId: string
  session: Session | null
}

export function LessonChat({ lessonId, session }: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(true)
  const [isThinking, setIsThinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [sophiaStage, setSophiaStage] = useState<"analyzing" | "thinking" | "responding" | "finalizing">("analyzing")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        const chatMessages = await getChats()
        setMessages(chatMessages)
      } catch (error) {
        console.error('[LESSON-CHAT] Error al cargar mensajes:', error)
        setError('Error al cargar la lección')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [lessonId])

  const processSophiaResponse = async (studentAnswer: string) => {
    if (!session?.user) return

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
        username: session.user.name || 'Usuario'
      }

      setMessages(prev => [...prev, userMessage])

      // Mostrar estados de SOPHIA pensando
      setIsThinking(true)
      setSophiaStage("analyzing")
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSophiaStage("thinking")
      await new Promise(resolve => setTimeout(resolve, 1500))

      setSophiaStage("responding")
      await new Promise(resolve => setTimeout(resolve, 800))

      setIsThinking(false)
      setIsTyping(true)

      // Simular typing
      await new Promise(resolve => setTimeout(resolve, 1200))
      setIsTyping(false)

      // Respuesta mock de SOPHIA
      const sophiaMessage: ChatMessageType = {
        id: `sophia-${Date.now()}`,
        message: "Excelente observación. Has identificado correctamente algunos peligros importantes. ¿Podrías mencionar qué medidas de control específicas aplicarías para mitigar estos riesgos?",
        time: new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isUser: false,
        username: 'SOPHIA'
      }

      setMessages(prev => [...prev, sophiaMessage])

    } catch (error) {
      console.error('[LESSON-CHAT] Error en procesamiento:', error)
      setError('Error al procesar tu respuesta')
      setIsThinking(false)
      setIsTyping(false)
    } finally {
      setIsBlocked(false)
    }
  }

  if (error) {
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
          session={session}
        />

        {/* SOPHIA Thinking States */}
        {isThinking && (
          <div className="flex justify-start mb-4">
            <SophiaThinking
              stage={sophiaStage}
              variant="encouraging"
              showProgress={true}
            />
          </div>
        )}

        {/* SOPHIA Typing */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <SophiaTyping />
          </div>
        )}
      </div>

      <div className="border-t p-4 flex justify-center">
        <ChatPrompt
          disabled={isBlocked || loading}
          onSend={processSophiaResponse}
        />
      </div>
    </div>
  )
}
