"use client"

import { Loader2 } from "lucide-react"

interface LoaderOverlayProps {
    isLoading: boolean
    message?: string
}

export function LoaderOverlay({ isLoading, message = "Processing..." }: LoaderOverlayProps) {
    if (!isLoading) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md">
            <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-200 border-t-violet-600 dark:border-white/10 dark:border-t-violet-400 shadow-[0_0_24px_rgba(157,92,246,0.45)]" />
                {/* <p className="text-sm font-medium text-muted-foreground transition-all">{message}</p> */}
            </div>
        </div>
    )
}
