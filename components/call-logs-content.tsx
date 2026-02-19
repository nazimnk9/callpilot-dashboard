"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, User, Calendar, Clock } from "lucide-react"
import { interviewService } from "@/services/interview-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ConversationMessage {
    role: string
    content: string
    timestamp: string
}

interface Interview {
    id: number
    candidate_name: string | null
    candidate_email: string | null
    candidate_phone: string | null
    from_number: string | null
    job_title: string | null
    call_duration: string | null
    status: string
    created_at: string
    interview_data: {
        id: number
        conversation_json: ConversationMessage[]
        started_at: string
        ended_at: string
    } | null
}

export function CallLogsContent() {
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"All" | "Incoming" | "Outgoing">("All")
    const [error, setError] = useState("")
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)

    useEffect(() => {
        fetchInterviews()
    }, [])

    const fetchInterviews = async () => {
        try {
            setIsLoading(true)
            const response = await interviewService.getInterviews()
            setInterviews(response.data.results || [])
        } catch (err: any) {
            console.error("Error fetching interviews:", err)
            const errorMessage = err.response?.data?.error || err.message || "Failed to fetch call logs"
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

    const handleViewConversation = (interview: Interview) => {
        setSelectedInterview(interview)
        setIsModalOpen(true)
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const filteredInterviews = activeTab === "Incoming" ? [] : interviews

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
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">Call Logs</h1>
                        <p className="text-muted-foreground mt-2">View and manage candidate interview conversations</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                    {(["All", "Incoming", "Outgoing"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab
                                ? "bg-black dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Table Section */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-md flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Interview Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead></TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Call Status</TableHead>
                                    <TableHead>Created at</TableHead>
                                    <TableHead className="">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInterviews.length === 0 && !isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No call logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInterviews.map((interview) => (
                                        <TableRow key={interview.id}>
                                            <TableCell className="font-medium">
                                                Outgoing
                                            </TableCell>
                                            <TableCell>{interview.from_number || "N/A"}</TableCell>
                                            <TableCell>{interview.candidate_phone || "N/A"}</TableCell>
                                            <TableCell>{interview.call_duration || "N/A"}</TableCell>
                                            <TableCell>
                                                <Badge variant={interview.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                    {interview.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatTimestamp(interview.created_at) || "N/A"}</TableCell>
                                            <TableCell className="">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => handleViewConversation(interview)}
                                                    disabled={!interview.interview_data}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Conversation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Conversation for {selectedInterview?.candidate_name || "Candidate"}
                        </DialogTitle>
                        <DialogDescription>
                            Review the AI-to-candidate interaction for {selectedInterview?.job_title}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedInterview?.interview_data ? (
                        <div className="space-y-4 flex-1 overflow-hidden flex flex-col mt-4">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Calendar className="w-4 h-4" />
                                    Started: {formatTimestamp(selectedInterview.interview_data.started_at)}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Clock className="w-4 h-4" />
                                    Ended: {formatTimestamp(selectedInterview.interview_data.ended_at)}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {selectedInterview.interview_data.conversation_json?.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'assistant'
                                                    ? 'bg-muted text-foreground rounded-tl-none'
                                                    : 'bg-primary text-primary-foreground rounded-tr-none shadow-md'
                                                    }`}
                                            >
                                                <p className="text-sm font-semibold mb-1 opacity-70 uppercase tracking-tight">
                                                    {msg.role}
                                                </p>
                                                <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                                <p className="text-[10px] opacity-50 mt-2 text-right">
                                                    {formatTimestamp(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            No conversation data available for this record.
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
