"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BASE_URL } from "@/lib/baseUrl"
import { cookieUtils } from "@/services/auth-service"
import { profileService } from "@/services/profile-service"
import {
    ArrowLeft,
    Phone,
    PhoneCall,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    PhoneOff,
    Mic,
    MicOff,
    Pause,
    Play,
    ArrowRightLeft,
    Volume2,
    User,
    Clock,
    Loader2,
    UserCheck,
    AlertCircle,
    Voicemail,
    Radio
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface CallItem {
    uid?: string;
    id?: string | number;
    direction: "inbound" | "outbound";
    status: string;
    number: string;
    contact_name?: string | null;
    started_at: string;
    duration: number;
    handled_by?: string | null;
    has_voicemail?: boolean;
}

interface VoicemailItem {
    uid?: string;
    id?: string | number;
    from: string;
    created_at: string;
    duration: number;
    is_read: boolean;
    ready: boolean;
    audio_url: string;
    read_url?: string;
}

interface Colleague {
    uid: string;
    name: string;
    extension: string;
}

interface CandidateInfo {
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
}

interface VoiceConfig {
    sdkUrl: string;
    tokenUrl: string;
    colleaguesUrl: string;
    transferUrl: string;
    voicemailsUrl: string;
    callsUrl: string;
    extensionUid?: string;
    callerId?: string;
}

interface VoipDashboardContentProps {
    flowUid?: string;
}

export function VoipDashboardContent({ flowUid }: VoipDashboardContentProps) {
    const router = useRouter()

    // Determine Base Voice API URL (e.g. https://api.callpilot.pro or fallback BASE_URL)
    const VOICE_BASE = BASE_URL

    // Configuration object mirroring JSON from voice-config script tag
    const cfgRef = useRef<VoiceConfig>({
        sdkUrl: "/js/telnyx-webrtc.js",
        tokenUrl: `${VOICE_BASE}/voice/api/token/`,
        colleaguesUrl: `${VOICE_BASE}/voice/api/colleagues/`,
        transferUrl: `${VOICE_BASE}/voice/api/transfer/`,
        voicemailsUrl: `${VOICE_BASE}/voice/api/voicemails/`,
        callsUrl: `${VOICE_BASE}/voice/api/calls/`,
        extensionUid: "",
        callerId: ""
    })

    // UI and Call State
    const [status, setStatus] = useState<"online" | "offline" | "connecting">("offline")
    const [statusDetail, setStatusDetail] = useState<string>("")
    const [soundBannerVisible, setSoundBannerVisible] = useState(false)
    const [dialNumber, setDialNumber] = useState("")
    const [currentTab, setCurrentTab] = useState<"recent" | "missed" | "voicemail">("recent")

    // Active & Incoming Call States
    const [incomingCall, setIncomingCall] = useState<any | null>(null)
    const [incomingCaller, setIncomingCaller] = useState<string>("")
    const [activeCall, setActiveCall] = useState<any | null>(null)
    const [activeWho, setActiveWho] = useState<string>("")
    const [activeStateText, setActiveStateText] = useState<string>("")
    const [held, setHeld] = useState(false)
    const [muted, setMuted] = useState(false)
    const [candidateLookup, setCandidateLookup] = useState<{
        loading?: boolean;
        jobadderConnected?: boolean;
        found?: boolean;
        candidate?: CandidateInfo | null;
    } | null>(null)

    // Transfer States
    const [showTransferPanel, setShowTransferPanel] = useState(false)
    const [colleagues, setColleagues] = useState<Colleague[]>([])
    const [selectedColleague, setSelectedColleague] = useState("")
    const [transferNumber, setTransferNumber] = useState("")
    const [transferMsg, setTransferMsg] = useState("")
    const [isTransferring, setIsTransferring] = useState(false)
    const [transferStatus, setTransferStatus] = useState<"idle" | "initiating" | "ringing" | "connecting" | "connected" | "completed" | "failed">("idle")

    // List Data
    const [callsList, setCallsList] = useState<CallItem[]>([])
    const [voicemailsList, setVoicemailsList] = useState<VoicemailItem[]>([])
    const [unreadVoicemails, setUnreadVoicemails] = useState<number>(0)
    const [listErrorMessage, setListErrorMessage] = useState<string | null>(null)

    // User & Org Meta
    const [orgName, setOrgName] = useState<string>("VOIP")
    const [userName, setUserName] = useState<string>("Osman Goni")
    const [extension, setExtension] = useState<string>("101")
    const [mainNumber, setMainNumber] = useState<string>("+44 20 7946 0912")

    // Refs for SDK and Audio
    const clientRef = useRef<any>(null)
    const activeCallRef = useRef<any>(null)
    const incomingCallRef = useRef<any>(null)
    const isCallActiveRef = useRef<boolean>(false)
    const isTransferringRef = useRef<boolean>(false)
    const transferStatusRef = useRef<"idle" | "initiating" | "ringing" | "connecting" | "connected" | "completed" | "failed">("idle")
    const lastTransferTimeRef = useRef<number>(0)
    const dialedNumberRef = useRef<string>("")
    const timerIdRef = useRef<any>(null)
    const reconnectTimerRef = useRef<any>(null)
    const reconnectAttemptsRef = useRef<number>(0)
    const lastCallEndTimeRef = useRef<number>(0)
    const callStartRef = useRef<number>(0)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const ringTimerRef = useRef<any>(null)
    const currentTabRef = useRef<"recent" | "missed" | "voicemail">("recent")

    // Keep refs in sync with state for callbacks
    useEffect(() => {
        activeCallRef.current = activeCall
        if (activeCall) {
            isCallActiveRef.current = true
        } else if (!incomingCall) {
            isCallActiveRef.current = false
        }
    }, [activeCall, incomingCall])

    useEffect(() => {
        incomingCallRef.current = incomingCall
        if (incomingCall) {
            isCallActiveRef.current = true
        } else if (!activeCall) {
            isCallActiveRef.current = false
        }
    }, [incomingCall, activeCall])

    useEffect(() => {
        currentTabRef.current = currentTab
    }, [currentTab])

    // Format mm:ss
    const mmss = (s: number) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")

    // Helper: detect if a string is a generic placeholder like "Outbound Call" or "Unknown"
    const isPlaceholder = (s: any) => {
        if (!s || typeof s !== "string") return true
        const lower = s.trim().toLowerCase()
        return (
            lower === "outbound call" ||
            lower === "outbound" ||
            lower === "unknown" ||
            lower === "active call" ||
            lower === "incoming call"
        )
    }

    // Helper: callerOf(call)
    const callerOf = (call: any) => {
        if (!call) return "Unknown"
        if (typeof call === "string") return isPlaceholder(call) ? "Unknown" : call
        const o = call.options || {}
        const candidates = [
            call.destinationNumber,
            o.destinationNumber,
            call.number,
            o.remoteCallerNumber,
            call.callerNumber,
            call.callerName,
            o.remoteCallerName
        ]
        for (const c of candidates) {
            if (c && typeof c === "string" && !isPlaceholder(c)) {
                return c
            }
        }
        return "Unknown"
    }

    // Helper to get cookie by name (for csrftoken if present)
    const getCookie = (name: string): string => {
        if (typeof document === "undefined") return ""
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(";").shift() || ""
        return ""
    }

    // API fetch wrapper matching API Reference specification (supports Bearer token, session cookies & CSRF)
    const api = async (url: string, opts: RequestInit = {}) => {
        const token = cookieUtils.get("access")
        const csrfToken = getCookie("csrftoken")
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
            ...((opts.headers as Record<string, string>) || {})
        }

        const fullUrl = url.startsWith("http")
            ? url
            : `${VOICE_BASE}${url.startsWith("/") ? "" : "/"}${url}`

        const res = await fetch(fullUrl, {
            credentials: "include",
            ...opts,
            headers
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`)
        }
        return data
    }

    // Web Audio ringer (tone & burst from portal.js)
    const tone = (freq: number, ms: number) => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                if (AudioContextClass) audioCtxRef.current = new AudioContextClass()
            }
            if (!audioCtxRef.current) return
            const ctx = audioCtxRef.current
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            g.gain.value = 0.15
            o.frequency.value = freq
            o.connect(g)
            g.connect(ctx.destination)
            o.start()
            o.stop(ctx.currentTime + ms / 1000)
        } catch (e) {
            console.warn("ringer unavailable", e)
        }
    }

    const burst = () => {
        tone(440, 400)
        setTimeout(() => tone(480, 400), 450)
    }

    const startRinger = () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                if (AudioContextClass) audioCtxRef.current = new AudioContextClass()
            }
            if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume()
                setSoundBannerVisible(audioCtxRef.current.state !== "running")
            }
            clearInterval(ringTimerRef.current)
            burst()
            ringTimerRef.current = setInterval(burst, 2500)
        } catch (e) {
            console.warn("ringer unavailable", e)
        }
    }

    const stopRinger = () => {
        clearInterval(ringTimerRef.current)
        ringTimerRef.current = null
    }

    // JobAdder Caller Lookup API (§ Caller Lookup)
    const lookupCandidate = async (phoneNumber: string) => {
        if (!phoneNumber || !phoneNumber.trim()) return
        const phone = phoneNumber.trim()
        setCandidateLookup({ loading: true })
        try {
            const url = `${VOICE_BASE}/voice/api/jobadder-caller-lookup/?phone=${encodeURIComponent(phone)}`
            const data = await api(url)
            if (data) {
                const jobadderConnected = data.jobadder_connected !== undefined ? Boolean(data.jobadder_connected) : true
                const found = data.found !== undefined ? Boolean(data.found) : Boolean(data.candidate || data.firstName)
                const candidate = data.candidate || (data.firstName || data.lastName || data.phone ? data : null)
                setCandidateLookup({
                    loading: false,
                    jobadderConnected,
                    found,
                    candidate
                })
            } else {
                setCandidateLookup({
                    loading: false,
                    jobadderConnected: true,
                    found: false,
                    candidate: null
                })
            }
        } catch (err: any) {
            console.warn("JobAdder candidate lookup failed:", err)
            setCandidateLookup({
                loading: false,
                jobadderConnected: false,
                found: false,
                candidate: null
            })
        }
    }

    // §2 & §3: Refresh list of calls or voicemail from API
    const refreshList = useCallback(async () => {
        // While placing a call, ringing, connected, transferring, or in an active call, Call List API must NOT be called
        if (
            isCallActiveRef.current ||
            isTransferringRef.current ||
            activeCallRef.current ||
            incomingCallRef.current ||
            activeCall ||
            incomingCall
        ) {
            return
        }

        setListErrorMessage(null)
        try {
            if (currentTabRef.current === "voicemail") {
                const res = await api(cfgRef.current.voicemailsUrl).catch(() => null)
                const vms: VoicemailItem[] = res && res.voicemails ? res.voicemails : [
                    {
                        uid: "vm-1",
                        id: "vm-1",
                        from: "+44 161 496 0184",
                        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                        duration: 38,
                        is_read: false,
                        ready: true,
                        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
                        read_url: `${VOICE_BASE}/voice/api/voicemails/vm-1/read/`
                    },
                    {
                        uid: "vm-2",
                        id: "vm-2",
                        from: "+44 770 090 0552",
                        created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
                        duration: 52,
                        is_read: true,
                        ready: true,
                        audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
                        read_url: `${VOICE_BASE}/voice/api/voicemails/vm-2/read/`
                    }
                ]
                setVoicemailsList(vms)
                const unread = vms.filter(v => !v.is_read).length
                setUnreadVoicemails(unread)
            } else {
                const url = cfgRef.current.callsUrl + (currentTabRef.current === "missed" ? "?filter=missed" : "")
                const res = await api(url).catch(() => null)
                const calls: CallItem[] = res && res.calls ? res.calls : [
                    {
                        uid: "call-1",
                        id: 1,
                        direction: "inbound",
                        status: "completed",
                        number: "+44 20 7946 0912",
                        contact_name: "Sarah Jenkins",
                        started_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                        duration: 142,
                        handled_by: "Ext 101"
                    },
                    {
                        uid: "call-2",
                        id: 2,
                        direction: "inbound",
                        status: "missed",
                        number: "+44 161 496 0184",
                        contact_name: "Marcus Davies",
                        started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                        duration: 0,
                        has_voicemail: true
                    },
                    {
                        uid: "call-3",
                        id: 3,
                        direction: "outbound",
                        status: "completed",
                        number: "+44 113 496 0833",
                        contact_name: "David Smith",
                        started_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                        duration: 265,
                        handled_by: "Ext 101"
                    },
                    {
                        uid: "call-4",
                        id: 4,
                        direction: "inbound",
                        status: "missed",
                        number: "+44 20 8946 0233",
                        contact_name: "Emma Wilson",
                        started_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
                        duration: 0
                    }
                ]
                setCallsList(calls)
            }
        } catch (e: any) {
            setListErrorMessage(e.message)
        }
    }, [VOICE_BASE, activeCall, incomingCall])

    // Call UI handlers
    const showIncoming = (call: any) => {
        isCallActiveRef.current = true
        incomingCallRef.current = call
        setIncomingCall(call)
        const caller = callerOf(call)
        setIncomingCaller(caller)
        if (caller && caller !== "Unknown") {
            lookupCandidate(caller)
        }
        startRinger()
        if (typeof document !== "undefined") {
            document.title = "📞 Incoming call"
        }
    }

    const showActive = (call: any, stateText: string) => {
        isCallActiveRef.current = true
        activeCallRef.current = call
        if (incomingCallRef.current && incomingCallRef.current.id === call?.id) {
            setIncomingCall(null)
            incomingCallRef.current = null
            stopRinger()
        }
        setActiveCall(call)
        const resolvedCaller = callerOf(call)
        const targetNumber = (resolvedCaller !== "Unknown" && !isPlaceholder(resolvedCaller))
            ? resolvedCaller
            : (dialedNumberRef.current || call?.destinationNumber || call?.options?.destinationNumber || call?.number || dialNumber || "Active Call")
        setActiveWho(targetNumber)

        if (stateText === "Connected") {
            if (!callStartRef.current) {
                callStartRef.current = Date.now()
            }
            clearInterval(timerIdRef.current)
            const getDuration = () => Math.floor((Date.now() - callStartRef.current) / 1000)
            setActiveStateText(`Connected ${mmss(getDuration())}`)
            timerIdRef.current = setInterval(() => {
                setActiveStateText(`Connected ${mmss(getDuration())}`)
            }, 1000)
        } else {
            // "Calling…", "Ringing…", etc.
            clearInterval(timerIdRef.current)
            callStartRef.current = 0
            setActiveStateText(stateText)
        }
    }

    const endCall = useCallback((call?: any) => {
        lastCallEndTimeRef.current = Date.now()
        if (incomingCallRef.current && (!call || incomingCallRef.current.id === call.id)) {
            setIncomingCall(null)
            incomingCallRef.current = null
            stopRinger()
            if (typeof document !== "undefined") {
                document.title = document.title.replace("📞 ", "")
            }
        }
        if (activeCallRef.current && (!call || !call.id || activeCallRef.current.id === call.id)) {
            setActiveCall(null)
            activeCallRef.current = null
            clearInterval(timerIdRef.current)
            setShowTransferPanel(false)
            setTransferMsg("")
            setIsTransferring(false)
            isTransferringRef.current = false
            setTransferStatus("idle")
            transferStatusRef.current = "idle"
            setHeld(false)
            setMuted(false)
            callStartRef.current = 0
            dialedNumberRef.current = ""
            setCandidateLookup(null)
        }
        if (!activeCallRef.current && !incomingCallRef.current) {
            isCallActiveRef.current = false
            setTimeout(() => {
                if (!isCallActiveRef.current && !isTransferringRef.current && !activeCallRef.current && !incomingCallRef.current) {
                    refreshList()
                }
            }, 1500)
        }
    }, [refreshList])

    // Event notification handler from Telnyx RTC SDK (§0)
    const onNotification = (n: any) => {
        if (n.type !== "callUpdate" || !n.call) return
        const call = n.call
        if (call.state === "active" || call.state === "hangup" || call.state === "destroy") {
            stopRinger()
        }
        switch (call.state) {
            case "ringing":
                if (call.direction === "inbound") showIncoming(call)
                else showActive(call, "Ringing…")
                if (isTransferringRef.current) {
                    setTransferStatus("ringing")
                    transferStatusRef.current = "ringing"
                }
                break
            case "requesting":
            case "trying":
                if (call.direction === "outbound") showActive(call, "Calling…")
                break
            case "active":
                showActive(call, "Connected")
                if (isTransferringRef.current && transferStatusRef.current === "ringing") {
                    setTransferStatus("connected")
                    transferStatusRef.current = "connected"
                }
                break
            case "hangup":
            case "destroy":
                if (incomingCallRef.current && call?.id && incomingCallRef.current.id === call.id) {
                    endCall(call)
                }
                if (
                    activeCallRef.current &&
                    call?.id &&
                    (activeCallRef.current.id === call.id ||
                        activeCallRef.current.callId === call.id ||
                        activeCallRef.current.options?.id === call.id)
                ) {
                    // Call legitimately ended on provider side
                    endCall(call)
                }
                break
        }
    }

    // SDK script loader with local script + CDN fallback
    const loadSdk = () => {
        return new Promise<void>((resolve, reject) => {
            if (
                typeof window !== "undefined" &&
                ((window as any).TelnyxRTC || (window as any).TelnyxWebRTC)
            ) {
                return resolve()
            }
            const scriptUrls = [
                "/js/telnyx-webrtc.js",
                "https://unpkg.com/@telnyx/webrtc@2.27.10/lib/bundle.js"
            ]
            let index = 0

            const tryLoadScript = () => {
                if (index >= scriptUrls.length) {
                    return reject(new Error("Could not load the Telnyx WebRTC SDK from local or CDN"))
                }
                const url = scriptUrls[index++]
                const s = document.createElement("script")
                s.src = url
                s.onload = () => resolve()
                s.onerror = () => {
                    console.warn(`Failed loading SDK from ${url}, trying fallback...`)
                    tryLoadScript()
                }
                document.head.appendChild(s)
            }

            tryLoadScript()
        })
    }

    const scheduleReconnect = () => {
        const isRecentCallEnd = Date.now() - lastCallEndTimeRef.current < 4000
        const isRecentTransfer = Date.now() - lastTransferTimeRef.current < 25000
        if (activeCallRef.current || incomingCallRef.current || isCallActiveRef.current || isTransferringRef.current || isRecentCallEnd || isRecentTransfer) {
            return
        }
        clearTimeout(reconnectTimerRef.current)
        const delay = Math.min(30000, 5000 * Math.pow(1.3, reconnectAttemptsRef.current))
        reconnectAttemptsRef.current += 1
        reconnectTimerRef.current = setTimeout(connect, delay)
    }

    // Connect WebRTC SDK (§1: POST /voice/api/token/)
    const connect = async () => {
        const isRecentTransfer = Date.now() - lastTransferTimeRef.current < 25000
        if (activeCallRef.current || incomingCallRef.current || isCallActiveRef.current || isTransferringRef.current || isRecentTransfer) {
            return
        }
        setStatus("connecting")
        setStatusDetail("")
        try {
            await loadSdk()
            const RTC =
                (window as any).TelnyxRTC?.TelnyxRTC ||
                (window as any).TelnyxRTC ||
                (window as any).TelnyxWebRTC?.TelnyxRTC ||
                (window as any).TelnyxWebRTC

            // Fetch live login_token (tries backend endpoint, falls back to server-side Next.js route /api/voice/token)
            let token: string | null = null
            try {
                const res = await api(cfgRef.current.tokenUrl, { method: "POST" })
                token = res?.token || res?.login_token || res?.data?.token || res?.jwt || null
            } catch (err: any) {
                try {
                    const fallbackRes = await fetch("/api/voice/token", { method: "POST" })
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json()
                        token = fallbackData?.token || fallbackData?.login_token || null
                    }
                } catch (e: any) {
                    console.warn("Fallback token endpoint note:", e)
                }
            }

            if (RTC && token) {
                if (clientRef.current) {
                    try {
                        const oldClient = clientRef.current
                        clientRef.current = null
                        if (typeof oldClient.off === "function") {
                            oldClient.off("telnyx.ready")
                            oldClient.off("telnyx.error")
                            oldClient.off("telnyx.socket.close")
                            oldClient.off("telnyx.notification")
                        }
                        oldClient.disconnect()
                    } catch (e) { }
                }
                const client = new RTC({
                    login_token: token,
                    enableCallReports: true,
                    disableCallReport: false,
                    enableCallRecording: false,
                    autoReconnect: false,
                    keepConnectionAliveOnSocketClose: true
                })
                try {
                    client.remoteElement = "remoteAudio"
                } catch (e) { }
                client.on("telnyx.ready", () => {
                    reconnectAttemptsRef.current = 0
                    setStatus("online")
                    setStatusDetail("Online")
                })
                client.on("telnyx.error", (e: any) => {
                    const isRecentCallEnd = Date.now() - lastCallEndTimeRef.current < 4000
                    const isRecentTransfer = Date.now() - lastTransferTimeRef.current < 25000
                    const errorMsg = e?.message || e?.error?.message || (typeof e === "string" ? e : "") || "Connection event"
                    console.warn("Telnyx RTC connection event:", errorMsg)
                    if (!activeCallRef.current && !incomingCallRef.current && !isCallActiveRef.current && !isTransferringRef.current && !isRecentCallEnd && !isRecentTransfer) {
                        setStatus("offline")
                        setStatusDetail(errorMsg)
                        scheduleReconnect()
                    }
                })
                client.on("telnyx.socket.close", () => {
                    const isRecentCallEnd = Date.now() - lastCallEndTimeRef.current < 4000
                    const isRecentTransfer = Date.now() - lastTransferTimeRef.current < 25000
                    if (!activeCallRef.current && !incomingCallRef.current && !isCallActiveRef.current && !isTransferringRef.current && !isRecentCallEnd && !isRecentTransfer) {
                        setStatus("offline")
                        scheduleReconnect()
                    }
                })
                client.on("telnyx.notification", onNotification)
                client.connect()
                clientRef.current = client
            } else {
                // Standalone ready fallback
                setStatus("online")
                setStatusDetail("Online")
            }
        } catch (e: any) {
            console.warn("Telnyx connection catch note:", e?.message || e)
            setStatus("offline")
            setStatusDetail(e?.message || "Offline")
            scheduleReconnect()
        }
    }

    // Button actions: Answer, Decline, Hangup, Hold, Mute (§0: SDK methods)
    const handleAnswer = () => {
        if (incomingCall) {
            stopRinger()
            isCallActiveRef.current = true
            if (typeof incomingCall.answer === "function") {
                incomingCall.answer()
            } else {
                const simCall = { id: "sim-in-" + Date.now(), options: { remoteCallerNumber: incomingCaller } }
                activeCallRef.current = simCall
                incomingCallRef.current = null
                showActive(simCall, "Connected")
                setIncomingCall(null)
            }
        }
    }

    const handleDecline = () => {
        if (incomingCall) {
            stopRinger()
            if (typeof incomingCall.hangup === "function") {
                incomingCall.hangup()
            }
            setIncomingCall(null)
            incomingCallRef.current = null
            if (!activeCallRef.current) {
                isCallActiveRef.current = false
            }
            if (typeof document !== "undefined") {
                document.title = document.title.replace("📞 ", "")
            }
        }
    }

    const handleHangup = () => {
        const callToEnd = activeCallRef.current || activeCall
        if (callToEnd) {
            if (typeof callToEnd.hangup === "function") {
                try {
                    callToEnd.hangup()
                } catch (e) { }
            }
            endCall(callToEnd)
        }
    }

    const handleHold = () => {
        if (!activeCall) return
        const next = !held
        setHeld(next)
        if (typeof activeCall.hold === "function") {
            next ? activeCall.hold() : activeCall.unhold()
        }
    }

    const handleMute = () => {
        if (!activeCall) return
        const next = !muted
        setMuted(next)
        if (typeof activeCall.muteAudio === "function") {
            next ? activeCall.muteAudio() : activeCall.unmuteAudio()
        }
    }

    // §7: Outbound calls with custom header X-Voice-Ext
    const dial = async (number?: string) => {
        const rawTarget = (number || dialNumber || "").trim()
        if (!rawTarget) return
        if (status === "offline") {
            alert("Phone is offline. Wait for the Online badge.")
            return
        }

        // Clean target and caller number: remove internal spaces and formatting for valid SIP URI
        const cleanTarget = rawTarget.replace(/[\s\-()]/g, "")
        // Only pass callerNumber if it's a real verified number from the organization (avoid 403 Forbidden on Telnyx)
        const cleanCaller = cfgRef.current.callerId && cfgRef.current.callerId !== "+44 20 7946 0912"
            ? cfgRef.current.callerId.replace(/[\s\-()]/g, "")
            : undefined

        // Request user media access before dialing to prevent WebRTC permission drop
        try {
            if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null)
            }
        } catch (e) { }

        // Immediately pause / stop automatic Call List API polling & fetching
        isCallActiveRef.current = true
        dialedNumberRef.current = rawTarget
        setCandidateLookup(null)
        lookupCandidate(rawTarget)

        clearInterval(timerIdRef.current)
        callStartRef.current = 0

        // Display active call immediately on UI with the specific target number
        const simCall = {
            id: "call-" + Date.now(),
            number: rawTarget,
            destinationNumber: cleanTarget,
            options: { destinationNumber: cleanTarget }
        }
        activeCallRef.current = simCall
        showActive(simCall, "Calling…")

        if (clientRef.current) {
            try {
                const callOptions: any = {
                    destinationNumber: cleanTarget,
                    remoteElement: "remoteAudio",
                    customHeaders: [
                        { name: "X-Voice-Ext", value: cfgRef.current.extensionUid || extension || "" }
                    ]
                }
                if (cleanCaller) {
                    callOptions.callerNumber = cleanCaller
                }
                const call = clientRef.current.newCall(callOptions)
                if (call) {
                    activeCallRef.current = call
                    setActiveCall(call)
                }
            } catch (err: any) {
                console.warn("Telnyx newCall error:", err)
            }
        }

        setDialNumber("")
    }

    // §4 & §5: Transfer toggle & doTransfer
    const handleTransferToggle = async () => {
        const next = !showTransferPanel
        setShowTransferPanel(next)
        setTransferMsg("")
        if (next) {
            try {
                const res = await api(cfgRef.current.colleaguesUrl)
                if (res && res.colleagues && Array.isArray(res.colleagues)) {
                    setColleagues(res.colleagues)
                }
            } catch (e: any) {
                setColleagues([
                    { uid: "col-1", name: "Support Team", extension: "102" },
                    { uid: "col-2", name: "Recruitment Consultant", extension: "103" },
                    { uid: "col-3", name: "Operations Lead", extension: "104" }
                ])
            }
        }
    }

    const doTransfer = async (transferData: { extension_uid?: string; number?: string }) => {
        const currentCall = activeCallRef.current || activeCall
        if (!currentCall) {
            setTransferMsg("No active call to transfer.")
            setTransferStatus("failed")
            transferStatusRef.current = "failed"
            return
        }

        let targetExtension = ""
        let targetName = ""
        if (transferData.extension_uid) {
            const foundColleague = colleagues.find(c => c.uid === transferData.extension_uid)
            if (foundColleague) {
                targetExtension = foundColleague.extension
                targetName = foundColleague.name
            }
        }

        const rawTargetNumber = (transferData.number || targetExtension || "").trim()
        let cleanTargetNumber = rawTargetNumber.replace(/[\s\-()]/g, "")
        if (rawTargetNumber.startsWith("+") && !cleanTargetNumber.startsWith("+")) {
            cleanTargetNumber = "+" + cleanTargetNumber
        }

        if (!cleanTargetNumber && !targetExtension && !transferData.extension_uid) {
            setTransferMsg("Please select a colleague or enter a valid number.")
            setTransferStatus("failed")
            transferStatusRef.current = "failed"
            setIsTransferring(false)
            isTransferringRef.current = false
            return
        }

        const targetLabel = targetName ? `${targetName} (Ext ${targetExtension})` : (rawTargetNumber || "destination")
        
        // 1. Separate State: Active WebRTC call remains completely intact while transfer initiates
        setTransferStatus("initiating")
        transferStatusRef.current = "initiating"
        setIsTransferring(true)
        isTransferringRef.current = true
        lastTransferTimeRef.current = Date.now()
        isCallActiveRef.current = true
        setTransferMsg(`Initiating transfer to ${targetLabel}… Caller remains connected.`)

        // Extract all possible Call Control and Leg IDs from incoming or outbound call
        const callControlId =
            currentCall.telnyxCallControlId ||
            currentCall.call_control_id ||
            currentCall.options?.telnyxCallControlId ||
            currentCall.options?.callControlId ||
            currentCall.options?.call_control_id ||
            currentCall.params?.telnyx_call_control_id ||
            currentCall.params?.call_control_id ||
            currentCall.id ||
            ""

        const callLegId =
            currentCall.telnyxLegId ||
            currentCall.call_leg_id ||
            currentCall.options?.telnyxLegId ||
            currentCall.options?.call_leg_id ||
            currentCall.params?.telnyx_leg_id ||
            currentCall.params?.call_leg_id ||
            currentCall.id ||
            ""

        const callerPhone =
            incomingCaller ||
            currentCall.callerNumber ||
            currentCall.options?.callerNumber ||
            currentCall.options?.remoteCallerNumber ||
            callerOf(currentCall) ||
            ""

        let headerCallId = ""
        const headersList = currentCall.options?.customHeaders || currentCall.customHeaders || []
        if (Array.isArray(headersList)) {
            for (const h of headersList) {
                if (h && (h.name === "X-Call-ID" || h.name === "X-Call-Control-ID" || h.name === "X-CallControlId")) {
                    headerCallId = h.value
                }
            }
        }

        const effectiveCallId = headerCallId || callControlId || currentCall.id || currentCall.callId || ""

        const cleanCaller = cfgRef.current.callerId && cfgRef.current.callerId !== "+44 20 7946 0912"
            ? cfgRef.current.callerId.replace(/[\s\-()]/g, "")
            : undefined

        const payload: any = {
            call_id: effectiveCallId,
            call_control_id: callControlId || effectiveCallId,
            call_leg_id: callLegId || effectiveCallId,
            flow_uid: flowUid || "",
            flow: flowUid || "",
            extension_uid: transferData.extension_uid || "",
            extension: targetExtension || cleanTargetNumber,
            colleague_id: transferData.extension_uid || "",
            colleague_uid: transferData.extension_uid || "",
            colleague_name: targetName || "",
            destination: cleanTargetNumber || targetExtension,
            target: cleanTargetNumber || targetExtension,
            target_number: cleanTargetNumber || targetExtension,
            transfer_to: cleanTargetNumber || targetExtension,
            number: cleanTargetNumber,
            to: cleanTargetNumber || targetExtension,
            caller_number: callerPhone,
            caller: callerPhone,
            from: callerPhone || cleanCaller || cfgRef.current.callerId || "",
            caller_id: cleanCaller || cfgRef.current.callerId || "",
            agent_uid: cfgRef.current.extensionUid || "",
            user_uid: cfgRef.current.extensionUid || "",
            custom_headers: [
                { name: "X-Voice-Ext", value: targetExtension || transferData.extension_uid || "" },
                { name: "X-Flow-UID", value: flowUid || "" }
            ],
            headers: [
                { name: "X-Voice-Ext", value: targetExtension || transferData.extension_uid || "" },
                { name: "X-Flow-UID", value: flowUid || "" }
            ]
        }

        try {
            // 2. Transition transfer state to 'ringing'
            setTransferStatus("ringing")
            transferStatusRef.current = "ringing"
            setTransferMsg(`Target ${targetLabel} is ringing… Caller remains connected.`)

            // 3. Send transfer request to backend voice API with local API route fallback
            await api(cfgRef.current.transferUrl, {
                method: "POST",
                body: JSON.stringify(payload)
            }).catch(async (err) => {
                const localRes = await fetch("/api/voice/transfer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }).catch(() => null)

                if (localRes && localRes.ok) {
                    return await localRes.json()
                }

                return api(`${VOICE_BASE}/voice/api/transfer/`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                }).catch(() => {
                    throw err
                })
            })

            // 4. Transfer completed successfully on telephony service
            setTransferStatus("completed")
            transferStatusRef.current = "completed"
            setTransferMsg(`Transfer established! Call successfully handed off to ${targetLabel}.`)
            setSelectedColleague("")
            setTransferNumber("")
            setIsTransferring(false)
            isTransferringRef.current = false

            setTimeout(() => {
                setTransferMsg(prev => (prev.includes("Transfer established") ? "" : prev))
                setTransferStatus("idle")
                transferStatusRef.current = "idle"
            }, 6000)
        } catch (e: any) {
            console.error("Transfer error:", e)
            setTransferStatus("failed")
            transferStatusRef.current = "failed"
            setTransferMsg(`Transfer failed: ${e?.message || "Could not reach target"}. Caller remains connected.`)
            setIsTransferring(false)
            isTransferringRef.current = false
        }
    }

    // Initial lifecycle, audio unlock & polling intervals
    useEffect(() => {
        // Fetch user & organization details
        profileService.getProfile()
            .then(res => {
                if (res.data) {
                    const fullName = `${res.data.first_name || ""} ${res.data.last_name || ""}`.trim() || res.data.username || "User"
                    setUserName(fullName)
                    if (res.data.uid) {
                        cfgRef.current.extensionUid = res.data.uid
                    }
                }
            })
            .catch(() => { })

        profileService.getOrganization()
            .then(res => {
                if (res.data) {
                    if (res.data.name) setOrgName(res.data.name)
                    if (res.data.phone_number) {
                        setMainNumber(res.data.phone_number)
                        cfgRef.current.callerId = res.data.phone_number
                    }
                }
            })
            .catch(() => { })

        if (flowUid) {
            const token = cookieUtils.get("access")
            fetch(`${BASE_URL}/flows/available-flow/my_flows`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    const match = (data.results || []).find((f: any) => f.uid === flowUid)
                    if (match && match.flow?.name) {
                        setOrgName(match.flow.name)
                    }
                })
                .catch(() => { })
        }

        // Audio unlock
        const handleUnlock = () => {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                if (AudioContextClass) audioCtxRef.current = new AudioContextClass()
            }
            if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume().then(() => {
                    setSoundBannerVisible(false)
                })
            }
        }
        window.addEventListener("click", handleUnlock)

        setTimeout(() => {
            try {
                const c = new (window.AudioContext || (window as any).webkitAudioContext)()
                setSoundBannerVisible(c.state !== "running")
                c.close()
            } catch (e) { }
        }, 500)

        // Connect WebRTC and fetch initial list
        connect()
        refreshList()

        // 15s refresh interval (§3)
        const listInterval = setInterval(() => {
            if (
                !isCallActiveRef.current &&
                !isTransferringRef.current &&
                !activeCallRef.current &&
                !incomingCallRef.current
            ) {
                refreshList()
            }
        }, 15000)

        // 8h token refresh interval (§1)
        const tokenInterval = setInterval(() => {
            if (!activeCallRef.current && !incomingCallRef.current && !isTransferringRef.current) {
                connect()
            }
        }, 8 * 3600 * 1000)

        return () => {
            window.removeEventListener("click", handleUnlock)
            clearInterval(listInterval)
            clearInterval(tokenInterval)
            stopRinger()
            if (timerIdRef.current) clearInterval(timerIdRef.current)
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
        }
    }, [flowUid, refreshList])

    // Re-fetch list on tab change
    useEffect(() => {
        refreshList()
    }, [currentTab, refreshList])

    const filteredCalls = currentTab === "missed" ? callsList.filter(c => c.direction === "inbound" && c.status === "missed") : callsList

    // Helper to format audio URL (§3b)
    const formatAudioUrl = (url: string) => {
        if (!url) return ""
        if (url.startsWith("http")) return url
        return `${VOICE_BASE}${url.startsWith("/") ? "" : "/"}${url}`
    }

    return (
        <div className="flex-1 overflow-y-auto bg-background p-4 md:p-8 min-h-screen text-foreground font-sans">
            <div className="max-w-xl mx-auto space-y-4">
                {/* Back link */}
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/phone-call-flows")}
                        className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2 gap-1.5 text-xs font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Call Flows
                    </Button>
                </div>

                {/* Header Card */}
                <Card className="border border-border/70 bg-card shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <PhoneCall className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight text-foreground">
                                        {orgName.toUpperCase()} PHONE
                                    </h1>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        WebRTC Softphone & VoIP Station
                                    </p>
                                </div>
                            </div>
                            <Badge
                                id="status"
                                title={statusDetail}
                                variant="outline"
                                className={`text-xs font-semibold px-2.5 py-1 gap-1.5 ${status === "online"
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                        : status === "connecting"
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                                    }`}
                            >
                                {status === "online" && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                                {status === "connecting" && <Loader2 className="w-3 h-3 animate-spin shrink-0 text-amber-500" />}
                                {status === "offline" && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                                {status === "online" ? "Online" : status === "connecting" ? "Connecting…" : "Offline"}
                            </Badge>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                <span className="truncate">Logged in: <strong className="text-foreground font-semibold">{userName}</strong> <span className="text-muted-foreground/80">(ext {extension})</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:justify-end">
                                <Phone className="w-3.5 h-3.5 text-muted-foreground/80 shrink-0" />
                                <span className="truncate">Main Number: <strong className="text-foreground font-semibold">{mainNumber}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sound Permission Alert Banner */}
                {soundBannerVisible && (
                    <div
                        id="sound-banner"
                        className="flex items-center gap-2.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs font-medium shadow-sm transition-all animate-fade-in cursor-pointer"
                    >
                        <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Click anywhere on this page to enable telephone ringtone sound.</span>
                    </div>
                )}

                {/* Section: Incoming Call */}
                {incomingCall && (
                    <Card id="incoming" className="border-2 border-emerald-500/80 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 animate-pulse">
                        <CardContent className="p-5 space-y-4">
                            {candidateLookup && (
                                <div className="pb-3 border-b border-emerald-500/20">
                                    {candidateLookup.loading ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                            Looking up candidate…
                                        </div>
                                    ) : candidateLookup.jobadderConnected === false ? (
                                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> JobAdder is not connected
                                        </Badge>
                                    ) : candidateLookup.found === false ? (
                                        <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> Candidate not found
                                        </Badge>
                                    ) : candidateLookup.candidate ? (
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-bold uppercase tracking-wider">
                                                <UserCheck className="w-3 h-3" /> Candidate Match
                                            </Badge>
                                            <div className="text-base font-bold text-foreground">
                                                {[candidateLookup.candidate.firstName, candidateLookup.candidate.lastName].filter(Boolean).join(" ")}
                                            </div>
                                            {candidateLookup.candidate.phone && (
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {candidateLookup.candidate.phone}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <PhoneIncoming className="w-6 h-6 animate-bounce" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        Incoming Call
                                    </div>
                                    <div id="incoming-from" className="text-lg font-bold text-foreground truncate">
                                        {incomingCaller || "Unknown Caller"}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 pt-1">
                                <Button
                                    id="btn-answer"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 h-10 shadow-sm"
                                    onClick={handleAnswer}
                                >
                                    <Phone className="w-4 h-4" />
                                    Answer
                                </Button>
                                <Button
                                    id="btn-decline"
                                    variant="destructive"
                                    className="font-semibold gap-2 h-10 shadow-sm"
                                    onClick={handleDecline}
                                >
                                    <PhoneOff className="w-4 h-4" />
                                    Decline
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Section: Active Call */}
                {activeCall && (
                    <Card id="active" className="border border-primary/40 bg-card shadow-md">
                        <CardContent className="p-5 space-y-4">
                            {candidateLookup && (
                                <div className="pb-3 border-b border-border/60">
                                    {candidateLookup.loading ? (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                            Looking up candidate…
                                        </div>
                                    ) : candidateLookup.jobadderConnected === false ? (
                                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> JobAdder is not connected
                                        </Badge>
                                    ) : candidateLookup.found === false ? (
                                        <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5" /> Candidate not found
                                        </Badge>
                                    ) : candidateLookup.candidate ? (
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[11px] font-bold uppercase tracking-wider">
                                                <UserCheck className="w-3 h-3" /> Candidate Match
                                            </Badge>
                                            <div className="text-base font-bold text-foreground">
                                                {[candidateLookup.candidate.firstName, candidateLookup.candidate.lastName].filter(Boolean).join(" ")}
                                            </div>
                                            {candidateLookup.candidate.phone && (
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {candidateLookup.candidate.phone}
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Call In Progress
                                    </div>
                                    <div id="active-who" className="text-xl font-bold text-foreground truncate mt-0.5">
                                        {activeWho}
                                    </div>
                                </div>
                                <Badge
                                    id="active-state"
                                    variant="secondary"
                                    className="font-mono text-xs px-2.5 py-1 gap-1.5 bg-primary/10 text-primary border border-primary/20 shrink-0"
                                >
                                    <Radio className="w-3 h-3 animate-pulse text-primary shrink-0" />
                                    {activeStateText}
                                </Badge>
                            </div>

                            {/* Action Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                <Button
                                    id="btn-hold"
                                    variant={held ? "default" : "outline"}
                                    className={`gap-1.5 h-10 font-medium ${held ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-border/80"}`}
                                    onClick={handleHold}
                                >
                                    {held ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    {held ? "Resume" : "Hold"}
                                </Button>
                                <Button
                                    id="btn-mute"
                                    variant={muted ? "default" : "outline"}
                                    className={`gap-1.5 h-10 font-medium ${muted ? "bg-rose-600 hover:bg-rose-700 text-white" : "border-border/80"}`}
                                    onClick={handleMute}
                                >
                                    {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    {muted ? "Unmute" : "Mute"}
                                </Button>
                                <Button
                                    id="btn-transfer-toggle"
                                    variant={showTransferPanel ? "default" : "outline"}
                                    className="gap-1.5 h-10 font-medium border-border/80"
                                    onClick={handleTransferToggle}
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Transfer
                                </Button>
                                <Button
                                    id="btn-hangup"
                                    variant="destructive"
                                    className="gap-1.5 h-10 font-semibold shadow-sm"
                                    onClick={handleHangup}
                                >
                                    <PhoneOff className="w-4 h-4" />
                                    Hang up
                                </Button>
                            </div>

                            {/* Transfer Panel */}
                            {showTransferPanel && (
                                <div id="transfer-panel" className="mt-3 p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                Transfer Call
                                            </span>
                                            {transferStatus !== "idle" && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-mono uppercase px-2 py-0.5 ${
                                                        transferStatus === "completed"
                                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                            : transferStatus === "failed"
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse"
                                                    }`}
                                                >
                                                    {transferStatus}
                                                </Badge>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowTransferPanel(false)}
                                            className="text-xs text-muted-foreground hover:text-foreground font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            id="transfer-select"
                                            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            value={selectedColleague}
                                            onChange={e => {
                                                setSelectedColleague(e.target.value)
                                                setTransferMsg("")
                                            }}
                                            disabled={isTransferring}
                                        >
                                            <option value="">Choose a colleague…</option>
                                            {colleagues.map(c => (
                                                <option key={c.uid} value={c.uid}>
                                                    {c.name} ({c.extension})
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            id="btn-transfer-go"
                                            size="sm"
                                            className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0"
                                            onClick={() => doTransfer({ extension_uid: selectedColleague })}
                                            disabled={!selectedColleague || isTransferring}
                                        >
                                            {isTransferring ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                            )}
                                            Transfer
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input
                                            id="transfer-number"
                                            placeholder="…or dial outside number"
                                            inputMode="tel"
                                            className="h-9 text-xs"
                                            value={transferNumber}
                                            onChange={e => {
                                                setTransferNumber(e.target.value)
                                                setTransferMsg("")
                                            }}
                                            disabled={isTransferring}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && transferNumber.trim() && !isTransferring) {
                                                    doTransfer({ number: transferNumber.trim() })
                                                }
                                            }}
                                        />
                                        <Button
                                            id="btn-transfer-number"
                                            size="sm"
                                            variant="secondary"
                                            className="h-9 px-3 gap-1.5 text-xs font-semibold shrink-0"
                                            onClick={() => doTransfer({ number: transferNumber.trim() })}
                                            disabled={!transferNumber.trim() || isTransferring}
                                        >
                                            {isTransferring ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                            )}
                                            Transfer
                                        </Button>
                                    </div>
                                    {transferMsg && (
                                        <div
                                            id="transfer-msg"
                                            className={`text-xs font-medium pt-1 flex items-center gap-1.5 ${transferMsg.toLowerCase().includes("fail") ||
                                                    transferMsg.toLowerCase().includes("error")
                                                    ? "text-rose-600 dark:text-rose-400"
                                                    : "text-emerald-600 dark:text-emerald-400"
                                                }`}
                                        >
                                            {transferMsg}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Section: Dial */}
                <Card className="border border-border/70 bg-card shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    id="dial-input"
                                    placeholder="Enter telephone number to dial…"
                                    inputMode="tel"
                                    autoComplete="off"
                                    className="pl-9 h-11 text-base font-medium rounded-xl"
                                    value={dialNumber}
                                    onChange={e => setDialNumber(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === "Enter") dial(dialNumber)
                                    }}
                                />
                            </div>
                            <Button
                                id="btn-call"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl gap-2 shadow-sm shrink-0"
                                onClick={() => dial(dialNumber)}
                            >
                                <Phone className="w-4 h-4" />
                                CALL
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="p-1 rounded-xl bg-muted/60 border border-border/50 flex gap-1">
                    <button
                        data-tab="recent"
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${currentTab === "recent"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        onClick={() => setCurrentTab("recent")}
                    >
                        Recent Calls
                    </button>
                    <button
                        data-tab="missed"
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${currentTab === "missed"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        onClick={() => setCurrentTab("missed")}
                    >
                        Missed Calls
                    </button>
                    <button
                        data-tab="voicemail"
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${currentTab === "voicemail"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        onClick={() => setCurrentTab("voicemail")}
                    >
                        Voicemail
                        {unreadVoicemails > 0 && (
                            <span id="vm-badge" className="bg-rose-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight">
                                {unreadVoicemails}
                            </span>
                        )}
                    </button>
                </div>

                {/* List Container */}
                <Card className="border border-border/70 bg-card shadow-sm overflow-hidden">
                    <CardContent className="p-2">
                        <ul id="list" className="space-y-1.5">
                            {listErrorMessage ? (
                                <li className="p-4 text-center rounded-xl bg-muted/30">
                                    <div className="text-sm font-semibold text-rose-600">Could not load calls</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{listErrorMessage}</div>
                                </li>
                            ) : currentTab === "voicemail" ? (
                                voicemailsList.length === 0 ? (
                                    <li className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                        <Voicemail className="w-8 h-8 text-muted-foreground/40" />
                                        <span>No voicemail messages found.</span>
                                    </li>
                                ) : (
                                    voicemailsList.map(v => (
                                        <li
                                            key={v.uid || v.id}
                                            className="p-3 rounded-xl border border-border/60 bg-background/50 hover:bg-muted/40 transition-colors space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div
                                                    className="font-semibold text-sm text-foreground hover:text-primary hover:underline cursor-pointer flex items-center gap-2"
                                                    onClick={() => setDialNumber(v.from)}
                                                    title="Click to dial number"
                                                >
                                                    <Voicemail className="w-4 h-4 text-muted-foreground" />
                                                    <span>{v.from || "Unknown"}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {!v.is_read && (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold px-1.5 py-0">
                                                            NEW
                                                        </Badge>
                                                    )}
                                                    <span className="font-mono text-[11px]">{mmss(v.duration)}</span>
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-muted-foreground/70" />
                                                {new Date(v.created_at).toLocaleString()}
                                            </div>
                                            {v.ready ? (
                                                <audio
                                                    controls
                                                    preload="none"
                                                    src={formatAudioUrl(v.audio_url)}
                                                    className="w-full h-8 mt-1.5 rounded-md"
                                                    onPlay={() => {
                                                        const readUrl = v.read_url || `${VOICE_BASE}/voice/api/voicemails/${v.uid || v.id}/read/`
                                                        api(readUrl, { method: "POST" }).catch(() => { })
                                                        setVoicemailsList(prev =>
                                                            prev.map(item =>
                                                                (item.uid === v.uid || item.id === v.id)
                                                                    ? { ...item, is_read: true }
                                                                    : item
                                                            )
                                                        )
                                                        setUnreadVoicemails(prev => Math.max(0, prev - 1))
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic mt-1"> (Processing audio…)</div>
                                            )}
                                        </li>
                                    ))
                                )
                            ) : filteredCalls.length === 0 ? (
                                <li className="p-6 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                    <PhoneMissed className="w-8 h-8 text-muted-foreground/40" />
                                    <span>{currentTab === "missed" ? "No missed calls found." : "No call logs yet."}</span>
                                </li>
                            ) : (
                                filteredCalls.map(c => {
                                    const isMissed = c.direction === "inbound" && c.status === "missed"
                                    const who = c.contact_name ? `${c.contact_name} · ${c.number}` : c.number
                                    const sub = `${new Date(c.started_at).toLocaleString()} · ${c.status === "completed" ? mmss(c.duration) : c.status.replace("_", " ")
                                        }${c.handled_by ? ` · ${c.handled_by}` : ""}`

                                    return (
                                        <li
                                            key={c.uid || c.id}
                                            className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${isMissed
                                                    ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                                                    : "border-border/60 bg-background/50 hover:bg-muted/40"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMissed
                                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                            : c.direction === "inbound"
                                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                        }`}
                                                >
                                                    {isMissed ? (
                                                        <PhoneMissed className="w-4 h-4" />
                                                    ) : c.direction === "inbound" ? (
                                                        <PhoneIncoming className="w-4 h-4" />
                                                    ) : (
                                                        <PhoneOutgoing className="w-4 h-4" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div
                                                        className={`font-semibold text-xs sm:text-sm truncate hover:underline cursor-pointer flex items-center gap-1.5 ${isMissed ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                                                            }`}
                                                        onClick={() => setDialNumber(c.number)}
                                                        title="Click to dial number"
                                                    >
                                                        <span className="truncate">{who}</span>
                                                        {c.has_voicemail && (
                                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold px-1.5 py-0">
                                                                voicemail
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                        {sub}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => dial(c.number)}
                                                className="h-8 px-2 text-xs text-muted-foreground hover:text-emerald-600 shrink-0"
                                                title="Call this number"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </Button>
                                        </li>
                                    )
                                })
                            )}
                        </ul>
                    </CardContent>
                </Card>

                {/* Footer Notice */}
                <p className="text-center text-[11px] text-muted-foreground/80 py-2">
                    Emergency calls (999/911/112) should be dialed directly from your mobile or landline device.
                </p>
            </div>

            <audio id="remoteAudio" autoPlay playsInline className="fixed -top-full -left-full opacity-0 pointer-events-none w-0 h-0" />
        </div>
    )
}
