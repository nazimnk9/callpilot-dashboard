"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Globe, Loader2, Bookmark, Settings2, CheckCircle2 } from "lucide-react"
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)

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

    const handleConfigureClick = (uid: string, name: string, code: string) => {
        router.push(`/dashboard/configure/${uid}?name=${encodeURIComponent(name)}&code=${code}`)
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
                                <h3 className="sm:text-lg md:text-base lg:text-lg text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight mt-1">{flow.name}</h3>
                                <button
                                    onClick={() => {
                                        setSelectedFlow(flow);
                                        setIsDetailsOpen(true);
                                    }}
                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <span className="text-sm font-medium underline">More</span>
                                </button>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-[13px] lg:text-[15px] leading-relaxed mb-0">
                                {flow.flow_summary}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-row lg:flex-row gap-2.5 mt-auto">
                        <Button
                            className="bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold h-11 px-8 rounded-lg text-sm transition-all shadow-sm w-full "
                            onClick={() => handleConfigureClick(item.uid, flow.name, flow.code)}
                        >
                            Configure
                        </Button>
                        <Link href={flow.code === "AICALL191" ? `/dashboard/report?code=${flow.code}` : `/dashboard/report/${item.uid}`} className="w-full">
                            <Button
                                className="bg-[#e2e8f0] dark:bg-gray-700 hover:bg-[#cbd5e1] dark:hover:bg-gray-600 text-[#64748b] dark:text-gray-300 font-semibold h-11 px-8 rounded-lg text-sm transition-all border-none w-full"
                            >
                                {flow.code === "AICALL191" ? "Reservations" : "Call History"}
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
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">AI Call Builder</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Enable and manage your AI-powered call flows.</p>
                    </div>
                    <div>
                        <Link href="/dashboard/ai-call-flow-options">
                            <button
                                className="bg-white border border-black dark:bg-gray-100 text-black dark:text-gray-900 text-xs transition-all duration-200 gap-2 flex justify-center items-center rounded-md px-2 py-2 text-base"
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
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Flow Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-2xl">
                    {selectedFlow && (
                        <div className="flex flex-col h-full">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex gap-6 items-start">
                                    {/* Image left from Name */}
                                    <div className="w-24 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900">
                                        <img src={selectedFlow.picture} alt={selectedFlow.name} className="w-full h-full object-fixed" />
                                    </div>
                                    <div className="space-y-2 flex-grow">
                                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                            {selectedFlow.name}
                                        </DialogTitle>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium capitalize">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{selectedFlow.call_direction}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium uppercase tracking-wider">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{selectedFlow.flow_category.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                                            {selectedFlow.flow_summary}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10 bg-gray-50/50 dark:bg-gray-950/50">
                                {/* How It Works - Left side */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">How It Works</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {selectedFlow.how_works.map((step, index) => (
                                            <li key={index} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 group">
                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-semibold mt-0.5 border border-blue-600/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    {index + 1}
                                                </span>
                                                <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors leading-normal">{step}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Required Resources - Right side from How It Works */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Required Resources</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        {selectedFlow.required_resources.map((resource, index) => (
                                            <li key={index} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 group">
                                                <div className="mt-1 flex-shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors" />
                                                </div>
                                                <span className="group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors leading-normal">{resource}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            {/* <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => setIsDetailsOpen(false)}
                                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Close
                                </Button>
                                <Button variant="outline" className="flex-1 h-11 border-gray-200 dark:border-gray-800 font-bold rounded-xl gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
                                    <Bookmark className="w-4 h-4" />
                                    Book Mark
                                </Button>
                            </div> */}

                            {/* Compatible CRM Section */}
                            <div className="p-4 flex flex-col gap-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col gap-1">
                                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Compatible CRM</h1>
                                </div>
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
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    )
}

