"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface ChatPromptProps {
  disabled?: boolean
  onSend?: (message: string) => void
}

export function ChatPrompt({ disabled = false, onSend }: ChatPromptProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend?.(message.trim())
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder={disabled ? "Sophia está respondiendo..." : "Escribe tu mensaje..."}
        className="flex-1"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled || !message.trim()}>
        Enviar
      </Button>
    </form>
  )
}
