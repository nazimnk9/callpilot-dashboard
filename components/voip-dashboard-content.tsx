"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BASE_URL } from "@/lib/baseUrl"
import { cookieUtils } from "@/services/auth-service"
import { profileService } from "@/services/profile-service"
import { ArrowLeft } from "lucide-react"

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
    const dialedNumberRef = useRef<string>("")
    const timerIdRef = useRef<any>(null)
    const reconnectTimerRef = useRef<any>(null)
    const callStartRef = useRef<number>(0)
    const audioCtxRef = useRef<AudioContext | null>(null)
    const ringTimerRef = useRef<any>(null)
    const currentTabRef = useRef<"recent" | "missed" | "voicemail">("recent")

    // Keep refs in sync with state for callbacks
    useEffect(() => {
        activeCallRef.current = activeCall
    }, [activeCall])

    useEffect(() => {
        incomingCallRef.current = incomingCall
    }, [incomingCall])

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

    // Call UI handlers
    const showIncoming = (call: any) => {
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
        if (incomingCallRef.current && incomingCallRef.current.id === call?.id) {
            setIncomingCall(null)
            stopRinger()
        }
        const first = !activeCallRef.current
        setActiveCall(call)
        const resolvedCaller = callerOf(call)
        const targetNumber = (resolvedCaller !== "Unknown" && !isPlaceholder(resolvedCaller))
            ? resolvedCaller
            : (dialedNumberRef.current || call?.destinationNumber || call?.options?.destinationNumber || call?.number || dialNumber || "Active Call")
        setActiveWho(targetNumber)

        if (stateText === "Connected") {
            if (first || !callStartRef.current) {
                callStartRef.current = Date.now()
                clearInterval(timerIdRef.current)
                setActiveStateText("Connected 0:00")
                timerIdRef.current = setInterval(() => {
                    const elapsed = Math.floor((Date.now() - callStartRef.current) / 1000)
                    setActiveStateText(`Connected ${mmss(elapsed)}`)
                }, 1000)
            }
        } else {
            setActiveStateText(stateText)
            if (first) {
                callStartRef.current = Date.now()
            }
        }
    }

    const endCall = useCallback((call?: any) => {
        if (incomingCallRef.current && (!call || incomingCallRef.current.id === call.id)) {
            setIncomingCall(null)
            stopRinger()
            if (typeof document !== "undefined") {
                document.title = document.title.replace("📞 ", "")
            }
        }
        if (activeCallRef.current && (!call || activeCallRef.current.id === call.id)) {
            setActiveCall(null)
            clearInterval(timerIdRef.current)
            setShowTransferPanel(false)
            setHeld(false)
            setMuted(false)
            callStartRef.current = 0
            dialedNumberRef.current = ""
            setCandidateLookup(null)
            setTimeout(() => {
                refreshList()
            }, 1500)
        }
    }, [])

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
                break
            case "requesting":
            case "trying":
                if (call.direction === "outbound") showActive(call, "Calling…")
                break
            case "active":
                showActive(call, "Connected")
                break
            case "hangup":
            case "destroy":
                endCall(call)
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
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = setTimeout(connect, 5000)
    }

    // Connect WebRTC SDK (§1: POST /voice/api/token/)
    const connect = async () => {
        if (activeCallRef.current || incomingCallRef.current) {
            reconnectTimerRef.current = setTimeout(connect, 15000)
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
                token = res.token
            } catch (err: any) {
                try {
                    const fallbackRes = await fetch("/api/voice/token", { method: "POST" })
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json()
                        token = fallbackData.token
                    }
                } catch (e: any) {
                    console.warn("Fallback token endpoint note:", e)
                }
            }

            if (RTC && token) {
                if (clientRef.current) {
                    try {
                        clientRef.current.disconnect()
                    } catch (e) { }
                }
                const client = new RTC({
                    login_token: token
                })
                try {
                    client.remoteElement = "remoteAudio"
                } catch (e) { }
                client.on("telnyx.ready", () => {
                    setStatus("online")
                    setStatusDetail("Online")
                })
                client.on("telnyx.error", (e: any) => {
                    console.error("telnyx.error", e)
                    setStatus("offline")
                    scheduleReconnect()
                })
                client.on("telnyx.socket.close", () => {
                    setStatus("offline")
                    scheduleReconnect()
                })
                client.on("telnyx.notification", onNotification)
                client.connect()
                clientRef.current = client
            } else {
                // Standalone ready fallback
                setStatus("online")
            }
        } catch (e: any) {
            console.error(e)
            setStatus("offline")
            setStatusDetail(e.message)
            scheduleReconnect()
        }
    }

    // Button actions: Answer, Decline, Hangup, Hold, Mute (§0: SDK methods)
    const handleAnswer = () => {
        if (incomingCall) {
            stopRinger()
            if (typeof incomingCall.answer === "function") {
                incomingCall.answer()
            } else {
                showActive({ id: "sim-in-" + Date.now(), options: { remoteCallerNumber: incomingCaller } }, "Connected")
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
            if (typeof document !== "undefined") {
                document.title = document.title.replace("📞 ", "")
            }
        }
    }

    const handleHangup = () => {
        if (activeCall) {
            if (typeof activeCall.hangup === "function") {
                activeCall.hangup()
            }
            endCall(activeCall)
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
    const dial = (number?: string) => {
        const target = (number || dialNumber || "").trim()
        if (!target) return
        if (status === "offline") {
            alert("Phone is offline. Wait for the Online badge.")
            return
        }

        dialedNumberRef.current = target
        setCandidateLookup(null)
        lookupCandidate(target)

        // Display active call immediately on UI with the specific target number
        const simCall = {
            id: "call-" + Date.now(),
            number: target,
            destinationNumber: target,
            options: { destinationNumber: target }
        }
        showActive(simCall, "Calling…")

        if (clientRef.current) {
            try {
                const call = clientRef.current.newCall({
                    destinationNumber: target,
                    callerNumber: mainNumber || cfgRef.current.callerId || undefined,
                    remoteElement: "remoteAudio",
                    customHeaders: [
                        { name: "X-Voice-Ext", value: cfgRef.current.extensionUid || extension || "" }
                    ]
                })
                if (call) {
                    setActiveCall(call)
                }
            } catch (err: any) {
                console.error("Telnyx newCall error:", err)
            }
        }

        // Transition to Connected after ringing
        setTimeout(() => {
            if (activeCallRef.current) {
                showActive(activeCallRef.current, "Connected")
            }
        }, 1200)

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

    const doTransfer = async (body: any) => {
        setTransferMsg("Transferring…")
        try {
            await api(cfgRef.current.transferUrl, { method: "POST", body: JSON.stringify(body) })
            setTransferMsg("Transferred.")
            setTimeout(() => endCall(activeCall), 1000)
        } catch (e: any) {
            setTransferMsg(e.message || "Transferred.")
            setTimeout(() => endCall(activeCall), 1000)
        }
    }

    // §2 & §3: Refresh list of calls or voicemail from API
    const refreshList = useCallback(async () => {
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
    }, [VOICE_BASE])

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
            refreshList()
        }, 15000)

        // 8h token refresh interval (§1)
        const tokenInterval = setInterval(() => {
            if (!activeCallRef.current && !incomingCallRef.current) {
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

    const arrow = { inbound: "↙", outbound: "↗" }
    const filteredCalls = currentTab === "missed" ? callsList.filter(c => c.direction === "inbound" && c.status === "missed") : callsList

    // Helper to format audio URL (§3b)
    const formatAudioUrl = (url: string) => {
        if (!url) return ""
        if (url.startsWith("http")) return url
        return `${VOICE_BASE}${url.startsWith("/") ? "" : "/"}${url}`
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#f4f5f7] dark:bg-gray-950 p-4 min-h-screen text-[#1c1f26] dark:text-gray-100 font-sans">
            {/* Embedded styles mirroring portal.css */}
            <style jsx global>{`
                .phone-container {
                    max-width: 30rem;
                    margin: 0 auto;
                    padding: 1rem 0;
                }
                .portal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .portal-h1 {
                    font-size: 1.25rem;
                    letter-spacing: .06em;
                    margin: .2rem 0;
                    font-weight: 700;
                }
                .portal-meta {
                    margin: .2rem 0 1rem;
                    color: #444;
                    font-size: 0.95rem;
                }
                .dark .portal-meta {
                    color: #9ca3af;
                }
                .portal-card {
                    background: #fff;
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: .8rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,.08);
                }
                .dark .portal-card {
                    background: #1f2937;
                    border: 1px solid #374151;
                }
                .portal-card.ring {
                    border: 2px solid #16a34a;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    50% { box-shadow: 0 0 0 6px rgba(22,163,74,.18); }
                }
                .portal-dial {
                    display: flex;
                    gap: .5rem;
                }
                .portal-row {
                    display: flex;
                    gap: .5rem;
                    margin-top: .6rem;
                    flex-wrap: wrap;
                }
                .portal-input, .portal-select {
                    flex: 1;
                    min-width: 0;
                    padding: .7rem;
                    border: 1px solid #cfd4dc;
                    border-radius: 8px;
                    font-size: 1rem;
                    background: #fff;
                    color: #1c1f26;
                }
                .dark .portal-input, .dark .portal-select {
                    background: #111827;
                    border-color: #4b5563;
                    color: #f3f4f6;
                }
                .portal-btn {
                    padding: .7rem 1rem;
                    border: 0;
                    border-radius: 8px;
                    background: #e5e7eb;
                    color: #1c1f26;
                    font-size: 1rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.15s;
                }
                .dark .portal-btn {
                    background: #374151;
                    color: #f3f4f6;
                }
                .portal-btn:hover {
                    opacity: 0.9;
                }
                .portal-btn.green {
                    background: #16a34a;
                    color: #fff;
                }
                .portal-btn.red {
                    background: #dc2626;
                    color: #fff;
                }
                .portal-btn.on {
                    background: #1c1f26;
                    color: #fff;
                }
                .dark .portal-btn.on {
                    background: #f3f4f6;
                    color: #111827;
                }
                .portal-tabs {
                    display: flex;
                    gap: .4rem;
                    margin: .8rem 0 .4rem;
                }
                .portal-tabs button {
                    flex: 1;
                    font-size: .9rem;
                    padding: .6rem .3rem;
                    border: 0;
                    border-radius: 8px;
                    background: #e5e7eb;
                    color: #1c1f26;
                    cursor: pointer;
                    font-weight: 500;
                }
                .dark .portal-tabs button {
                    background: #374151;
                    color: #d1d5db;
                }
                .portal-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }
                .portal-list li {
                    background: #fff;
                    border-radius: 10px;
                    padding: .7rem .9rem;
                    margin-bottom: .4rem;
                    display: flex;
                    justify-content: space-between;
                    gap: .6rem;
                    align-items: center;
                }
                .dark .portal-list li {
                    background: #1f2937;
                    border: 1px solid #374151;
                }
                .portal-list .num {
                    font-weight: 600;
                    cursor: pointer;
                }
                .portal-list .num:hover {
                    text-decoration: underline;
                }
                .portal-list .sub {
                    color: #6b7280;
                    font-size: .85rem;
                }
                .dark .portal-list .sub {
                    color: #9ca3af;
                }
                .portal-tag {
                    background: #fde68a;
                    color: #78350f;
                    border-radius: 99px;
                    padding: 0 .5rem;
                    font-size: .75rem;
                    margin-left: .3rem;
                    font-weight: 500;
                }
                .portal-missed .num {
                    color: #dc2626;
                }
                .portal-pill {
                    padding: .15rem .6rem;
                    border-radius: 99px;
                    font-size: .8rem;
                    background: #fee2e2;
                    color: #991b1b;
                    font-weight: 600;
                }
                .portal-pill.online {
                    background: #dcfce7;
                    color: #166534;
                }
                .portal-pill.connecting {
                    background: #fef3c7;
                    color: #92400e;
                }
                .portal-banner {
                    background: #fef3c7;
                    color: #92400e;
                    padding: .6rem;
                    border-radius: 8px;
                    margin-bottom: .8rem;
                    font-size: 0.9rem;
                }
                .dark .portal-banner {
                    background: #78350f;
                    color: #fef3c7;
                }
                .portal-big {
                    font-size: 1.2rem;
                    font-weight: 600;
                }
                .portal-muted {
                    color: #6b7280;
                    font-size: 0.9rem;
                }
                .dark .portal-muted {
                    color: #9ca3af;
                }
                .portal-foot {
                    color: #6b7280;
                    font-size: .8rem;
                    text-align: center;
                    margin-top: 1.5rem;
                }
                .dark .portal-foot {
                    color: #9ca3af;
                }
                .portal-badge {
                    background: #dc2626;
                    color: #fff;
                    border-radius: 99px;
                    padding: 0 .45rem;
                    font-size: .75rem;
                    font-weight: 700;
                    margin-left: 0.2rem;
                }
                .portal-audio {
                    width: 100%;
                    margin-top: .3rem;
                }
            `}</style>

            {/* Back link */}
            <div className="max-w-[30rem] mx-auto mb-2">
                <button
                    onClick={() => router.push("/dashboard/phone-call-flows")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Call Flows
                </button>
            </div>

            {/* Exact portal.html main.phone layout */}
            <main className="phone-container">
                <header className="portal-header">
                    <h1 className="portal-h1">{orgName.toUpperCase()} PHONE</h1>
                    <span
                        id="status"
                        title={statusDetail}
                        className={`portal-pill ${status === "online" ? "online" : status === "connecting" ? "connecting" : "offline"
                            }`}
                    >
                        {status === "online" ? "Online" : status === "connecting" ? "Connecting…" : "Offline"}
                    </span>
                </header>

                <p className="portal-meta">
                    Logged in: <strong>{userName}</strong> (ext {extension})<br />
                    Main Number: <strong>{mainNumber}</strong>
                </p>

                {soundBannerVisible && (
                    <div id="sound-banner" className="portal-banner">
                        Click anywhere on this page to enable ringing sound.
                    </div>
                )}

                {/* Section: Incoming Call (§0: SDK handled) */}
                {incomingCall && (
                    <section id="incoming" className="portal-card ring">
                        {candidateLookup && (
                            <div className="mb-2.5 pb-2 border-b border-green-200 dark:border-green-800/50">
                                {candidateLookup.loading ? (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        Looking up candidate…
                                    </div>
                                ) : candidateLookup.jobadderConnected === false ? (
                                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 rounded-md">
                                        JobAdder is not connected
                                    </div>
                                ) : candidateLookup.found === false ? (
                                    <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1.5 rounded-md">
                                        Candidate not found
                                    </div>
                                ) : candidateLookup.candidate ? (
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 mb-0.5">
                                            Candidate
                                        </div>
                                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            {[candidateLookup.candidate.firstName, candidateLookup.candidate.lastName].filter(Boolean).join(" ")}
                                        </div>
                                        {candidateLookup.candidate.phone && (
                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {candidateLookup.candidate.phone}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        <div className="portal-big" id="incoming-from">
                            Incoming call: {incomingCaller || "Unknown"}
                        </div>
                        <div className="portal-row">
                            <button id="btn-answer" className="portal-btn green" onClick={handleAnswer}>
                                Answer
                            </button>
                            <button id="btn-decline" className="portal-btn red" onClick={handleDecline}>
                                Decline
                            </button>
                        </div>
                    </section>
                )}

                {/* Section: Active Call (§0: SDK handled + §5: Transfer) */}
                {activeCall && (
                    <section id="active" className="portal-card">
                        {candidateLookup && (
                            <div className="mb-2.5 pb-2 border-b border-blue-100 dark:border-blue-900/40">
                                {candidateLookup.loading ? (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                        Looking up candidate…
                                    </div>
                                ) : candidateLookup.jobadderConnected === false ? (
                                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1.5 rounded-md">
                                        JobAdder is not connected
                                    </div>
                                ) : candidateLookup.found === false ? (
                                    <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 px-2.5 py-1.5 rounded-md">
                                        Candidate not found
                                    </div>
                                ) : candidateLookup.candidate ? (
                                    <div>
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5">
                                            Candidate
                                        </div>
                                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                                            {[candidateLookup.candidate.firstName, candidateLookup.candidate.lastName].filter(Boolean).join(" ")}
                                        </div>
                                        {candidateLookup.candidate.phone && (
                                            <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {candidateLookup.candidate.phone}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        <div className="portal-big" id="active-who">
                            {activeWho}
                        </div>
                        <div id="active-state" className="portal-muted">
                            {activeStateText}
                        </div>
                        <div className="portal-row">
                            <button id="btn-hold" className="portal-btn" onClick={handleHold}>
                                {held ? "Resume" : "Hold"}
                            </button>
                            <button id="btn-mute" className="portal-btn" onClick={handleMute}>
                                {muted ? "Unmute" : "Mute"}
                            </button>
                            <button
                                id="btn-transfer-toggle"
                                className="portal-btn"
                                onClick={handleTransferToggle}
                            >
                                Transfer
                            </button>
                            <button id="btn-hangup" className="portal-btn red" onClick={handleHangup}>
                                Hang up
                            </button>
                        </div>

                        {showTransferPanel && (
                            <div id="transfer-panel">
                                <div className="portal-row">
                                    <select
                                        id="transfer-select"
                                        className="portal-select"
                                        value={selectedColleague}
                                        onChange={e => setSelectedColleague(e.target.value)}
                                    >
                                        <option value="">Choose a colleague…</option>
                                        {colleagues.map(c => (
                                            <option key={c.uid} value={c.uid}>
                                                {c.name} ({c.extension})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        id="btn-transfer-go"
                                        className="portal-btn"
                                        onClick={() => doTransfer({ extension_uid: selectedColleague })}
                                        disabled={!selectedColleague}
                                    >
                                        Transfer
                                    </button>
                                </div>
                                <div className="portal-row">
                                    <input
                                        id="transfer-number"
                                        className="portal-input"
                                        placeholder="…or an outside number"
                                        inputMode="tel"
                                        value={transferNumber}
                                        onChange={e => setTransferNumber(e.target.value)}
                                    />
                                    <button
                                        id="btn-transfer-number"
                                        className="portal-btn"
                                        onClick={() => doTransfer({ number: transferNumber.trim() })}
                                        disabled={!transferNumber.trim()}
                                    >
                                        Transfer
                                    </button>
                                </div>
                                {transferMsg && (
                                    <div id="transfer-msg" className="portal-muted mt-1">
                                        {transferMsg}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Section: Dial (§7: client.newCall) */}
                <section className="portal-card portal-dial">
                    <input
                        id="dial-input"
                        className="portal-input"
                        placeholder="Enter telephone number"
                        inputMode="tel"
                        autoComplete="off"
                        value={dialNumber}
                        onChange={e => setDialNumber(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") dial(dialNumber)
                        }}
                    />
                    <button id="btn-call" className="portal-btn green" onClick={() => dial(dialNumber)}>
                        CALL
                    </button>
                </section>

                {/* Tabs (§2 & §3) */}
                <nav className="portal-tabs">
                    <button
                        data-tab="recent"
                        className={currentTab === "recent" ? "on" : ""}
                        onClick={() => setCurrentTab("recent")}
                    >
                        Recent Calls
                    </button>
                    <button
                        data-tab="missed"
                        className={currentTab === "missed" ? "on" : ""}
                        onClick={() => setCurrentTab("missed")}
                    >
                        Missed Calls
                    </button>
                    <button
                        data-tab="voicemail"
                        className={currentTab === "voicemail" ? "on" : ""}
                        onClick={() => setCurrentTab("voicemail")}
                    >
                        Voicemail
                        {unreadVoicemails > 0 && (
                            <span id="vm-badge" className="portal-badge">
                                {unreadVoicemails}
                            </span>
                        )}
                    </button>
                </nav>

                {/* List Container (§2 & §3) */}
                <ul id="list" className="portal-list">
                    {listErrorMessage ? (
                        <li>
                            <div>
                                <div className="num">Could not load</div>
                                <div className="sub">{listErrorMessage}</div>
                            </div>
                        </li>
                    ) : currentTab === "voicemail" ? (
                        voicemailsList.length === 0 ? (
                            <li>
                                <div>
                                    <div className="num">No voicemail</div>
                                </div>
                            </li>
                        ) : (
                            voicemailsList.map(v => (
                                <li key={v.uid || v.id}>
                                    <div style={{ width: "100%" }}>
                                        <div
                                            className="num"
                                            onClick={() => setDialNumber(v.from)}
                                            title="Click to dial"
                                        >
                                            {v.from || "Unknown"}
                                        </div>
                                        <div className="sub">
                                            {new Date(v.created_at).toLocaleString()} · {mmss(v.duration)}
                                            {!v.is_read && " · NEW"}
                                        </div>
                                        {v.ready ? (
                                            <audio
                                                controls
                                                preload="none"
                                                src={formatAudioUrl(v.audio_url)}
                                                className="portal-audio"
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
                                            <div className="sub italic mt-1"> (processing…)</div>
                                        )}
                                    </div>
                                </li>
                            ))
                        )
                    ) : filteredCalls.length === 0 ? (
                        <li>
                            <div>
                                <div className="num">
                                    {currentTab === "missed" ? "No missed calls" : "No calls yet"}
                                </div>
                            </div>
                        </li>
                    ) : (
                        filteredCalls.map(c => {
                            const isMissed = c.direction === "inbound" && c.status === "missed"
                            const who = c.contact_name ? `${c.contact_name} · ${c.number}` : c.number
                            const sub = `${new Date(c.started_at).toLocaleString()} · ${c.status === "completed" ? mmss(c.duration) : c.status.replace("_", " ")
                                }${c.handled_by ? ` · ${c.handled_by}` : ""}`

                            return (
                                <li key={c.uid || c.id} className={isMissed ? "portal-missed" : ""}>
                                    <div>
                                        <div
                                            className="num"
                                            onClick={() => setDialNumber(c.number)}
                                            title="Click to dial"
                                        >
                                            {isMissed ? "✖ " : `${arrow[c.direction]} `}
                                            {who}
                                            {c.has_voicemail && (
                                                <span className="portal-tag">voicemail</span>
                                            )}
                                        </div>
                                        <div className="sub">{sub}</div>
                                    </div>
                                </li>
                            )
                        })
                    )}
                </ul>

                <p className="portal-foot">Not for emergency calls: dial 999 from your mobile.</p>
            </main>

            <audio id="remoteAudio" autoPlay playsInline className="hidden" />
        </div>
    )
}
