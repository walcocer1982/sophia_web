import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

interface ChatMessageProps {
  message: string
  time: string
  isUser: boolean
  image?: string
  username?: string
  userAvatar?: string
  userInitials?: string
}

export function ChatMessage({ message, time, isUser, image, userAvatar, userInitials }: ChatMessageProps) {
  if (isUser) {
    return (
      <div className="flex gap-3 max-w-2xl ml-auto">
        <div className="flex-1 text-right">
          <div className="bg-yellow-300 text-black rounded-lg p-3 inline-block">
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
        <Avatar className="h-8 w-8 ring-1 ring-gray-200">
          {userAvatar && (
            <AvatarImage
              src={userAvatar}
              alt="Usuario"
            />
          )}
          <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-yellow-100 text-cyan-700 font-semibold text-xs">
            {userInitials || 'U'}
          </AvatarFallback>
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
        <div className="bg-cyan-800/70 rounded-lg p-3 text-white">
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
