"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal,Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { flowService } from "@/services/flow-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link"

interface Flow {
    id: number
    is_purchased: boolean
    uid: string
    name: string
    description: string
    type: string
    status: string
}

export function PhoneCallFlowsContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [flows, setFlows] = useState<Flow[]>([])
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any>(null)

    const router = useRouter()

    const [showResultDialog, setShowResultDialog] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultTitle, setResultTitle] = useState("")

    useEffect(() => {
        fetchFlows()
    }, [])

    const fetchFlows = async () => {
        try {
            setIsLoading(true)
            const response = await flowService.getFlows()
            setFlows(response.data.results || [])
        } catch (err: any) {
            console.error("Error fetching flows:", err)
            setError("Failed to load flows")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSelectClick = (flow: Flow) => {
        router.push(`/dashboard/pricing-plan/${flow.uid}`)
    }

    const handleConfigureClick = (flow: Flow) => {
        router.push(`/dashboard/configure/${flow.uid}`)
    }

    const yourFlows = flows.filter(f => f.is_purchased)
    const availableFlows = flows.filter(f => !f.is_purchased)

    const FlowCard = ({ flow, type }: { flow: Flow, type: 'your' | 'available' }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            {/* Logo Section */}
            <div className="p-4 flex gap-2 border-b border-gray-100 dark:border-gray-700">
                <div className="w-14 h-14 border border-gray-200 dark:border-gray-600 rounded-md p-2 flex items-center justify-center bg-white dark:bg-gray-700">
                    <img src="/images/JobAdder.jpg" alt="JobAdder" className="max-w-full h-auto brightness-100" />
                </div>
                <div className="w-14 h-14 border border-gray-200 dark:border-gray-600 rounded-md p-2 flex items-center justify-center bg-white dark:bg-gray-700">
                    <img src="/images/Bullhornconnector.jpg" alt="Bullhorn" className="max-w-full h-auto brightness-100" />
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{flow.name}</h3>
                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                        <span className="text-sm font-medium underline">More</span>
                    </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-6 line-clamp-2">
                    {flow.description}
                </p>

                <div className="flex gap-2.5 mt-auto">
                    {type === 'available' ? (
                        <>
                            <Button
                                className="bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold h-11 px-8 rounded-lg text-sm transition-all shadow-sm"
                                onClick={() => handleSelectClick(flow)}
                            >
                                Select
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className="bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold h-11 px-8 rounded-lg text-sm transition-all shadow-sm"
                                onClick={() => handleConfigureClick(flow)}
                            >
                                Configure
                            </Button>
                            <Link href={`/dashboard/report/${flow.uid}`}>
                                <Button
                                    className="bg-[#e2e8f0] dark:bg-gray-700 hover:bg-[#cbd5e1] dark:hover:bg-gray-600 text-[#64748b] dark:text-gray-300 font-bold h-11 px-8 rounded-lg text-sm transition-all border-none"
                                >
                                    Interviews
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            {/* <LoaderOverlay isLoading={isLoading} /> */}
            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-row justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Phone call Flows</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Enable and manage your AI-powered recruitment call flows.</p>
                    </div>
                    <div>
                        <button
                            //variant="default"
                            className="bg-white border border-black dark:bg-gray-100 text-black dark:text-gray-900 transition-all duration-200 gap-2 flex justify-center items-center rounded-md px-4 py-1"
                        >
                            <Globe className="w-4 h-4 text-green-600" />
                            CallPilot Flow store
                        </button>
                    </div>
                </div>

                {/* <div className="grid grid-cols-1 lg:grid-cols-1 gap-12"> */}
                {/* Your Flows (Left) */}
                {/* <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm"> */}
                <div className="space-y-6">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">Your Flows</h2>
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{yourFlows.length}</span>
                    </div>
                    {yourFlows.length === 0 && !isLoading ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't selected any flows yet.</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Choose from available flows on the right.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {yourFlows.map(flow => (
                                <FlowCard key={flow.id} flow={flow} type="your" />
                            ))}
                        </div>
                    )}
                </div>
                {/* </div> */}

                {/* Available Flows (Right)
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
                        <div className="space-y-6">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Available Flows</h2>
                                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{availableFlows.length}</span>
                            </div>
                            {availableFlows.length === 0 && !isLoading ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No more available flows.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {availableFlows.map(flow => (
                                        <FlowCard key={flow.id} flow={flow} type="available" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div> */}
                {/* </div> */}
            </div>

            <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={resultTitle === "Error" ? "text-destructive dark:text-red-400" : "text-primary dark:text-green-400"}>
                            {resultTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base dark:text-gray-400 font-medium">
                            {resultMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowResultDialog(false)} className="dark:bg-gray-100 dark:text-gray-900">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    )
}
