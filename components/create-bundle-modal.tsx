"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreateBundleModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onNext: (bundleData: any) => void
    selectedCountryCode?: string
}

interface Country {
    country: string
    country_code: string
}

export function CreateBundleModal({ open, onOpenChange, onNext, selectedCountryCode }: CreateBundleModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [countries, setCountries] = useState<Country[]>([])
    const [error, setError] = useState("")
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [toast, setToast] = useState<any>(null)
    const [countrySearch, setCountrySearch] = useState("")
    const [showCountriesDropdown, setShowCountriesDropdown] = useState(false)

    const [formData, setFormData] = useState({
        friendly_name: "",
        country_code: selectedCountryCode || "",
        number_type: "local",
        email: "",
    })

    useEffect(() => {
        if (selectedCountryCode) {
            setFormData((prev) => ({
                ...prev,
                country_code: selectedCountryCode,
            }))
        }
    }, [selectedCountryCode])

    useEffect(() => {
        if (open && typeof window !== "undefined") {
            fetchCountries()
        }
    }, [open])

    const fetchCountries = async () => {
        try {
            const response = await phoneService.getCountries()
            if (response.data.countries) {
                setCountries(response.data.countries)
            }
        } catch (err: any) {
            console.log("Error fetching countries:", err)
            setError("Failed to load countries")
            setShowErrorDialog(true)
        }
    }

    const handleCountrySearch = (search: string) => {
        setCountrySearch(search)
    }

    const filteredCountries = countries.filter(
        (country) =>
            country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
            country.country_code.toLowerCase().includes(countrySearch.toLowerCase()),
    )

    const handleSelectCountry = (countryCode: string) => {
        setFormData((prev) => ({
            ...prev,
            country_code: countryCode,
        }))
        setShowCountriesDropdown(false)
        setCountrySearch("")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!formData.friendly_name || !formData.country_code || !formData.email) {
            setError("Please fill in all required fields")
            setShowErrorDialog(true)
            return
        }

        const bundleData = {
            friendly_name: formData.friendly_name,
            country_code: formData.country_code,
            number_type: formData.number_type,
            email: formData.email,
        }

        localStorage.setItem("bundleData", JSON.stringify(bundleData))
        onNext(bundleData)
    }

    const handleCancel = () => {
        setFormData({
            friendly_name: "",
            country_code: selectedCountryCode || "",
            number_type: "local",
            email: "",
        })
        setCountrySearch("")
        setError("")
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <LoaderOverlay isLoading={isLoading} />
                    {toast && (
                        <ToastNotification
                            title={toast.title}
                            description={toast.description}
                            variant={toast.variant}
                            onClose={() => setToast(null)}
                        />
                    )}

                    <DialogHeader>
                        <DialogTitle className="text-2xl">Create Bundle</DialogTitle>
                        <DialogDescription>Step 1 of 3: Bundle Information</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Friendly Name */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Friendly Name *</label>
                            <Input
                                placeholder="e.g., UK Business Bundle"
                                value={formData.friendly_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, friendly_name: e.target.value }))}
                                className="border-2 border-border"
                            />
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Country *</label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCountriesDropdown(!showCountriesDropdown)}
                                    className="cursor-pointer w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary focus:border-primary transition-all"
                                >
                                    <span>
                                        {formData.country_code
                                            ? `${formData.country_code} - ${countries.find((c) => c.country_code === formData.country_code)?.country}`
                                            : "Select Country"}
                                    </span>
                                    <ChevronDown className={`w-5 h-5 transition-transform ${showCountriesDropdown ? "rotate-180" : ""}`} />
                                </button>

                                {showCountriesDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
                                        <div className="p-2 border-b border-border">
                                            <Input
                                                placeholder="Search countries..."
                                                value={countrySearch}
                                                onChange={(e) => handleCountrySearch(e.target.value)}
                                                className="border border-border"
                                            />
                                        </div>
                                        <div className="overflow-y-auto">
                                            {filteredCountries.map((country) => (
                                                <button
                                                    key={country.country_code}
                                                    type="button"
                                                    onClick={() => handleSelectCountry(country.country_code)}
                                                    className="cursor-pointer w-full px-4 py-3 text-left hover:bg-primary/10 text-foreground flex items-center justify-between border-b border-border/50 last:border-b-0"
                                                >
                                                    <span>{country.country}</span>
                                                    <span className="text-xs font-semibold text-primary">{country.country_code}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Number Type */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Number Type *</label>
                            <div className="relative">
                                <select
                                    value={formData.number_type}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, number_type: e.target.value }))}
                                    className="w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground appearance-none cursor-pointer font-medium"
                                >
                                    <option value="local">Local</option>
                                    <option value="national">National</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="toll-free">Toll-Free</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                className="border-2 border-border"
                            />
                        </div>

                        {/* Buttons */}
                        <DialogFooter className="flex gap-3 pt-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={handleCancel}
                                variant="outline"
                                className="cursor-pointer flex-1 border-2 border-border bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="cursor-pointer flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            >
                                Next
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
