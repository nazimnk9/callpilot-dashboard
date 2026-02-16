"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

export function OrganizationContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [initialOrg, setInitialOrg] = useState({
        name: "",
        slug: ""
    })
    const [org, setOrg] = useState({
        name: "",
        slug: ""
    })

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
        fetchOrganization()
    }, [])

    const fetchOrganization = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getOrganization()
            const data = response.data
            const orgData = {
                name: data.name || "",
                slug: data.slug || ""
            }
            setInitialOrg(orgData)
            setOrg(orgData)
        } catch (err: any) {
            console.error("Error fetching organization:", err)
            setAlertConfig({
                open: true,
                title: "Error",
                description: ["Failed to load organization data."],
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        const payload: any = {}
        if (org.name !== initialOrg.name) payload.name = org.name

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
            const response = await profileService.updateOrganization(payload)
            const updatedData = {
                name: response.data.name || org.name,
                slug: response.data.slug || org.slug
            }
            setOrg(updatedData)
            setInitialOrg(updatedData)
            setAlertConfig({
                open: true,
                title: "Success",
                description: ["Organization updated successfully."],
                variant: "default"
            })
        } catch (err: any) {
            console.error("Error updating organization:", err)
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
                    description: ["Failed to update organization. Please try again."],
                    variant: "destructive"
                })
            }
        } finally {
            setIsSaving(false)
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

            <div className="max-w-4xl mx-auto space-y-12">
                {/* Page Title */}
                <div>
                    <h1 className="text-lg font-bold text-gray-900">Organization settings</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-x-12 gap-y-8">
                    {/* Left Column - Section Header */}
                    <div>
                        <h2 className="text-[15px] font-bold text-gray-900">Details</h2>
                    </div>

                    {/* Right Column - Inputs */}
                    <div className="max-w-md space-y-8">
                        {/* Organization Name Field */}
                        <div className="space-y-3">
                            <Label htmlFor="org_name" className="text-[14px] font-bold text-gray-900">
                                Organization name
                            </Label>
                            <p className="text-[13px] text-gray-500 leading-tight">
                                Human-friendly label for your organization, shown in user interfaces
                            </p>
                            <Input
                                id="org_name"
                                value={org.name}
                                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                                className="h-10 rounded-lg border-gray-200 focus:ring-1 focus:ring-gray-300 focus:border-transparent text-[14px]"
                                placeholder="Enter organization name"
                            />
                            <div className="pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    variant="secondary"
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-4 h-9 rounded-md transition-all text-[13px] shadow-none"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>

                        {/* Organization ID Field */}
                        <div className="space-y-3 pt-4">
                            <Label htmlFor="org_id" className="text-[14px] font-bold text-gray-900">
                                Organization ID
                            </Label>
                            <p className="text-[13px] text-gray-500 leading-tight">
                                Identifier for this organization sometimes used in API requests
                            </p>
                            <Input
                                id="org_id"
                                value={org.slug}
                                readOnly
                                className="h-10 rounded-lg border-gray-200 bg-gray-50/50 text-gray-500 cursor-default text-[14px] focus-visible:ring-0"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
