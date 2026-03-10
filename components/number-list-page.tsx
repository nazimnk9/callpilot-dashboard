"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, ArrowLeft, CheckCircle2, XCircle, Trash2, AlertCircle } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhoneNumber {
    id: number
    uid: string
    friendly_name: string
    phone_number: string
    country_code: string
    voice_capable: boolean
    sms_capable: boolean
    mms_capable: boolean
    fax_capable: boolean
    status: string
}

export function NumberListPage() {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isReleasing, setIsReleasing] = useState(false)
    const [error, setError] = useState("")
    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)
    const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false)
    const [selectedNumberForRelease, setSelectedNumberForRelease] = useState<PhoneNumber | null>(null)

    const router = useRouter()

    useEffect(() => {
        fetchPhoneNumbers()
    }, [])

    const fetchPhoneNumbers = async () => {
        try {
            setIsLoading(true)
            const response = await phoneService.getPurchasedNumbers()
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

    const handleReleaseNumber = async () => {
        if (!selectedNumberForRelease) return;

        try {
            setIsReleasing(true);
            await phoneService.releaseNumber(selectedNumberForRelease.uid);
            setToast({
                title: "Success",
                description: `Phone number ${selectedNumberForRelease.phone_number} released successfully.`,
                variant: "default",
            });
            fetchPhoneNumbers();
        } catch (err: any) {
            console.log("Error releasing phone number:", err);
            const errorMessage = err.response?.data?.error || "Failed to release phone number";
            setToast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsReleasing(false);
            setReleaseConfirmOpen(false);
            setSelectedNumberForRelease(null);
        }
    }

    const handleBack = () => {
        router.back()
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
            <LoaderOverlay isLoading={isLoading || isReleasing} />

            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

            <AlertDialog open={releaseConfirmOpen} onOpenChange={setReleaseConfirmOpen}>
                <AlertDialogContent className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <AlertDialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Release Phone Number
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Are you sure you want to release the phone number <span className="font-bold text-gray-900 dark:text-gray-100">{selectedNumberForRelease?.phone_number}</span>? This action cannot be undone and you will lose access to this number.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel
                            disabled={isReleasing}
                            className="rounded-xl font-bold px-6 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReleaseNumber}
                            disabled={isReleasing}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold px-6 py-2.5 transition-colors border-none"
                        >
                            {isReleasing ? "Releasing..." : "Release"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="p-4 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">My Phone Numbers</h1>
                        <p className="text-muted-foreground mt-2">Manage your purchased phone numbers</p>
                    </div>
                    <Button
                        onClick={handleBack}
                        variant="outline"
                        className="cursor-pointer border-2 border-border hover:bg-muted font-semibold transition-all duration-200 rounded-xl"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Phone Numbers List */}
                {phoneNumbers.length === 0 && !isLoading ? (
                    <Card className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl overflow-hidden">
                        <CardContent className="pt-12 pb-12 text-center">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full w-fit mx-auto mb-4">
                                <Phone className="w-8 h-8 text-muted-foreground opacity-50" />
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">No phone numbers found</p>
                            <p className="text-sm text-muted-foreground mt-1">Purchase your first phone number to get started</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {phoneNumbers.map((number) => (
                            <Card
                                key={number.id}
                                className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 shadow-sm rounded-2xl overflow-hidden group"
                            >
                                <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 md:p-6 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/10 transition-colors">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 md:gap-4 flex-1 w-full sm:w-auto">
                                            <div className="p-2.5 md:p-3 bg-black dark:bg-gray-700 rounded-xl shrink-0">
                                                <Phone className="w-5 h-5 md:w-6 md:h-6 text-white dark:text-gray-100" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <CardTitle className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate">
                                                        {number.phone_number}
                                                    </CardTitle>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${number.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        }`}>
                                                        {number.status}
                                                    </span>
                                                </div>
                                                <CardDescription className="mt-1 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm truncate">
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{number.country_code}</span>
                                                    {number.friendly_name && <span className="text-gray-400 dark:text-gray-600">|</span>}
                                                    <span className="truncate">{number.friendly_name}</span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        {number.status !== 'RELEASED' && (
                                            <Button
                                                onClick={() => {
                                                    setSelectedNumberForRelease(number);
                                                    setReleaseConfirmOpen(true);
                                                }}
                                                variant="destructive"
                                                className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 border-none rounded-xl px-4 py-2 md:py-2.5 font-bold text-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Release
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                        {/* Capabilities Section */}
                                        <div className="space-y-3 md:space-y-4">
                                            <p className="text-[10px] md:text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                                Capabilities
                                            </p>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-2 gap-y-3 md:gap-y-4 gap-x-2">
                                                {[
                                                    { label: "Voice", capable: number.voice_capable },
                                                    { label: "SMS", capable: number.sms_capable },
                                                    { label: "MMS", capable: number.mms_capable },
                                                    { label: "Fax", capable: number.fax_capable },
                                                ].map((cap) => (
                                                    <div key={cap.label} className="flex items-center gap-2 md:gap-2.5">
                                                        <div className={`p-1 rounded-full ${cap.capable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                            {cap.capable ? (
                                                                <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <XCircle className="w-3 md:w-3.5 h-3 md:h-3.5 text-red-600 dark:text-red-400" />
                                                            )}
                                                        </div>
                                                        <span className={`text-xs md:text-sm font-bold ${cap.capable ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                                            {cap.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Info Section */}
                                        <div className="space-y-3 md:space-y-4">
                                            <p className="text-[10px] md:text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                                                Quick Details
                                            </p>
                                            <div className="p-3 md:p-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">Country</p>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                                            {number.country_code}
                                                        </p>
                                                    </div>
                                                    {/* <div>
                                                        <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase">UID</p>
                                                        <p className="text-[11px] font-mono font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={number.uid}>
                                                            {number.uid.split('-')[0]}...
                                                        </p>
                                                    </div> */}
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
