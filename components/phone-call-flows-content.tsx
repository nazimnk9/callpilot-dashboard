"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal } from "lucide-react"
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

    const yourFlows = flows.filter(f => f.is_purchased)
    const availableFlows = flows.filter(f => !f.is_purchased)

    const FlowCard = ({ flow, type }: { flow: Flow, type: 'your' | 'available' }) => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
            {/* Logo Section */}
            <div className="p-4 flex gap-2 border-b border-gray-100">
                <div className="w-14 h-14 border border-gray-200 rounded-md p-2 flex items-center justify-center bg-white">
                    <img src="/images/JobAdder.jpg" alt="JobAdder" className="max-w-full h-auto" />
                </div>
                <div className="w-14 h-14 border border-gray-200 rounded-md p-2 flex items-center justify-center bg-white">
                    <img src="/images/Bullhornconnector.jpg" alt="Bullhorn" className="max-w-full h-auto" />
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{flow.name}</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                        <span className="text-sm font-medium underline">More</span>
                    </button>
                </div>
                <p className="text-gray-500 text-[15px] leading-relaxed mb-6 line-clamp-2">
                    {flow.description}
                </p>

                <div className="flex gap-2.5 mt-auto">
                    {type === 'available' ? (
                        <>
                            <Button
                                className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold h-11 px-8 rounded-lg text-sm transition-all shadow-sm"
                                onClick={() => handleSelectClick(flow)}
                            >
                                Select
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#64748b] font-bold h-11 px-8 rounded-lg text-sm transition-all border-none">
                                Configure
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
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
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Phone call Flows</h1>
                    <p className="text-gray-500">Enable and manage your AI-powered recruitment call flows.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Your Flows (Left) */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        <div className="space-y-6">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">Your Flows</h2>
                                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{yourFlows.length}</span>
                            </div>
                            {yourFlows.length === 0 && !isLoading ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                    <p className="text-gray-500 font-medium">You haven't selected any flows yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">Choose from available flows on the right.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {yourFlows.map(flow => (
                                        <FlowCard key={flow.id} flow={flow} type="your" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Available Flows (Right) */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        <div className="space-y-6">
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-2xl font-bold text-gray-900">Available Flows</h2>
                                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{availableFlows.length}</span>
                            </div>
                            {availableFlows.length === 0 && !isLoading ? (
                                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                                    <p className="text-gray-500 font-medium">No more available flows.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6">
                                    {availableFlows.map(flow => (
                                        <FlowCard key={flow.id} flow={flow} type="available" />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={resultTitle === "Error" ? "text-destructive" : "text-primary"}>
                            {resultTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            {resultMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowResultDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    )
}
