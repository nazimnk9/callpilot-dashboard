"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ExternalLink } from "lucide-react"
import { profileService } from "@/services/profile-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"

export function ProfileContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: ""
    })
    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    })
    const [activeTab, setActiveTab] = useState("User")
    const [toast, setToast] = useState<{
        title: string
        description: string
        variant: "default" | "destructive"
    } | null>(null)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getProfile()
            const data = response.data
            setProfile({
                name: data.name || "",
                email: data.email || "",
                phone: data.phone || data.mobile_number || "" // Adjust based on actual API field
            })
        } catch (err: any) {
            console.error("Error fetching profile:", err)
            setToast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (activeTab === "User") {
            try {
                setIsSaving(true)
                await profileService.updateProfile({
                    name: profile.name,
                })
                setToast({
                    title: "Success",
                    description: "Profile updated successfully",
                    variant: "default",
                })
            } catch (err: any) {
                console.error("Error updating profile:", err)
                setToast({
                    title: "Error",
                    description: "Failed to update profile",
                    variant: "destructive",
                })
            } finally {
                setIsSaving(false)
            }
        } else {
            // Security Tab - Password Change
            if (!passwords.newPassword || !passwords.confirmPassword) {
                setToast({
                    title: "Error",
                    description: "Please fill in all password fields",
                    variant: "destructive",
                })
                return
            }
            if (passwords.newPassword !== passwords.confirmPassword) {
                setToast({
                    title: "Error",
                    description: "Passwords do not match",
                    variant: "destructive",
                })
                return
            }

            try {
                setIsSaving(true)
                await profileService.updatePassword({
                    password: passwords.newPassword,
                })
                setToast({
                    title: "Success",
                    description: "Password updated successfully",
                    variant: "default",
                })
                setPasswords({ newPassword: "", confirmPassword: "" })
            } catch (err: any) {
                console.error("Error updating password:", err)
                setToast({
                    title: "Error",
                    description: "Failed to update password",
                    variant: "destructive",
                })
            } finally {
                setIsSaving(false)
            }
        }
    }

    return (
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
            <LoaderOverlay isLoading={isLoading || isSaving} />

            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

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
                        {/* {activeTab === "Security" && <ExternalLink size={14} className="text-gray-400" />} */}
                        {activeTab === "Security" && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
                        )}
                    </button>
                </div>

                {/* Form Content */}
                <div className="max-w-md space-y-8 pt-4">
                    {activeTab === "User" ? (
                        <>
                            {/* Name Field */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[15px] font-bold text-gray-900">
                                    Name
                                </Label>
                                <p className="text-sm text-gray-500">The name associated with this account</p>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="Enter your name"
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
                                    readOnly
                                    className="h-11 rounded-xl border-gray-200 bg-white text-gray-400 cursor-not-allowed"
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
                                    readOnly
                                    className="h-11 rounded-xl border-gray-200 bg-white text-gray-400 cursor-not-allowed"
                                    placeholder="+000000000000"
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
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[15px] font-bold text-gray-900">
                                    Confirm Password
                                </Label>
                                <p className="text-sm text-gray-500">Confirm your new password</p>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    className="h-11 rounded-xl border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent"
                                    placeholder="••••••••"
                                />
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
