"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, ArrowLeft } from "lucide-react"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { interviewService } from "@/services/interview-service"
import { flowService } from "@/services/flow-service"

// Interfaces based on user provided JSON structure
interface ChatMessage {
    role?: string
    content?: string
    sender?: string
    message?: string
    timestamp?: string
}

interface DisplayReportItem {
    id: number
    reports_uid?: string
    uid: string
    candidate_id: number
    candidate_name: string
    candidate_email: string
    candidate_phone: string
    started_at: string | null
    ai_decision: string
    status: string
    updated_at: string
    conversation_json: ChatMessage[]
}

interface ReportPageProps {
    featureUid?: string
}

const RETRY_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
    label: `${(i + 1) * 5} person`,
    value: (i + 1) * 5
}))

export default function ReportPage({ featureUid }: ReportPageProps) {
    const { toast } = useToast()
    const [isChatModalOpen, setIsChatModalOpen] = useState(false)
    const [isRecallModalOpen, setIsRecallModalOpen] = useState(false)
    const [recallLimit, setRecallLimit] = useState("5")
    const [isRecalling, setIsRecalling] = useState(false)

    // Main Reports State
    const [reports, setReports] = useState<DisplayReportItem[]>([])
    const [loading, setLoading] = useState(true)
    const [featureName, setFeatureName] = useState("Reports")
    const [selectedInterview, setSelectedInterview] = useState<DisplayReportItem | null>(null)
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch Feature Name if UID is provided
                if (featureUid) {
                    const featuresRes = await flowService.getFlows()
                    const currentFeature = featuresRes.data.results.find((f: any) => f.uid === featureUid)
                    if (currentFeature) {
                        setFeatureName(currentFeature.name)
                    }
                }

                // Fetch Call Interview Data
                const reportsRes = await interviewService.getInterviews()

                const normalized = reportsRes.data.results.map((item: any) => ({
                    id: item.id,
                    reports_uid: item.uid,
                    uid: item.uid,
                    candidate_id: item.candidate_id,
                    candidate_name: item.candidate_name,
                    candidate_email: item.candidate_email,
                    candidate_phone: item.candidate_phone,
                    started_at: item.started_at,
                    status: item.status,
                    ai_decision: item.ai_decision,
                    updated_at: item.updated_at,
                    conversation_json: item.interview_data?.conversation_json || []
                }))
                setReports(normalized)

            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [featureUid])

    const handleViewChat = (interview: DisplayReportItem) => {
        setSelectedInterview(interview)
        setIsChatModalOpen(true)
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-"
        try {
            return new Date(dateString).toLocaleString()
        } catch (e) {
            return dateString
        }
    }

    const handleRecall = async () => {
        try {
            setIsRecalling(true)
            await interviewService.retryInterviews(Number(recallLimit))
            toast({
                title: "Success",
                description: "Retry call process started successfully."
            })
            setIsRecallModalOpen(false)
        } catch (error) {
            console.error("Error retrying calls:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to initiate retry calls."
            })
        } finally {
            setIsRecalling(false)
        }
    }

    const handleSingleRecall = async (uid?: string) => {
        if (!uid) return
        try {
            setIsRecalling(true)
            await interviewService.retrySingleInterview(uid)
            toast({
                title: "Success",
                description: "Recall initiated successfully."
            })
        } catch (error) {
            console.error("Error recalling interview:", error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to initiate recall."
            })
        } finally {
            setIsRecalling(false)
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <LoaderOverlay isLoading={loading || isRecalling} message={isRecalling ? "Processing..." : "Loading records..."} />

            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Report - {featureName}
                    </h1>
                    <p className="text-muted-foreground">
                        View automation interview records for the {featureName}.
                    </p>
                </div>
                <Button
                    onClick={() => setIsRecallModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 cursor-pointer"
                >
                    Retry Call Interview
                </Button>
            </div>

            <div className="border rounded-lg bg-card overflow-hidden mb-8">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold text-foreground">Interview ID</TableHead>
                            <TableHead className="font-semibold text-foreground">Candidate ID</TableHead>
                            <TableHead className="font-semibold text-foreground">Candidate Name</TableHead>
                            <TableHead className="font-semibold text-foreground">Candidate Email</TableHead>
                            <TableHead className="font-semibold text-foreground">Candidate Mobile</TableHead>
                            <TableHead className="font-semibold text-foreground">First Message Sent At</TableHead>
                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                            <TableHead className="font-semibold text-foreground">Ai Decision</TableHead>
                            <TableHead className="font-semibold text-foreground">Updated At</TableHead>
                            <TableHead className="font-semibold text-foreground">Chat History</TableHead>
                            <TableHead className="font-semibold text-foreground">Retry call Interview</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center h-24">Loading records...</TableCell>
                            </TableRow>
                        ) : reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center h-24">No records found.</TableCell>
                            </TableRow>
                        ) : (
                            reports.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableCell className="text-sm">{row.uid}</TableCell>
                                    <TableCell className="text-sm">{row.candidate_id}</TableCell>
                                    <TableCell className="text-sm">{row.candidate_name}</TableCell>
                                    <TableCell className="text-sm">{row.candidate_email}</TableCell>
                                    <TableCell className="text-sm">{row.candidate_phone}</TableCell>
                                    <TableCell className="text-sm">{formatDate(row.started_at)}</TableCell>
                                    <TableCell className="text-sm">{row.status}</TableCell>
                                    <TableCell className="text-sm">{row.ai_decision}</TableCell>
                                    <TableCell className="text-sm">{formatDate(row.updated_at)}</TableCell>
                                    <TableCell className="text-sm">
                                        <Button
                                            variant="link"
                                            className="text-primary hover:underline p-0 h-auto cursor-pointer"
                                            onClick={() => handleViewChat(row)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="cursor-pointer"
                                            onClick={() => handleSingleRecall(row.reports_uid)}
                                            disabled={isRecalling}
                                        >
                                            Recall
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Button
                variant="ghost"
                className="text-primary bg-primary/30 hover:bg-black hover:text-white mt-4 cursor-pointer"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
            </Button>

            {/* Chat History Modal */}
            <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-semibold text-foreground">Chat History</h2>
                        {/* <button
                            onClick={() => setIsChatModalOpen(false)}
                            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </button> */}
                    </div>
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {selectedInterview?.conversation_json && selectedInterview.conversation_json.length > 0 ? (
                            selectedInterview.conversation_json.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "assistant" || msg.sender === "ai" ? "justify-start" : "justify-end"}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${msg.role === "assistant" || msg.sender === "ai"
                                            ? "bg-[#ebf0f5] text-foreground rounded-tl-none border border-slate-200"
                                            : "bg-[#5fa0d6] text-white rounded-tr-none"
                                            }`}
                                    >
                                        {msg.content || msg.message}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground">No chat history available.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Recall Modal */}
            <Dialog open={isRecallModalOpen} onOpenChange={setIsRecallModalOpen}>
                <DialogContent className="max-w-md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-foreground">Recall</h2>
                        {/* <button
                            onClick={() => setIsRecallModalOpen(false)}
                            className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </button> */}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select number of recently disconnected candidates to call</Label>
                            <Select value={recallLimit} onValueChange={setRecallLimit}>
                                <SelectTrigger className="w-full mt-1 h-8 text-xs pr-8">
                                    <SelectValue placeholder="Select count" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RETRY_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleRecall}
                                disabled={isRecalling}
                                className="bg-primary hover:bg-primary/90 cursor-pointer"
                            >
                                {isRecalling ? "Processing..." : "Recall"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
