"use client"

import { ChatContainer } from "@/components/chat-container"
import { ChatPrompt } from "@/components/chat-prompt"
import { getChats } from "@/app/actions/lessons"
import { useEffect, useState } from "react"
import type { ChatMessage as ChatMessageType } from "@/app/actions/lessons"

interface LessonChatProps {
  lessonId: string
}

export function LessonChat({ lessonId }: LessonChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(true)
  const [isThinking, setIsThinking] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const loadChats = async () => {
      try {
        const chats = await getChats()
        setMessages(chats)
      } catch (error) {
        console.error("Error loading chats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [lessonId])

  const simulateSophiaResponse = () => {
    setIsBlocked(true)
    setIsThinking(true)

    // Thinking phase (2 seconds)
    setTimeout(() => {
      setIsThinking(false)
      setIsTyping(true)

      // Typing phase (3 seconds)
      setTimeout(() => {
        setIsTyping(false)
        setIsBlocked(false)
        // Here you would add the actual message to the chat
      }, 3000)
    }, 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <ChatContainer messages={messages} loading={loading} isThinking={isThinking} isTyping={isTyping} />
      </div>
      <div className="border-t p-4">
        <ChatPrompt disabled={isBlocked} onSend={simulateSophiaResponse} />
      </div>
    </div>
  )
}
