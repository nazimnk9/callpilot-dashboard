"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { OrganizationContent } from "@/components/organization-content"

export default function OrganizationPage() {
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isTabletOrLarger, setIsTabletOrLarger] = useState(false)

    useEffect(() => {
        const checkViewport = () => {
            setIsTabletOrLarger(window.innerWidth >= 1024)
        }

        checkViewport()
        window.addEventListener("resize", checkViewport)
        return () => window.removeEventListener("resize", checkViewport)
    }, [router])



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

                <OrganizationContent />
            </div>
        </div>
    )
}
