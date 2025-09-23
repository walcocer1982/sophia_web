import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

interface ChatMessageProps {
  message: string
  time: string
  isUser: boolean
  image?: string
  username?: string
}

export function ChatMessage({ message, time, isUser, image }: ChatMessageProps) {
  if (isUser) {
    return (
      <div className="flex gap-3 max-w-2xl ml-auto">
        <div className="flex-1 text-right">
          <div className="bg-primary text-primary-foreground rounded-lg p-3 inline-block">
            <p className="text-sm text-left">{message}</p>
            {image && (
              <div className="mt-2">
                <Image
                  src={image || "/placeholder.svg"}
                  alt="Chat image"
                  width={300}
                  height={200}
                  className="rounded-md"
                />
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{time}</div>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback>B</AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex gap-3 max-w-2xl">
      <Avatar className="h-8 w-8">
        <AvatarFallback>S</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-sm">{message}</p>
          {image && (
            <div className="mt-2">
              <Image
                src={image || "/placeholder.svg"}
                alt="Chat image"
                width={300}
                height={200}
                className="rounded-md"
              />
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{time}</div>
      </div>
    </div>
  )
}
