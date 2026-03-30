"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Loader2,
    CheckCircle2,
    Settings2,
    Bookmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";
import { toast } from "sonner"

interface FlowResult {
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

interface AICallFlowDetailsContentProps {
    flow: FlowResult;
}

export function AICallFlowDetailsContent({ flow }: AICallFlowDetailsContentProps) {
    const router = useRouter()
    const [isConnecting, setIsConnecting] = useState(false)

    const handleConnectFlow = async () => {
        setIsConnecting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/flows/available-flow/${flow.uid}/connect`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                toast.success("Flow connected successfully!");
                router.push("/dashboard/phone-call-flows/");
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to connect flow");
            }
        } catch (error) {
            console.error("Error connecting flow:", error);
            toast.error("An error occurred while connecting the flow");
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950">
            {/* Header Area */}
            <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-start text-center sm:text-left max-w-7xl mx-auto w-full">
                    {/* Image left from Name */}
                    <div className="w-24 h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900">
                        <img src={flow.picture} alt={flow.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-2 flex-grow">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                            {flow.name}
                        </h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium capitalize">
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{flow.call_direction} Call</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium uppercase tracking-wider">
                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{flow.flow_category.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2 mx-auto sm:mx-0 max-w-2xl">
                            {flow.flow_summary}
                        </p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50">
                <div className="max-w-7xl mx-auto w-full">
                    {/* Body */}
                    <div className="p-6 md:p-6 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
                        {/* How It Works - Left side */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Settings2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">How It Works</h3>
                            </div>
                            <ul className="space-y-3">
                                {flow.how_works.map((step, index) => (
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
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Required Resources</h3>
                            </div>
                            <ul className="space-y-3">
                                {flow.required_resources.map((resource, index) => (
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

                    {/* Compatible ATS(s) */}
                    <div className="p-6 md:p-6 lg:p-6 flex flex-col gap-6 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Compatible ATS(s)</h3>
                            <p className="text-sm text-gray-500">Integrate seamlessly with your favorite ATS platforms</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex items-center justify-center bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                                <img src="/images/JobAdder.jpg" alt="JobAdder" className="w-full h-full object-contain" />
                            </div>
                            <div className="w-16 h-16 sm:w-20 sm:h-20 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex items-center justify-center bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                                <img src="/images/Bullhornconnector.jpg" alt="Bullhorn" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
                <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={handleConnectFlow}
                        disabled={isConnecting}
                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isConnecting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                Connecting...
                            </>
                        ) : (
                            "Add To Your Flows"
                        )}
                    </Button>
                    <Button variant="outline" className="flex-1 h-14 border-gray-200 dark:border-gray-800 text-lg font-semibold rounded-2xl gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
                        <Bookmark className="w-5 h-5" />
                        Bookmark
                    </Button>
                </div>
            </div>
        </div>
    )
}
