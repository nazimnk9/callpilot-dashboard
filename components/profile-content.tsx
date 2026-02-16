"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { profileService } from "@/services/profile-service"
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

export function ProfileContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [initialProfile, setInitialProfile] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
    })
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
    })
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    })
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [activeTab, setActiveTab] = useState("User")

    const [alertConfig, setAlertConfig] = useState<{
        open: boolean
        title: string
        description: string[]
        variant: "default" | "destructive"
    }>({
        open: false,
        title: "",
        description: [],
        variant: "default"
    })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getProfile()
            const data = response.data
            const profileData = {
                first_name: data.first_name || "",
                last_name: data.last_name || "",
                email: data.email || "",
                phone: data.phone || data.mobile_number || ""
            }
            setInitialProfile(profileData)
            setProfile(profileData)
        } catch (err: any) {
            console.error("Error fetching profile:", err)
            setAlertConfig({
                open: true,
                title: "Error",
                description: ["Failed to load profile data. Please try again later."],
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (activeTab === "User") {
            // Partial Patch Logic
            const payload: any = {}
            if (profile.first_name !== initialProfile.first_name) payload.first_name = profile.first_name
            if (profile.last_name !== initialProfile.last_name) payload.last_name = profile.last_name
            if (profile.email !== initialProfile.email) payload.email = profile.email
            if (profile.phone !== initialProfile.phone) payload.phone = profile.phone

            if (Object.keys(payload).length === 0) {
                setAlertConfig({
                    open: true,
                    title: "No Changes",
                    description: ["No modifications detected to save."],
                    variant: "default"
                })
                return
            }

            try {
                setIsSaving(true)
                const response = await profileService.updateProfile(payload)
                const updatedData = {
                    first_name: response.data.first_name || profile.first_name,
                    last_name: response.data.last_name || profile.last_name,
                    email: response.data.email || profile.email,
                    phone: response.data.phone || response.data.mobile_number || profile.phone
                }
                setProfile(updatedData)
                setInitialProfile(updatedData)
                setAlertConfig({
                    open: true,
                    title: "Success",
                    description: ["Profile updated successfully."],
                    variant: "default"
                })
            } catch (err: any) {
                console.error("Error updating profile:", err)
                if (err.response?.data) {
                    const errors = err.response.data
                    const errorMessages: string[] = []
                    Object.keys(errors).forEach((key) => {
                        if (Array.isArray(errors[key])) {
                            errorMessages.push(`${key}: ${errors[key][0]}`)
                        } else if (typeof errors[key] === 'string') {
                            errorMessages.push(`${key}: ${errors[key]}`)
                        }
                    })
                    setAlertConfig({
                        open: true,
                        title: "Update Failed",
                        description: errorMessages.length > 0 ? errorMessages : ["An unexpected error occurred."],
                        variant: "destructive"
                    })
                } else {
                    setAlertConfig({
                        open: true,
                        title: "Error",
                        description: ["Failed to update profile. Please try again."],
                        variant: "destructive"
                    })
                }
            } finally {
                setIsSaving(false)
            }
        } else {
            // Security Tab - Password Change
            if (!passwords.newPassword || !passwords.confirmPassword) {
                setAlertConfig({
                    open: true,
                    title: "Validation Error",
                    description: ["Please fill in all password fields."],
                    variant: "destructive"
                })
                return
            }
            if (passwords.newPassword !== passwords.confirmPassword) {
                setAlertConfig({
                    open: true,
                    title: "Validation Error",
                    description: ["Passwords do not match."],
                    variant: "destructive"
                })
                return
            }

            try {
                setIsSaving(true)
                const response = await profileService.updatePassword({
                    password: passwords.newPassword,
                })

                // Update profile data with any changes returned from the API
                const updatedData = {
                    first_name: response.data.first_name || profile.first_name,
                    last_name: response.data.last_name || profile.last_name,
                    email: response.data.email || profile.email,
                    phone: response.data.phone || response.data.mobile_number || profile.phone
                }
                setProfile(updatedData)
                setInitialProfile(updatedData)

                setAlertConfig({
                    open: true,
                    title: "Success",
                    description: ["Password updated successfully."],
                    variant: "default"
                })
                setPasswords({ newPassword: "", confirmPassword: "" })
            } catch (err: any) {
                console.error("Error updating password:", err)
                if (err.response?.data) {
                    const errors = err.response.data
                    const errorMessages: string[] = []
                    Object.keys(errors).forEach((key) => {
                        if (Array.isArray(errors[key])) {
                            errorMessages.push(`${key}: ${errors[key][0]}`)
                        } else if (typeof errors[key] === 'string') {
                            errorMessages.push(`${key}: ${errors[key]}`)
                        }
                    })
                    setAlertConfig({
                        open: true,
                        title: "Update Failed",
                        description: errorMessages.length > 0 ? errorMessages : ["An unexpected error occurred during password update."],
                        variant: "destructive"
                    })
                } else {
                    setAlertConfig({
                        open: true,
                        title: "Error",
                        description: ["Failed to update password. Please try again."],
                        variant: "destructive"
                    })
                }
            } finally {
                setIsSaving(false)
            }
        }
    }

    return (
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
            <LoaderOverlay isLoading={isLoading || isSaving} />

            <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={alertConfig.variant === "destructive" ? "text-destructive" : ""}>
                            {alertConfig.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2" asChild>
                            <div className="space-y-2">
                                {alertConfig.description.map((error, index) => (
                                    <div key={index} className="text-sm font-medium text-gray-900">
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertConfig(prev => ({ ...prev, open: false }))}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab("User")}
                        className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "User" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        User
                        {activeTab === "User" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("Security")}
                        className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-1.5 ${activeTab === "Security" ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Security
                        {activeTab === "Security" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
                        )}
                    </button>
                </div>

                {/* Form Content */}
                <div className="max-w-md space-y-8 pt-4">
                    {activeTab === "User" ? (
                        <>
                            {/* First Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-[15px] font-bold text-gray-900">
                                    First Name
                                </Label>
                                <p className="text-sm text-gray-500">Your first name</p>
                                <Input
                                    id="first_name"
                                    value={profile.first_name}
                                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="Enter your first name"
                                />
                            </div>

                            {/* Last Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-[15px] font-bold text-gray-900">
                                    Last Name
                                </Label>
                                <p className="text-sm text-gray-500">Your last name</p>
                                <Input
                                    id="last_name"
                                    value={profile.last_name}
                                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="Enter your last name"
                                />
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[15px] font-bold text-gray-900">
                                    Email address
                                </Label>
                                <p className="text-sm text-gray-500">The email address associated with this account</p>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                />
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[15px] font-bold text-gray-900">
                                    Phone number
                                </Label>
                                <p className="text-sm text-gray-500">The phone number associated with this account</p>
                                <Input
                                    id="phone"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="+8801815553036"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* New Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-[15px] font-bold text-gray-900">
                                    New Password
                                </Label>
                                <p className="text-sm text-gray-500">Enter your new password</p>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[15px] font-bold text-gray-900">
                                    Confirm Password
                                </Label>
                                <p className="text-sm text-gray-500">Confirm your new password</p>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Save Button */}
                    <div className="pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#1a1c1e] hover:bg-[#2a2c2e] text-white font-semibold px-8 py-2.5 rounded-lg transition-all duration-200"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
