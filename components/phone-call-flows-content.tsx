"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";

interface Flow {
    id: number;
    uid: string;
    name: string;
    picture: string;
    call_direction: string;
    flow_category: string;
    flow_summary: string;
    how_works: string[];
    applicable_crms: string[];
    required_resources: string[];
    code: string;
    status: string;
    is_connected: boolean;
}

interface MyFlowItem {
    id: number;
    uid: string;
    status: string;
    organization: number;
    flow: Flow;
}

export function PhoneCallFlowsContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [myFlows, setMyFlows] = useState<MyFlowItem[]>([])
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any>(null)

    const router = useRouter()

    const [showResultDialog, setShowResultDialog] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultTitle, setResultTitle] = useState("")

    useEffect(() => {
        fetchMyFlows()
    }, [])

    const fetchMyFlows = async () => {
        try {
            setIsLoading(true)
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/flows/available-flow/my_flows`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setMyFlows(data.results || [])
            } else {
                setError("Failed to load flows")
            }
        } catch (err: any) {
            console.error("Error fetching flows:", err)
            setError("Failed to load flows")
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfigureClick = (uid: string) => {
        router.push(`/dashboard/configure/${uid}`)
    }

    const FlowCard = ({ item }: { item: MyFlowItem }) => {
        const { flow } = item;
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200">
                {/* Image Section */}
                {/* <div className="p-4 flex gap-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                            <div className="w-14 h-14 border border-gray-200 dark:border-gray-600 rounded-md p-2 flex items-center justify-center bg-white dark:bg-gray-700">
                                <img src="/images/JobAdder.jpg" alt="JobAdder" className="w-full h-full object-contain" />
                            </div>
                            <div className="w-14 h-14 border border-gray-200 dark:border-gray-600 rounded-md p-2 flex items-center justify-center bg-white dark:bg-gray-700">
                                <img src="/images/Bullhornconnector.jpg" alt="Bullhorn" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex gap-4 items-start mb-6">
                        <div className="w-14 h-20 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-700 flex-shrink-0">
                            <img src={flow.picture} alt={flow.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{flow.name}</h3>
                                <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                    <span className="text-sm font-medium underline">More</span>
                                </button>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-0 line-clamp-2">
                                {flow.flow_summary}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 mt-auto">
                        <Button
                            className="bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold h-11 px-8 rounded-lg text-sm transition-all shadow-sm"
                            onClick={() => handleConfigureClick(item.uid)}
                        >
                            Configure
                        </Button>
                        <Link href={`/dashboard/report/${item.uid}`}>
                            <Button
                                className="bg-[#e2e8f0] dark:bg-gray-700 hover:bg-[#cbd5e1] dark:hover:bg-gray-600 text-[#64748b] dark:text-gray-300 font-bold h-11 px-8 rounded-lg text-sm transition-all border-none"
                            >
                                {flow.code === "AICALL191" ? "Reports" : "Interviews"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
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
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Phone Call Flows</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Enable and manage your AI-powered recruitment call flows.</p>
                    </div>
                    <div>
                        <Link href="/dashboard/ai-call-flow-options">
                            <button
                                className="bg-white border border-black dark:bg-gray-100 text-black dark:text-gray-900 text-xs transition-all duration-200 gap-2 flex justify-center items-center rounded-md px-2 py-1"
                            >
                                <Globe className="w-4 h-4 text-green-600" />
                                AI Call Flow Options
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">Your Flows</h2>
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{myFlows.length}</span>
                    </div>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <p className="text-gray-500 font-medium">Fetching your flows...</p>
                        </div>
                    ) : myFlows.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't selected any flows yet.</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Choose from available flows in the Flow Store.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myFlows.map(item => (
                                <FlowCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
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
