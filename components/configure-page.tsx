"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { flowService } from "@/services/flow-service"
import { Trash2, CheckCircle2, AlertCircle, ArrowLeft, Plus, Clock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"

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

interface TimelineDay {
    day: string
    startTime: string
    endTime: string
    isActive: boolean
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

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = i % 2 === 0 ? "00" : "30"
    const time = `${String(hours).padStart(2, '0')}:${minutes}:00`
    return { label: time.slice(0, 5), value: time }
})

export function ConfigurePage({ featureUid }: ConfigurePageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

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
    const [restaurantName, setRestaurantName] = useState("")
    const [assistantName, setAssistantName] = useState("")

    // Status Assignments
    const [jobAdStatus, setJobAdStatus] = useState("Current")
    const [applicationStatus, setApplicationStatus] = useState<string>("")
    const [callingTime, setCallingTime] = useState<string>("5")
    const [unsuccessfulStatus, setUnsuccessfulStatus] = useState<string>("")
    const [successfulStatus, setSuccessfulStatus] = useState<string>("")
    const [placedStatus, setPlacedStatus] = useState<string>("")

    const INITIAL_TIMELINE: TimelineDay[] = [
        { day: "Monday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Tuesday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Wednesday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Thursday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Friday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Saturday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
        { day: "Sunday", startTime: "09:00:00", endTime: "18:00:00", isActive: true },
    ]

    // Timeline State
    const [timeline, setTimeline] = useState<TimelineDay[]>(INITIAL_TIMELINE)

    // Dynamic Questions
    const [questions, setQuestions] = useState<QuestionInput[]>([{ tempId: crypto.randomUUID(), value: "", isSaved: false }])

    // UI States
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const [showResultDialog, setShowResultDialog] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultTitle, setResultTitle] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [myFlowUid, setMyFlowUid] = useState("")
    const [showReleaseDialog, setShowReleaseDialog] = useState(false)

    useEffect(() => {
        const nameParam = searchParams.get("name")
        const codeParam = searchParams.get("code")
        if (nameParam) {
            setFeatureName(nameParam)
        }

        const fetchData = async () => {
            try {
                const [statusRes, platformRes, phoneRes, questionsRes] = await Promise.all([
                    flowService.getInterviewStatus(),
                    flowService.getMyPlatforms(),
                    flowService.getPhoneNumbers(),
                    //flowService.getFlows(),
                    flowService.getPrimaryQuestions(),
                ])

                if (statusRes) setStatusOptions(statusRes.data)
                if (platformRes) setPlatformOptions(platformRes.data.results)
                if (phoneRes) setPhoneNumberOptions(phoneRes.data.results)
                if (questionsRes) setSuggestedQuestions(questionsRes.data.results)

                //const currentFeature = featuresRes.data.results.find((f: any) => f.uid === featureUid)
                //if (currentFeature) {
                //    setFeatureName(currentFeature.name)
                //}

                if (codeParam === "AICALL191") {
                    try {
                        const dinerRes = await flowService.getDinerConfig()
                        const dinerData = dinerRes.data
                        if (dinerData) {
                            setPhoneNumberUid(dinerData.phone?.uid || "")
                            setVoiceId(dinerData.voice_id || "")
                            setRestaurantName(dinerData.restaurant_name || "")
                            setAssistantName(dinerData.assistant_name || "")
                            setIsUpdateMode(true)
                        }
                    } catch (dinerErr) {
                        // No diner config yet
                    }
                } else {
                    try {
                        const configRes = await flowService.getCallConfig()
                        const configList = configRes.data.results

                        if (configList && configList.length > 0) {
                            const configData = configList[0]
                            setIsUpdateMode(true)

                            setPlatformUid(configData.platform?.uid || "")
                            setPhoneNumberUid(configData.phone?.uid || "")
                            setVoiceId(configData.voice_id || "")
                            setMyFlowUid(configData.my_flow?.uid || "")
                            // setEndCallNegative(configData.end_call_if_primary_answer_negative ? "true" : "false")

                            // setJobAdStatus(configData.jobad_status_for_calling || "Current")
                            // setApplicationStatus(String(configData.application_status_for_calling || ""))
                            // setCallingTime(String(configData.calling_time_after_status_update || "15"))
                            // setUnsuccessfulStatus(String(configData.status_for_unsuccessful_call || ""))
                            // setSuccessfulStatus(String(configData.status_for_successful_call || ""))
                            // setPlacedStatus(String(configData.status_when_call_is_placed || ""))

                            // Load flattened timeline fields
                            const loadedTimeline = INITIAL_TIMELINE.map(dayInfo => {
                                const dayKey = dayInfo.day.toLowerCase()
                                return {
                                    ...dayInfo,
                                    isActive: configData[`${dayKey}_enabled`] ?? dayInfo.isActive,
                                    startTime: configData[`${dayKey}_start`] || dayInfo.startTime,
                                    endTime: configData[`${dayKey}_end`] || dayInfo.endTime,
                                }
                            })
                            setTimeline(loadedTimeline)
                        }
                    } catch (configErr) {
                        // No config yet
                    }
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

    const handleTimelineChange = (index: number, field: keyof TimelineDay, value: any) => {
        const newTimeline = [...timeline]
        newTimeline[index] = { ...newTimeline[index], [field]: value }
        setTimeline(newTimeline)
    }

    const parseTime = (timeStr: string) => {
        // Regex to match "HH:MM am/pm" where HH and MM can be empty or digits
        const match = timeStr.match(/^([^:]*):([^ ]*) (am|pm)$/)
        if (match) {
            return { hh: match[1], mm: match[2], period: match[3] }
        }
        return { hh: "09", mm: "00", period: "am" }
    }

    const updateTimePart = (index: number, field: "startTime" | "endTime", part: "hh" | "mm" | "period", value: string) => {
        const currentVal = timeline[index][field]
        const { hh, mm, period } = parseTime(currentVal)
        let newTime = ""
        if (part === "hh") newTime = `${value}:${mm} ${period}`
        else if (part === "mm") newTime = `${hh}:${value} ${period}`
        else if (part === "period") newTime = `${hh}:${mm} ${value}`

        handleTimelineChange(index, field, newTime)
    }

    const convertTo24Hour = (timeStr: string) => {
        // Now timeStr is already in HH:mm:ss format from Select
        return timeStr || "00:00:00"
    }

    const handleSaveConfiguration = async () => {
        setError("")
        const codeParam = searchParams.get("code")

        if (codeParam === "AICALL191") {
            try {
                setIsSaving(true)
                const payload = {
                    phone_uid: phoneNumberUid,
                    voice_id: voiceId,
                    restaurant_name: restaurantName,
                    assistant_name: assistantName
                }

                if (isUpdateMode) {
                    await flowService.updateDinerConfig(payload)
                } else {
                    await flowService.saveDinerConfig(payload)
                }

                setResultTitle("Success")
                setResultMessage(isUpdateMode ? "Configuration updated successfully!" : "Configuration saved successfully!")
                setShowResultDialog(true)
            } catch (err: any) {
                console.error("Error saving diner configuration:", err)
                setResultTitle("Error")
                setResultMessage(err.response?.data?.message || err.message || "Failed to save configuration")
                setShowResultDialog(true)
            } finally {
                setIsSaving(false)
            }
            return
        }

        try {
            setIsSaving(true)

            const payload: any = {
                platform_uid: platformUid,
                phone_uid: phoneNumberUid,
            }

            // Add flattened timeline fields in 24h format
            timeline.forEach(dayInfo => {
                const dayKey = dayInfo.day.toLowerCase()
                payload[`${dayKey}_enabled`] = dayInfo.isActive
                payload[`${dayKey}_start`] = convertTo24Hour(dayInfo.startTime)
                payload[`${dayKey}_end`] = convertTo24Hour(dayInfo.endTime)
            })

            if (isUpdateMode) {
                await flowService.updateCallConfig(payload)
            } else {
                await flowService.createCallConfig(payload)
            }

            setResultTitle("Success")
            setResultMessage(isUpdateMode ? "Configuration updated successfully!" : "Configuration saved successfully!")
            setShowResultDialog(true)
            setIsEditing(false) // Exit editing mode on success

            // Hit GET API to refresh data and transition UI to Running state
            try {
                const configRes = await flowService.getCallConfig()
                const configList = configRes.data.results

                if (configList && configList.length > 0) {
                    const configData = configList[0]
                    setIsUpdateMode(true)

                    setPlatformUid(configData.platform?.uid || "")
                    setPhoneNumberUid(configData.phone?.uid || "")
                    setVoiceId(configData.voice_id || "")
                    setMyFlowUid(configData.my_flow?.uid || "")

                    // Load flattened timeline fields
                    const loadedTimeline = INITIAL_TIMELINE.map(dayInfo => {
                        const dayKey = dayInfo.day.toLowerCase()
                        return {
                            ...dayInfo,
                            isActive: configData[`${dayKey}_enabled`] ?? dayInfo.isActive,
                            startTime: configData[`${dayKey}_start`] || dayInfo.startTime,
                            endTime: configData[`${dayKey}_end`] || dayInfo.endTime,
                        }
                    })
                    setTimeline(loadedTimeline)
                }
            } catch (configErr) {
                // Ignore refresh error
            }

        } catch (err: any) {
            console.error("Error saving configuration:", err)

            setResultTitle("Error")
            const errorData = err.response?.data
            let errorMessage = "Failed to save configuration"

            if (errorData && typeof errorData === "object" && !Array.isArray(errorData)) {
                const errorMessages = Object.entries(errorData).map(([key, value]: [string, any]) => {
                    const field = key.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())
                    const error = Array.isArray(value) ? value[0] : value
                    return `${field}: ${error}`
                })
                if (errorMessages.length > 0) {
                    errorMessage = errorMessages.join("\n")
                }
            } else if (Array.isArray(errorData) && errorData.length > 0) {
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

    const handleReleaseFlow = async () => {
        if (!myFlowUid) {
            setError("No flow UID found to release")
            return
        }

        try {
            setIsSaving(true)
            await flowService.releaseFlow(myFlowUid)
            setResultTitle("Success")
            setResultMessage("Flow released successfully!")
            setShowResultDialog(true)
            // After clicking OK on Success, it will redirect via handleDialogClose update
        } catch (err: any) {
            console.error("Error releasing flow:", err)
            setError(err.response?.data?.message || err.message || "Failed to release flow")
        } finally {
            setIsSaving(false)
            setShowReleaseDialog(false)
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
        if (resultTitle === "Success" && resultMessage === "Flow released successfully!") {
            router.push("/dashboard/phone-call-flows")
        }
        // otherwise stay on page for other successes
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <LoaderOverlay
                isLoading={isLoading || isSaving}
            />

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-6 mb-2">
                        <button onClick={() => router.back()} className="h-8 w-8 -ml-2 cursor-pointer rounded-full transition-all duration-300 hover:scale-125 text-gray-900 dark:text-gray-100">
                            <ArrowLeft className="h-8 w-8" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Configure – {featureName || "Loading..."}</h1>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {searchParams.get("code") === "AICALL191" ? (
                        <>
                            {/* Left Column */}
                            <div className="space-y-8">
                                <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">General Settings</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Phone Number</Label>
                                            <Select value={phoneNumberUid} onValueChange={handleSelectChange(setPhoneNumberUid)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select phone number" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {phoneNumberOptions.map(p => (
                                                        <SelectItem key={p.id} value={p.uid} className="dark:text-gray-100">
                                                            {p.phone_number} {p.friendly_name ? `(${p.friendly_name})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Need another number? <Link href="/dashboard/phone-number-buy" className="text-blue-600 dark:text-blue-400 hover:underline">Buy New AI Phone Number</Link>
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ElevenLabs Voice ID (Optional)</Label>
                                            <Input
                                                value={voiceId}
                                                onChange={(e) => setVoiceId(e.target.value)}
                                                placeholder="Enter Voice ID"
                                                className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Assistant Settings</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Restaurant Name</Label>
                                            <Input
                                                value={restaurantName}
                                                onChange={(e) => setRestaurantName(e.target.value)}
                                                placeholder="Enter Restaurant Name"
                                                className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Assistant Name</Label>
                                            <Input
                                                value={assistantName}
                                                onChange={(e) => setAssistantName(e.target.value)}
                                                placeholder="Enter Assistant Name"
                                                className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Left Column */}
                            <div className="space-y-8 flex flex-col h-full">
                                <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 flex-1">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">General Settings</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Platform</Label>
                                            <Select disabled={isUpdateMode && !isEditing} value={platformUid} onValueChange={handleSelectChange(setPlatformUid)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select Platform" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {platformOptions.map(p => (
                                                        <SelectItem key={p.id} value={p.uid} className="dark:text-gray-100">{p.platform.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select Phone Number</Label>
                                            <Select disabled={isUpdateMode && !isEditing} value={phoneNumberUid} onValueChange={handleSelectChange(setPhoneNumberUid)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select phone number" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {phoneNumberOptions.map(p => (
                                                        <SelectItem key={p.id} value={p.uid} className="dark:text-gray-100">
                                                            {p.phone_number} {p.friendly_name ? `(${p.friendly_name})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                Need another number? <Link href="/dashboard/phone-number-buy" className="text-blue-600 dark:text-blue-400 hover:underline">Buy New AI Phone Number</Link>
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                {/* <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Interview Questions</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
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
                                                        className={`h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${q.isSaved ? "border-green-500 bg-green-50/20 dark:bg-green-500/10 dark:border-green-600" : ""}`}
                                                        disabled={q.isSaved}
                                                    />
                                                    <div className="flex gap-2 shrink-0">
                                                        {!q.isSaved ? (
                                                            <Button size="sm" variant="outline" onClick={() => handleSaveQuestion(index)} className="h-12 px-5 border-2 rounded-xl font-bold cursor-pointer dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700" >Save</Button>
                                                        ) : (
                                                            <div className="h-12 w-12 flex items-center justify-center text-green-500 dark:text-green-400" title="Saved"><CheckCircle2 className="h-6 w-6" /></div>
                                                        )}
                                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(index)} className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl cursor-pointer"><Trash2 className="h-5 w-5" /></Button>
                                                    </div>
                                                </div>
                                                {!q.value && !q.isSaved && suggestedQuestions.length > 0 && (
                                                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Suggested Questions:</p>
                                                        <div className="flex flex-col gap-2">
                                                        {suggestedQuestions.map(s => (
                                                                <div key={s.id} onClick={() => handleSuggestionClick(index, s.question)} className="text-sm p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg cursor-pointer transition-all shadow-sm dark:text-gray-100">{s.question}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                        )}
                    </div>
                                        ))}
                                        <Button onClick={handleAddQuestion} variant="outline" className="h-12 px-6 border-2 border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100 font-bold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 transition-all">
                                            <Plus className="h-4 w-4 mr-2" /> Add More Question
                                        </Button>
                                    </div>
                                </Card> */}
                            </div>
                                                            

                            {/* Right Column */}
                            <div className="space-y-8 flex flex-col h-full">
                                <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 flex-1">
                                    <div className="flex items-center justify-between gap-2 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Call Active Timeline</h2>
                                        </div>
                                        {isUpdateMode && !isEditing && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full border border-green-100 dark:border-green-800/50">
                                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Running</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-12 gap-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                            <div className="col-span-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Day</div>
                                            <div className="col-span-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Start Time</div>
                                            <div className="col-span-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">End Time</div>
                                            <div className="col-span-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Active</div>
                                        </div>

                                        {timeline.map((item, index) => (
                                            <div key={item.day} className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {item.day}
                                                </div>
                                                <div className="col-span-4">
                                                    <Select
                                                        disabled={isUpdateMode && !isEditing}
                                                        value={item.startTime}
                                                        onValueChange={(val) => handleTimelineChange(index, "startTime", val)}
                                                    >
                                                        <SelectTrigger className="h-10 border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm">
                                                            <SelectValue placeholder="Start Time" />
                                                        </SelectTrigger>
                                                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                            {TIME_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value} className="dark:text-gray-100">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-4">
                                                    <Select
                                                        disabled={isUpdateMode && !isEditing}
                                                        value={item.endTime}
                                                        onValueChange={(val) => handleTimelineChange(index, "endTime", val)}
                                                    >
                                                        <SelectTrigger className="h-10 border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 text-sm">
                                                            <SelectValue placeholder="End Time" />
                                                        </SelectTrigger>
                                                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                            {TIME_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value} className="dark:text-gray-100">
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <Checkbox
                                                        disabled={isUpdateMode && !isEditing}
                                                        checked={item.isActive}
                                                        onCheckedChange={(checked) => handleTimelineChange(index, "isActive", checked)}
                                                        className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* <Card className="p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Automation Logic</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Job Ad Status for Calling</Label>
                                            <Select value={jobAdStatus} onValueChange={handleSelectChange(setJobAdStatus)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="Current" className="dark:text-gray-100">Current</SelectItem>
                                                    <SelectItem value="Expired" className="dark:text-gray-100">Expired</SelectItem>
                                                    <SelectItem value="Draft" className="dark:text-gray-100">Draft</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Application Status for Calling</Label>
                                            <Select value={applicationStatus} onValueChange={handleSelectChange(setApplicationStatus)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)} className="dark:text-gray-100">{s.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calling Time After Status Update</Label>
                                            <Select value={callingTime} onValueChange={handleSelectChange(setCallingTime)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select time" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {CALLING_TIME_OPTIONS.map(opt => (<SelectItem key={opt.value} value={String(opt.value)} className="dark:text-gray-100">{opt.label}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status When Call is Placed</Label>
                                            <Select value={placedStatus} onValueChange={handleSelectChange(setPlacedStatus)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)} className="dark:text-gray-100">{s.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status for Successful Call</Label>
                                            <Select value={successfulStatus} onValueChange={handleSelectChange(setSuccessfulStatus)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)} className="dark:text-gray-100">{s.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status for Unsuccessful Call</Label>
                                            <Select value={unsuccessfulStatus} onValueChange={handleSelectChange(setUnsuccessfulStatus)}>
                                                <SelectTrigger className="h-12 border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-gray-100">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                                    <SelectItem value="_CLEAR_" className="text-gray-400 dark:text-gray-500 font-medium">Remove Selection</SelectItem>
                                                    {statusOptions.map(s => (<SelectItem key={s.id} value={String(s.id)} className="dark:text-gray-100">{s.name}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Card> */}
                            </div>
                            <Card className="lg:col-span-2 p-8 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Application Status</h2>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                                    Please create the following 4 statuses in your ATS/CRM under the Job Application's Status creation section (if they are not already present):
                                                                </p>
                                                                <ul className="mt-4 space-y-2 text-sm font-semibold text-gray-700 dark:text-gray-300 list-disc list-inside">
                                                                    <li>Applied</li>
                                                                    <li>AI Call - No Reply</li>
                                                                    <li>AI Call - Link Sent</li>
                                                                    <li>Unsuccessful</li>
                                                                </ul>
                                                            </Card>
                        </>

                    )}
                </div>

                {/* Bottom Save Bar */}
                <div className="mt-12 flex justify-center gap-4">
                    {searchParams.get("code") === "AICALL191" ? (
                        <Button
                            size="lg"
                            onClick={handleSaveConfiguration}
                            disabled={isSaving}
                            className="h-14 bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                        >
                            {isSaving ? (isUpdateMode ? "Updating..." : "Saving...") : (isUpdateMode ? "Update Configure" : "Save Configure")}
                        </Button>
                    ) : (
                        <>
                            {!isUpdateMode ? (
                                <Button
                                    size="lg"
                                    onClick={handleSaveConfiguration}
                                    disabled={isSaving}
                                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                                >
                                    {isSaving ? "Activating..." : "Active Now"}
                                </Button>
                            ) : (
                                <>
                                    {!isEditing ? (
                                        <Button
                                            size="lg"
                                            onClick={() => setIsEditing(true)}
                                            className="h-14 bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                                        >
                                            Edit Configure
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            onClick={handleSaveConfiguration}
                                            disabled={isSaving}
                                            className="h-14 bg-[#0f172a] dark:bg-gray-100 hover:bg-[#1e293b] dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                                        >
                                            {isSaving ? "Updating..." : "Update Configure"}
                                        </Button>
                                    )}
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => setShowReleaseDialog(true)}
                                        className="h-14 border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-lg px-12 rounded-xl transition-all shadow-lg min-w-[280px]"
                                    >
                                        Release Flow
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
                <AlertDialogContent className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={resultTitle === "Error" ? "text-red-500 dark:text-red-400 text-xl font-bold" : "text-blue-600 dark:text-blue-400 text-xl font-bold"}>
                            {resultTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-base font-medium">
                            {resultMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogAction onClick={handleDialogClose} className="h-12 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold rounded-xl px-8 border-none">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showReleaseDialog} onOpenChange={setShowReleaseDialog}>
                <AlertDialogContent className="rounded-2xl dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500 dark:text-red-400 text-xl font-bold">
                            Release Flow
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-base font-medium">
                            Are you sure you want to release this flow? This action will delete the current configuration.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowReleaseDialog(false)}
                            className="h-12 border-2 rounded-xl px-8 font-bold dark:border-gray-700 dark:text-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReleaseFlow}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-8 border-none"
                        >
                            Release Flow
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
