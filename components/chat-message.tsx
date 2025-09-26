import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverLift } from "@/components/ui/micro-interactions"
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
      <div className="flex gap-3 max-w-2xl ml-auto animate-in slide-in-from-right-4 fade-in duration-300">
        <div className="flex-1 text-right">
          <HoverLift lift="subtle" className="w-fit ml-auto">
            <div className="bg-gradient-to-br from-yellow-300 to-yellow-500/40 text-black rounded-lg p-3 inline-block shadow-sm hover:shadow-md transition-shadow duration-200">
              <p className="ds-text-body-sm text-left leading-relaxed">{message}</p>
              {image && (
                <div className="mt-2">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt="Chat image"
                    width={300}
                    height={200}
                    className="rounded-md hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
            </div>
          </HoverLift>
          <div className="ds-text-caption text-muted-foreground mt-1">{time}</div>
        </div>
        <Avatar className="h-8 w-8 ring-2 ring-yellow-200/50 hover:ring-yellow-300/70 transition-all duration-200">
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
    <div className="flex gap-3 max-w-2xl animate-in slide-in-from-left-4 fade-in duration-300">
      <Avatar className="h-8 w-8 ring-2 ring-cyan-200/50 hover:ring-cyan-300/70 transition-all duration-200">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white font-semibold text-xs">
          S
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <HoverLift lift="subtle">
          <div className="bg-gradient-to-br from-cyan-700/80 to-cyan-700/60 rounded-lg p-3 text-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="ds-text-body-sm leading-relaxed">{message}</p>
            {image && (
              <div className="mt-2">
                <Image
                  src={image || "/placeholder.svg"}
                  alt="Chat image"
                  width={300}
                  height={200}
                  className="rounded-md hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}
          </div>
        </HoverLift>
        <div className="ds-text-caption text-muted-foreground mt-1">{time}</div>
      </div>
    </div>
  )
}
