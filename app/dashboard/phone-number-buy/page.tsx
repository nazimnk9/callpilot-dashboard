"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { PhoneNumberBuyForm } from "@/components/phone-number-buy-form"
import { authService, cookieUtils } from "@/services/auth-service"

export default function PhoneNumberBuyPage() {
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isTabletOrLarger, setIsTabletOrLarger] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = cookieUtils.get('access');
            const refreshToken = cookieUtils.get('refresh');

            if (!accessToken || !refreshToken) {
                router.push("/login")
                return
            }

            const verifyRes = await authService.verifyToken(accessToken)
            if (!verifyRes.ok) {
                const refreshRes = await authService.refreshToken(refreshToken)
                if (!refreshRes.ok) {
                    router.push("/login")
                    return
                }
                const data = await refreshRes.json();
                cookieUtils.set('access', data.access, 7);
                cookieUtils.set('refresh', data.refresh, 7);
            }
            setIsLoading(false)
        }

        checkAuth()

        const checkViewport = () => {
            setIsTabletOrLarger(window.innerWidth >= 1024)
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [router])

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <Sidebar
                isOpen={isTabletOrLarger || isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />

                <PhoneNumberBuyForm />
            </div>
        </div>
    )
}
