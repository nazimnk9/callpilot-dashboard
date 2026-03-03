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
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, User, Calendar, Clock, PhoneIncoming, PhoneOutgoing, Trash2, AlertCircle, Settings2 } from "lucide-react"
import { interviewService } from "@/services/interview-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"

interface ConversationMessage {
    role: string
    content: string
    timestamp: string
}

interface CallLog {
    id: number
    uid: string
    created_at: string
    updated_at: string
    from_number: string | null
    to_number: string | null
    state: string // "INCOMING" | "OUTGOING"
    duration: string | null
    call_status: string
    conversation_json: ConversationMessage[] | null
    organization: number
}

interface CallLogConfig {
    action: string
    delete_hours: number | string | null
}

export function CallLogsContent() {
    const [callLogs, setCallLogs] = useState<CallLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"All" | "Incoming" | "Outgoing">("All")
    const [error, setError] = useState("")
    const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Delete states
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
    const [logToDelete, setLogToDelete] = useState<CallLog | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // Config states
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
    const [config, setConfig] = useState<CallLogConfig>({
        action: "NEVER_DELETE",
        delete_hours: null
    })
    const [isConfigLoading, setIsConfigLoading] = useState(false)
    const [configError, setConfigError] = useState<string | null>(null)

    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)

    useEffect(() => {
        fetchCallLogs()
    }, [])

    const fetchCallLogs = async () => {
        try {
            setIsLoading(true)
            const response = await interviewService.getCallLogs()
            setCallLogs(response.data.results || [])
        } catch (err: any) {
            console.error("Error fetching call logs:", err)
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

    const fetchConfig = async () => {
        try {
            setIsConfigLoading(true)
            const response = await interviewService.getCallLogConfig()
            if (response.data) {
                setConfig({
                    action: response.data.action || "NEVER_DELETE",
                    delete_hours: response.data.delete_hours
                })
            }
        } catch (err: any) {
            console.error("Error fetching config:", err)
        } finally {
            setIsConfigLoading(false)
        }
    }

    const handleUpdateConfig = async () => {
        try {
            setIsConfigLoading(true)
            setConfigError(null)
            const payload = {
                action: config.action,
                delete_hours: config.action === "CUSTOM_DELETE" ? (config.delete_hours !== null ? Number(config.delete_hours) : null) : null
            }
            await interviewService.updateCallLogConfig(payload)

            setToast({
                title: "Success",
                description: "Configuration updated successfully",
                variant: "default",
            })
            setIsConfigModalOpen(false)
        } catch (err: any) {
            console.error("Error updating config:", err)
            const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to update configuration"
            setConfigError(errorMessage)
        } finally {
            setIsConfigLoading(false)
        }
    }

    const handleDeleteCallLog = async () => {
        if (!logToDelete) return

        try {
            setIsDeleting(true)
            setDeleteError(null)
            await interviewService.deleteCallLog(logToDelete.uid)

            setToast({
                title: "Success",
                description: "Call log deleted successfully",
                variant: "default",
            })

            setIsDeleteConfirmOpen(false)
            setLogToDelete(null)
            fetchCallLogs()
        } catch (err: any) {
            console.error("Error deleting call log:", err)
            const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to delete call log"
            setDeleteError(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleViewConversation = (call: CallLog) => {
        setSelectedCall(call)
        setIsModalOpen(true)
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const filteredCallLogs = callLogs.filter(log => {
        if (activeTab === "All") return true
        if (activeTab === "Incoming") return log.state === "INCOMING"
        if (activeTab === "Outgoing") return log.state === "OUTGOING"
        return true
    })

    const hourOptions = Array.from({ length: 8 }, (_, i) => (i + 1) * 6)

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
            <LoaderOverlay isLoading={isLoading || isDeleting || (isConfigLoading && isConfigModalOpen)} />

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
                        <h1 className="text-lg font-semibold text-foreground tracking-tight">Call Activity</h1>
                        <p className="text-muted-foreground mt-2">View and manage call activities of your business.</p>
                    </div>
                    <Button
                        onClick={() => {
                            fetchConfig()
                            setIsConfigModalOpen(true)
                        }}
                        className="gap-2 bg-black dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
                    >
                        <Settings2 className="w-4 h-4" />
                        Settings
                    </Button>
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
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Type</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Call Status</TableHead>
                                        <TableHead>Created at</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCallLogs.length === 0 && !isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No call logs found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCallLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {log.state === "INCOMING" ? (
                                                            <PhoneIncoming className="w-4 h-4 text-blue-500" />
                                                        ) : (
                                                            <PhoneOutgoing className="w-4 h-4 text-green-500" />
                                                        )}
                                                        <span className="text-xs">{log.state}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{log.from_number || "N/A"}</TableCell>
                                                <TableCell className="text-sm">{log.to_number || "N/A"}</TableCell>
                                                <TableCell className="text-sm">{log.duration || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={log.call_status.toLowerCase() === 'completed' ? 'default' : 'secondary'}
                                                        className="capitalize text-[10px]"
                                                    >
                                                        {log.call_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{formatTimestamp(log.created_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 h-8"
                                                            onClick={() => handleViewConversation(log)}
                                                            disabled={!log.conversation_json || log.conversation_json.length === 0}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30"
                                                            onClick={() => {
                                                                setLogToDelete(log)
                                                                setIsDeleteConfirmOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conversation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">
                                    Call Conversation
                                </DialogTitle>
                                <DialogDescription className="mt-1">
                                    Reviewing call between {selectedCall?.from_number} and {selectedCall?.to_number}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedCall?.conversation_json && selectedCall.conversation_json.length > 0 ? (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border-b text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Calendar className="w-4 h-4" />
                                    Date: {formatTimestamp(selectedCall.created_at)}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                    <Clock className="w-4 h-4" />
                                    Duration: {selectedCall.duration || "N/A"}
                                </div>
                            </div>

                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-6">
                                    {selectedCall.conversation_json.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex flex-col ${msg.role === 'assistant' ? 'items-start' : 'items-end'
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[90%] rounded-2xl p-4 flex flex-col ${msg.role === 'assistant'
                                                    ? 'bg-muted text-foreground rounded-tl-none'
                                                    : 'bg-primary text-primary-foreground rounded-tr-none shadow-md'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between gap-4 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                                        {msg.role}
                                                    </span>
                                                </div>
                                                {/* Message Content with Scrollbar support */}
                                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                                                        {msg.content}
                                                    </p>
                                                </div>
                                                {msg.timestamp && (
                                                    <p className="text-[9px] opacity-50 mt-2 text-right">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No conversation data available</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">This call might have been too short or experienced an error.</p>
                        </div>
                    )}

                    <div className="p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 flex justify-end">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Configuration Modal */}
            <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5" />
                            Call Data Retention
                        </DialogTitle>
                        <DialogDescription>
                            Configure automated cleanup for your call logs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>Delection Action</Label>
                            <Select
                                value={config.action}
                                onValueChange={(value) => setConfig({ ...config, action: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEVER_DELETE">Never Auto delete</SelectItem>
                                    <SelectItem value="ALWAYS_DELETE">Always auto delete instantly</SelectItem>
                                    <SelectItem value="CUSTOM_DELETE">Auto Delete Within 'x' hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {config.action === "CUSTOM_DELETE" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Label>Hour Select</Label>
                                <Select
                                    value={config.delete_hours !== null ? Number(config.delete_hours).toFixed(1) : undefined}
                                    onValueChange={(value) => setConfig({ ...config, delete_hours: parseFloat(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select hours" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hourOptions.map(hour => (
                                            <SelectItem key={hour} value={hour.toFixed(1)}>
                                                {hour} hours
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsConfigModalOpen(false)}
                            disabled={isConfigLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateConfig}
                            disabled={isConfigLoading}
                            className="bg-black dark:bg-gray-100 text-white dark:text-gray-900"
                        >
                            {isConfigLoading ? "Saving..." : "Configure"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="py-2">
                            Are you sure you want to delete the call log from <span className="font-semibold text-foreground">{logToDelete?.from_number}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteConfirmOpen(false)
                                setLogToDelete(null)
                            }}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCallLog}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Call Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Error Alert Dialog */}
            <AlertDialog
                open={!!deleteError || !!configError}
                onOpenChange={() => {
                    setDeleteError(null)
                    setConfigError(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            Action Failed
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteError || configError}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => {
                            setDeleteError(null)
                            setConfigError(null)
                        }}>
                            Ok
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
