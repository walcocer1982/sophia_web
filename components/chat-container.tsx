"use client"

import { ChatMessage } from "@/components/chat-message"
import { ChatSkeleton } from "@/components/chat-skeleton"
import { SophiaThinking } from "@/components/sophia-thinking"
import type { ChatMessage as ChatMessageType } from "@/app/actions/lessons"
import type { Session } from "next-auth"

interface ChatContainerProps {
  messages: ChatMessageType[]
  loading: boolean
  isThinking: boolean
  isTyping: boolean
  session: Session | null
}

export function ChatContainer({ messages, loading, isThinking, isTyping, session }: ChatContainerProps) {
  // Calcular iniciales del usuario
  const userInitials = session?.user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'
  if (loading) {
    return <ChatSkeleton />
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg.message}
          time={msg.time}
          isUser={msg.isUser}
          image={msg.image}
          username={msg.username}
          userAvatar={session?.user?.image || undefined}
          userInitials={userInitials}
        />
      ))}
      {(isThinking || isTyping) && <SophiaThinking isThinking={isThinking} isTyping={isTyping} />}
    </div>
  )
}
