"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

interface SophiaThinkingProps {
  isThinking: boolean
  isTyping: boolean
}

export function SophiaThinking({ isThinking, isTyping }: SophiaThinkingProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (!isThinking && !isTyping) return null

  const message = isThinking ? "Sophia está pensando" : "Sophia está escribiendo"

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">S</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3 max-w-xs">
          <p className="text-sm text-muted-foreground italic">
            {message}
            {dots}
          </p>
        </div>
      </div>
    </div>
  )
}
