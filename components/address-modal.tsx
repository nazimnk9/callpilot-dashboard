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
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AddressModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onBack: () => void
    onNext: (addressData: any) => void
    selectedCountryCode?: string
}

interface Country {
    country: string
    country_code: string
}

export function AddressModal({ open, onOpenChange, onBack, onNext, selectedCountryCode }: AddressModalProps) {
    const [error, setError] = useState("")
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [countries, setCountries] = useState<Country[]>([])
    const [countrySearch, setCountrySearch] = useState("")
    const [showCountriesDropdown, setShowCountriesDropdown] = useState(false)
    const [isHydrated, setIsHydrated] = useState(false)

    const [formData, setFormData] = useState({
        customer_name: "",
        street: "",
        city: "",
        region: "",
        postal_code: "",
        iso_country: selectedCountryCode || "",
    })

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsHydrated(true)
            if (open) {
                const savedData = localStorage.getItem("addressData")
                if (savedData) {
                    setFormData(JSON.parse(savedData))
                } else if (selectedCountryCode) {
                    setFormData((prev) => ({
                        ...prev,
                        iso_country: selectedCountryCode,
                    }))
                }
            }
        }
    }, [open, selectedCountryCode])

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
        const updatedData = { ...formData, iso_country: countryCode }
        setFormData(updatedData)
        if (typeof window !== "undefined") {
            localStorage.setItem("addressData", JSON.stringify(updatedData))
        }
        setShowCountriesDropdown(false)
        setCountrySearch("")
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        const updatedData = { ...formData, [name]: value }
        setFormData(updatedData)
        if (typeof window !== "undefined") {
            localStorage.setItem("addressData", JSON.stringify(updatedData))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (
            !formData.customer_name ||
            !formData.street ||
            !formData.city ||
            !formData.postal_code ||
            !formData.iso_country
        ) {
            setError("Please fill in all required fields")
            setShowErrorDialog(true)
            return
        }

        if (typeof window !== "undefined") {
            localStorage.setItem("addressData", JSON.stringify(formData))
        }
        onNext(formData)
    }

    const handleCancel = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("addressData")
        }
        setFormData({
            customer_name: "",
            street: "",
            city: "",
            region: "",
            postal_code: "",
            iso_country: selectedCountryCode || "",
        })
        setError("")
        onOpenChange(false)
    }

    if (!isHydrated) {
        return null
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Address Information</DialogTitle>
                        <DialogDescription>Step 3 of 3: Provide address details</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Customer Name *</label>
                            <Input
                                placeholder="e.g., Steven Peddie"
                                name="customer_name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                className="border-2 border-border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">Street *</label>
                            <Input
                                placeholder="e.g., Herkimer House Mill Road"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                className="border-2 border-border"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">City *</label>
                                <Input
                                    placeholder="e.g., Linlithgow"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="border-2 border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Region</label>
                                <Input
                                    placeholder="e.g., West Lothian, Scotland"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className="border-2 border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Postal Code *</label>
                                <Input
                                    placeholder="e.g., EH49 7SF"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                    className="border-2 border-border"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Country *</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountriesDropdown(!showCountriesDropdown)}
                                        className="cursor-pointer w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary"
                                    >
                                        <span>
                                            {formData.iso_country
                                                ? `${formData.iso_country} - ${countries.find((c) => c.country_code === formData.iso_country)?.country}`
                                                : "Select"}
                                        </span>
                                        <ChevronDown
                                            className={`w-5 h-5 transition-transform ${showCountriesDropdown ? "rotate-180" : ""}`}
                                        />
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
                                                        className="cursor-pointer w-full px-4 py-3 text-left hover:bg-primary/10 text-foreground flex items-center justify-between border-b border-border/50"
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
                        </div>

                        <DialogFooter className="flex gap-3 pt-6 border-t border-border">
                            <Button
                                type="button"
                                onClick={onBack}
                                variant="outline"
                                className="cursor-pointer flex-1 border-2 border-border bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="cursor-pointer flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-2" />
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
