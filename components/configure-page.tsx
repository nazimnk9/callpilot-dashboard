"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState, useEffect } from "react"
import { flowService } from "@/services/flow-service"
import { Trash2, CheckCircle2, AlertCircle, ArrowLeft, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfigurePageProps {
    featureUid?: string
}

interface InterviewStatus {
    id: number
    name: string
}

interface Platform {
    id: number
    uid: string
    platform: {
        name: string
    }
}

interface PhoneNumber {
    id: number
    uid: string
    phone_number: string
    friendly_name: string
}

interface QuestionInput {
    tempId: string
    uid?: string
    value: string
    isSaved: boolean
}

interface SuggestedQuestion {
    id: number
    uid: string
    question: string
    status: string
}

interface AppFeature {
    uid: string
    name: string
}

// Fixed dropdown options for calling time
const CALLING_TIME_OPTIONS = [
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "20 min", value: 20 },
    { label: "25 min", value: 25 },
    { label: "30 min", value: 30 },
    { label: "35 min", value: 35 },
    { label: "40 min", value: 40 },
    { label: "45 min", value: 45 },
    { label: "50 min", value: 50 },
    { label: "55 min", value: 55 },
    { label: "60 min", value: 60 },
]

export function ConfigurePage({ featureUid }: ConfigurePageProps) {
    const router = useRouter()

    // Dropdown Data States
    const [statusOptions, setStatusOptions] = useState<InterviewStatus[]>([])
    const [platformOptions, setPlatformOptions] = useState<Platform[]>([])
    const [phoneNumberOptions, setPhoneNumberOptions] = useState<PhoneNumber[]>([])
    const [featureName, setFeatureName] = useState("")
    const [isUpdateMode, setIsUpdateMode] = useState(false)
    const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([])

    // Form Field States
    const [phoneNumberUid, setPhoneNumberUid] = useState("")
    const [platformUid, setPlatformUid] = useState("")
    const [voiceId, setVoiceId] = useState("")
    const [endCallNegative, setEndCallNegative] = useState("false")

    // Status Assignments
    const [jobAdStatus, setJobAdStatus] = useState("Current")
    const [applicationStatus, setApplicationStatus] = useState<string>("")
    const [callingTime, setCallingTime] = useState<string>("5")
    const [unsuccessfulStatus, setUnsuccessfulStatus] = useState<string>("")
    const [successfulStatus, setSuccessfulStatus] = useState<string>("")
    const [placedStatus, setPlacedStatus] = useState<string>("")

    // Dynamic Questions
    const [questions, setQuestions] = useState<QuestionInput[]>([{ tempId: crypto.randomUUID(), value: "", isSaved: false }])

    // UI States
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const [showResultDialog, setShowResultDialog] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultTitle, setResultTitle] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statusRes, platformRes, phoneRes, featuresRes, questionsRes] = await Promise.all([
                    flowService.getInterviewStatus(),
                    flowService.getMyPlatforms(),
                    flowService.getPhoneNumbers(),
                    flowService.getFlows(),
                    flowService.getPrimaryQuestions(),
                ])

                if (statusRes) setStatusOptions(statusRes.data)
                if (platformRes) setPlatformOptions(platformRes.data.results)
                if (phoneRes) setPhoneNumberOptions(phoneRes.data.results)
                if (questionsRes) setSuggestedQuestions(questionsRes.data.results)

                const currentFeature = featuresRes.data.results.find((f: any) => f.uid === featureUid)
                if (currentFeature) {
                    setFeatureName(currentFeature.name)
                }

                try {
                    const configRes = await flowService.getCallConfig()
                    const configData = configRes.data

                    if (configData) {
                        setIsUpdateMode(true)

                        setPlatformUid(configData.platform?.uid || "")
                        setPhoneNumberUid(configData.phone?.uid || "")
                        setVoiceId(configData.voice_id || "")
                        setEndCallNegative(configData.end_call_if_primary_answer_negative ? "true" : "false")

                        setJobAdStatus(configData.jobad_status_for_calling || "Current")
                        setApplicationStatus(String(configData.application_status_for_calling || ""))
                        setCallingTime(String(configData.calling_time_after_status_update || "15"))
                        setUnsuccessfulStatus(String(configData.status_for_unsuccessful_call || ""))
                        setSuccessfulStatus(String(configData.status_for_successful_call || ""))
                        setPlacedStatus(String(configData.status_when_call_is_placed || ""))

                        if (configData.primary_questions && Array.isArray(configData.primary_questions)) {
                            const mappedQuestions = configData.primary_questions.map((q: any) => ({
                                tempId: crypto.randomUUID(),
                                uid: q.uid,
                                value: q.question,
                                isSaved: true
                            }))
                            setQuestions(mappedQuestions.length > 0 ? mappedQuestions : [{ tempId: crypto.randomUUID(), value: "", isSaved: false }])
                        }
                    }
                } catch (configErr) {
                    // No config yet
                }

                setIsLoading(false)
            } catch (err) {
                console.error("Error fetching configuration data:", err)
                setError("Failed to load configuration options")
                setIsLoading(false)
            }
        }

        fetchData()
    }, [featureUid])

    const handleAddQuestion = () => {
        setQuestions([...questions, { tempId: crypto.randomUUID(), value: "", isSaved: false }])
    }

    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...questions]
        newQuestions[index].value = value
        newQuestions[index].isSaved = false
        setQuestions(newQuestions)
    }

    const handleDeleteQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index)
        setQuestions(newQuestions.length ? newQuestions : [{ tempId: crypto.randomUUID(), value: "", isSaved: false }])
    }

    const handleSuggestionClick = (index: number, suggestion: string) => {
        const newQuestions = [...questions]
        newQuestions[index].value = suggestion
        setQuestions(newQuestions)
    }

    const handleSaveQuestion = async (index: number) => {
        const question = questions[index]
        if (!question.value.trim()) return

        try {
            const response = await flowService.savePrimaryQuestion(question.value)

            const newQuestions = [...questions]
            newQuestions[index].uid = response.data.uid
            newQuestions[index].isSaved = true
            setQuestions(newQuestions)

        } catch (err) {
            console.error("Error saving question:", err)
        }
    }

    const handleSaveConfiguration = async () => {
        setError("")

        const selectedStatuses = [applicationStatus, unsuccessfulStatus, successfulStatus, placedStatus].filter(Boolean)
        const uniqueStatuses = new Set(selectedStatuses)
        if (selectedStatuses.length !== uniqueStatuses.size) {
            const msg = "Error: You cannot select the same status for multiple distinct outcomes."
            setError(msg)
            setResultTitle("Error")
            setResultMessage(msg)
            setShowResultDialog(true)
            return
        }

        const unsavedQuestions = questions.filter(q => q.value.trim() && !q.isSaved)
        if (unsavedQuestions.length > 0) {
            const msg = "Please save all your questions before saving the configuration."
            setError(msg)
            setResultTitle("Error")
            setResultMessage(msg)
            setShowResultDialog(true)
            return
        }

        try {
            setIsSaving(true)

            const questionUids = questions.filter(q => q.uid).map(q => q.uid)
            const payload = {
                end_call_if_primary_answer_negative: endCallNegative === "true",
                jobad_status_for_calling: jobAdStatus,
                application_status_for_calling: Number(applicationStatus),
                calling_time_after_status_update: Number(callingTime),
                status_for_unsuccessful_call: Number(unsuccessfulStatus),
                status_for_successful_call: Number(successfulStatus),
                status_when_call_is_placed: Number(placedStatus),
                platform_uid: platformUid,
                phone_uid: phoneNumberUid,
                primary_question_inputs: questionUids,
                voice_id: voiceId
            }

            if (isUpdateMode) {
                await flowService.updateCallConfig(payload)
            } else {
                await flowService.createCallConfig(payload)
            }

            setResultTitle("Success")
            setResultMessage(isUpdateMode ? "Configuration updated successfully!" : "Configuration saved successfully!")
            setShowResultDialog(true)

        } catch (err: any) {
            console.error("Error saving configuration:", err)

            setResultTitle("Error")
            const errorData = err.response?.data
            let errorMessage = "Failed to save configuration"
            if (Array.isArray(errorData) && errorData.length > 0) {
                errorMessage = errorData[0]
            } else if (typeof errorData === "string") {
                errorMessage = errorData
            } else if (errorData?.error) {
                errorMessage = errorData.error
            } else if (err.message) {
                errorMessage = err.message
            }

            setResultMessage(errorMessage)
            setShowResultDialog(true)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSelectChange = (setter: (val: string) => void) => (val: string) => {
        if (val === "_CLEAR_") {
            setter("")
        } else {
            setter(val)
        }
    }

    const handleDialogClose = () => {
        setShowResultDialog(false)
        if (resultTitle === "Success") {
            router.push("/dashboard/phone-call-flows")
        }
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
            <LoaderOverlay
                isLoading={isLoading || isSaving}
            />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-6 mb-2">
                        <button onClick={() => router.back()} className="h-8 w-8 -ml-2 cursor-pointer rounded-full transition-all duration-300 hover:scale-125">
                            <ArrowLeft className="h-8 w-8" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configure – {featureName || "Loading..."}</h1>
                    </div>
                    <p className="text-gray-500">Complete your setup and configure interview settings.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8">
                        <Card className="p-8 shadow-sm border border-gray-100 rounded-2xl bg-white">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Platform</Label>
                                    <Select value={platformUid} onValueChange={handleSelectChange(setPlatformUid)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select Platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {platformOptions.map(p => (
                                                <SelectItem key={p.id} value={p.uid}>{p.platform.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Select Phone Number</Label>
                                    <Select value={phoneNumberUid} onValueChange={handleSelectChange(setPhoneNumberUid)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select phone number" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {phoneNumberOptions.map(p => (
                                                <SelectItem key={p.id} value={p.uid}>
                                                    {p.phone_number} {p.friendly_name ? `(${p.friendly_name})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400">
                                        Need another number? <Link href="/dashboard/phone-number-buy" className="text-blue-600 hover:underline">Buy New Number</Link>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">ElevenLabs Voice ID (Optional)</Label>
                                    <Input
                                        value={voiceId}
                                        onChange={(e) => setVoiceId(e.target.value)}
                                        placeholder="Enter Voice ID"
                                        className="h-12 border-gray-200 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-semibold text-gray-700">End call if primary answer is negative?</Label>
                                    <RadioGroup value={endCallNegative} onValueChange={setEndCallNegative} className="flex gap-4">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="true" id="ec-yes" />
                                            <Label htmlFor="ec-yes" className="font-medium text-gray-600 cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="false" id="ec-no" />
                                            <Label htmlFor="ec-no" className="font-medium text-gray-600 cursor-pointer">No</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8 shadow-sm border border-gray-100 rounded-2xl bg-white">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Interview Questions</h2>
                            <p className="text-sm text-gray-500 mb-6 font-medium">
                                Add primary questions for the interview. Save each question before saving the full configuration.
                            </p>

                            <div className="space-y-5">
                                {questions.map((q, index) => (
                                    <div key={q.tempId} className="space-y-2">
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                value={q.value}
                                                onChange={(e) => handleQuestionChange(index, e.target.value)}
                                                placeholder="Type a question"
                                                className={`h-12 border-gray-200 rounded-xl ${q.isSaved ? "border-green-500 bg-green-50/20" : ""}`}
                                                disabled={q.isSaved}
                                            />
                                            <div className="flex gap-2 shrink-0">
                                                {!q.isSaved ? (
                                                    <Button size="sm" variant="outline" onClick={() => handleSaveQuestion(index)} className="h-12 px-5 border-2 rounded-xl font-bold cursor-pointer" >Save</Button>
                                                ) : (
                                                    <div className="h-12 w-12 flex items-center justify-center text-green-500" title="Saved"><CheckCircle2 className="h-6 w-6" /></div>
                                                )}
                                                <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(index)} className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"><Trash2 className="h-5 w-5" /></Button>
                                            </div>
                                        </div>
                                        {!q.value && !q.isSaved && suggestedQuestions.length > 0 && (
                                            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Suggested Questions:</p>
                                                <div className="flex flex-col gap-2">
                                                    {suggestedQuestions.map(s => (
                                                        <div key={s.id} onClick={() => handleSuggestionClick(index, s.question)} className="text-sm p-3 bg-white border border-gray-200 hover:border-blue-400 rounded-lg cursor-pointer transition-all shadow-sm">{s.question}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button onClick={handleAddQuestion} variant="outline" className="h-12 px-6 border-2 border-gray-900 text-gray-900 font-bold rounded-xl hover:bg-gray-900 hover:text-white transition-all">
                                    <Plus className="h-4 w-4 mr-2" /> Add More Question
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        <Card className="p-8 shadow-sm border border-gray-100 rounded-2xl bg-white">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Automation Logic</h2>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Job Ad Status for Calling</Label>
                                    <Select value={jobAdStatus} onValueChange={handleSelectChange(setJobAdStatus)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Current">Current</SelectItem>
                                            <SelectItem value="Expired">Expired</SelectItem>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Application Status for Calling</Label>
                                    <Select value={applicationStatus} onValueChange={handleSelectChange(setApplicationStatus)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Calling Time After Status Update</Label>
                                    <Select value={callingTime} onValueChange={handleSelectChange(setCallingTime)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {CALLING_TIME_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Status When Call is Placed</Label>
                                    <Select value={placedStatus} onValueChange={handleSelectChange(setPlacedStatus)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Status for Successful Call</Label>
                                    <Select value={successfulStatus} onValueChange={handleSelectChange(setSuccessfulStatus)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Status for Unsuccessful Call</Label>
                                    <Select value={unsuccessfulStatus} onValueChange={handleSelectChange(setUnsuccessfulStatus)}>
                                        <SelectTrigger className="h-12 border-gray-200 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_CLEAR_" className="text-gray-400 font-medium">Remove Selection</SelectItem>
                                            {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Bottom Save Bar */}
                <div className="mt-12 flex justify-center">
                    <Button
                        size="lg"
                        onClick={handleSaveConfiguration}
                        disabled={isSaving}
                        className="h-14 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                    >
                        {isSaving ? (isUpdateMode ? "Updating..." : "Saving...") : (isUpdateMode ? "Update Configure" : "Save Configure")}
                    </Button>
                </div>
            </div>

            <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={resultTitle === "Error" ? "text-red-500 text-xl font-bold" : "text-blue-600 text-xl font-bold"}>
                            {resultTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 text-base font-medium">
                            {resultMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogAction onClick={handleDialogClose} className="h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl px-8">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
