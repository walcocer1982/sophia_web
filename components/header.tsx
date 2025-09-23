"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/app/actions/auth"
import { Sparkles, LogOut } from "lucide-react"
import type { Session } from "next-auth"

interface HeaderProps {
    session: Session | null
}

export function Header({ session }: HeaderProps) {
    const userInitials = session?.user?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U'

    return (
        <header className="h-20 border-b bg-white/80 backdrop-blur-sm px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-700 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <span className="text-xl font-semibold bg-gradient-to-r from-cyan-700 to-yellow-600 bg-clip-text text-transparent">
                        SophIA
                    </span>
                    <p className="text-xs text-gray-500">Plataforma de Aprendizaje</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-semibold text-gray-900">
                        {session?.user?.name || 'Usuario'}
                    </div>
                    <div className="text-sm text-gray-500">
                        {session?.user?.email || ''}
                    </div>
                </div>
                <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                    {session?.user?.image && (
                        <AvatarImage
                            src={session.user.image}
                            alt={session.user.name || 'Avatar'}
                        />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-yellow-100 text-cyan-700 font-semibold">
                        {userInitials}
                    </AvatarFallback>
                </Avatar>
                <form action={signOut}>
                    <button
                        type="submit"
                        className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-yellow-700 text-gray-700 hover:text-white rounded-lg transition-colors duration-200 font-medium text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Salir</span>
                    </button>
                </form>
            </div>
        </header>
    )
}
