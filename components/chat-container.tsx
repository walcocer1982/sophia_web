"use client"

import { ChatMessage } from "@/components/chat-message"
import { ChatSkeleton } from "@/components/chat-skeleton"
import { SophiaThinking } from "@/components/sophia-thinking"
import type { ChatMessage as ChatMessageType } from "@/app/actions/lessons"

interface ChatContainerProps {
  messages: ChatMessageType[]
  loading: boolean
  isThinking: boolean
  isTyping: boolean
}

export function ChatContainer({ messages, loading, isThinking, isTyping }: ChatContainerProps) {
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
        />
      ))}
      {(isThinking || isTyping) && <SophiaThinking isThinking={isThinking} isTyping={isTyping} />}
    </div>
  )
}
