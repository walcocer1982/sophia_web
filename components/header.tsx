"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"

export function Header() {

    return (
        <header className="h-20 border-b px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">S</span>
                </div>
                <span className="text-xl font-semibold">Sophia</span>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <div className="font-semibold">Bruno Díaz</div>
                    <div className="text-sm text-muted-foreground">bruno@acme.edu.pe</div>
                </div>
                <Avatar>
                    <AvatarFallback>BD</AvatarFallback>
                </Avatar>
                <form action={signOut}>
                    <Button variant="outline" size="sm" type="submit">
                        Salir
                    </Button>
                </form>

            </div>
        </header>
    )
}
