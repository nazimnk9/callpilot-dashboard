"use client"

import { Loader2 } from "lucide-react"

interface LoaderOverlayProps {
    isLoading: boolean
}

export function LoaderOverlay({ isLoading }: LoaderOverlayProps) {
    if (!isLoading) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground transition-all">Processing...</p>
            </div>
        </div>
    )
}
