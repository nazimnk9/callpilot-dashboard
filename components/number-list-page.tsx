"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { useRouter } from "next/navigation"

interface PhoneNumber {
    id: string
    friendly_name: string
    phone_number: string
    country_code: string
    voice_capable: boolean
    sms_capable: boolean
    mms_capable: boolean
    fax_capable: boolean
}

export function NumberListPage() {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchPhoneNumbers()
    }, [])

    const fetchPhoneNumbers = async () => {
        try {
            setIsLoading(true)
            const response = await phoneService.getPurchasedNumbers()

            console.log("[v0] Phone numbers fetched:", response.data)
            setPhoneNumbers(response.data.results || [])
        } catch (err: any) {
            console.log("[v0] Error fetching phone numbers:", err)
            const errorMessage = err.response?.data?.error || err.message || "Failed to fetch phone numbers"
            setError(errorMessage)
            setToast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleBack = () => {
        router.back()
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
            <LoaderOverlay isLoading={isLoading} />

            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Phone Numbers</h1>
                        <p className="text-muted-foreground mt-2">Manage your purchased phone numbers</p>
                    </div>
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        className="cursor-pointer border-2 border-border hover:bg-muted bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50 text-foreground font-semibold transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Phone Numbers List */}
                {phoneNumbers.length === 0 && !isLoading ? (
                    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <CardContent className="pt-12 pb-12 text-center">
                            <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground font-medium">No phone numbers found</p>
                            <p className="text-sm text-muted-foreground mt-1">Purchase your first phone number to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {phoneNumbers.map((number) => (
                            <Card
                                key={number.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary/50 transition-all duration-300 shadow-sm"
                            >
                                <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                                                <Phone className="w-6 h-6 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{number.friendly_name}</CardTitle>
                                                <CardDescription className="mt-1 font-medium">{number.phone_number}</CardDescription>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column: Basic Info */}
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                    Country Code
                                                </p>
                                                <p className="text-lg font-semibold text-foreground mt-1">{number.country_code}</p>
                                            </div>
                                        </div>

                                        {/* Right Column: Capabilities */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                                Capabilities
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2">
                                                    {number.voice_capable ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground">Voice</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {number.sms_capable ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground">SMS</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {number.mms_capable ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground">MMS</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {number.fax_capable ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500" />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground">Fax</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
