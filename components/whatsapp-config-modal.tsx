"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { flowService } from "@/services/flow-service"
import { Loader2, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react"

interface WhatsappConfigModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    configUid?: string
}

interface Sender {
    uid: string
    sender_sid: string
    friendly_name: string
    is_selected: boolean
}

export function WhatsappConfigModal({ isOpen, onClose, onSuccess, configUid }: WhatsappConfigModalProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [loaderMessage, setLoaderMessage] = useState("")

    // Step 1 states
    const [accountSid, setAccountSid] = useState("")
    const [authToken, setAuthToken] = useState("")

    // Step 2 states
    const [senders, setSenders] = useState<Sender[]>([])
    const [selectedSenderUid, setSelectedSenderUid] = useState("")
    const [internalConfigUid, setInternalConfigUid] = useState(configUid || "")

    useEffect(() => {
        if (isOpen) {
            resetModal()
            if (configUid) {
                setInternalConfigUid(configUid)
            } else {
                fetchConfigUid()
            }
        }
    }, [isOpen, configUid])

    const resetModal = () => {
        setStep(1)
        setError("")
        setSuccessMessage("")
        setAccountSid("")
        setAuthToken("")
        setSenders([])
        setSelectedSenderUid("")
        setLoaderMessage("")
    }

    const fetchConfigUid = async () => {
        try {
            const response = await flowService.getCallConfig()
            if (response.data.results && response.data.results.length > 0) {
                setInternalConfigUid(response.data.results[0].uid)
            }
        } catch (err) {
            console.error("Error fetching config UID:", err)
        }
    }

    const handleNext = async () => {
        if (!accountSid || !authToken) {
            setError("Please fill in both Account SID and Auth Token")
            return
        }

        setIsLoading(true)
        setError("")
        try {
            // POST account data
            await flowService.createWhatsappAccount({
                account_sid: accountSid,
                auth_token: authToken
            })

            // POST fetch senders
            await flowService.fetchWhatsappSenders()

            // Fetch list of senders for Step 2
            const sendersRes = await flowService.getWhatsappSenders()
            setSenders(sendersRes.data)
            
            setStep(2)
        } catch (err: any) {
            console.error("Error in Step 1:", err)
            setError(err.response?.data?.detail || "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!selectedSenderUid) {
            setError("Please select a sender from the list")
            return
        }

        setIsLoading(true)
        setError("")
        setLoaderMessage("assigning webhook to you sender")

        try {
            // Both requests must succeed
            await Promise.all([
                flowService.selectWhatsappSender({ sender_uid: selectedSenderUid }),
                flowService.setupWhatsappTemplate({
                    config_uid: internalConfigUid,
                    sender_uid: selectedSenderUid
                })
            ])

            setSuccessMessage("creation your what's app template")
            setStep(3) // Success step
            if (onSuccess) {
                onSuccess()
            }
        } catch (err: any) {
            console.error("Error in Step 2:", err)
            setError(err.response?.data?.detail || "Failed to complete setup. Please try again.")
            setLoaderMessage("")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-2xl bg-white dark:bg-gray-950 shadow-2xl">
                <div className="p-6 sm:p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {step === 1 && "Connect Twilio Account"}
                            {step === 2 && "Select WhatsApp Sender"}
                            {step === 3 && "Configuration Complete"}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-gray-400">
                            {step === 1 && "Enter your Twilio credentials to get started."}
                            {step === 2 && "Choose a sender to use for your WhatsApp communications."}
                            {step === 3 && "Your WhatsApp configuration has been set up successfully."}
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="account_sid" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account SID</Label>
                                <Input
                                    id="account_sid"
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={accountSid}
                                    onChange={(e) => setAccountSid(e.target.value)}
                                    className="h-12 border-gray-200 dark:border-gray-800 rounded-xl dark:bg-gray-900 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="auth_token" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Auth Token</Label>
                                <Input
                                    id="auth_token"
                                    type="password"
                                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={authToken}
                                    onChange={(e) => setAuthToken(e.target.value)}
                                    className="h-12 border-gray-200 dark:border-gray-800 rounded-xl dark:bg-gray-900 focus:ring-blue-500"
                                />
                            </div>
                            <Button
                                onClick={handleNext}
                                disabled={isLoading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {senders.length > 0 ? (
                                    senders.map((sender) => (
                                        <div
                                            key={sender.uid}
                                            onClick={() => setSelectedSenderUid(sender.uid)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                selectedSenderUid === sender.uid
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                                            }`}
                                        >
                                            <div className="font-bold text-gray-900 dark:text-gray-100">{sender.friendly_name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{sender.sender_sid}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">No senders found.</div>
                                )}
                            </div>
                            
                            {isLoading && loaderMessage && (
                                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">{loaderMessage}</p>
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || !selectedSenderUid}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Submit"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
                            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 animate-in zoom-in-50 duration-500">
                                <CheckCircle2 className="h-12 w-12" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Success!</h3>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                    {successMessage}
                                </p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="w-full h-12 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200"
                            >
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
