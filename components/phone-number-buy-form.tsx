"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ChevronDown, Search } from "lucide-react"
import { phoneService } from "@/services/phone-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { ToastNotification } from "@/components/auth/toast-notification"
import { CreateBundleModal } from "./create-bundle-modal"
import { EndUserModal } from "./end-user-modal"
import { AddressModal } from "./address-modal"
import { FinalSubmissionModal } from "./final-submission-modal"
import { useRouter } from "next/navigation"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Country {
    country: string
    country_code: string
}

interface PhoneNumber {
    phone_number: string
    friendly_name: string
    locality: string
    region: string
}

interface Bundle {
    id: string
    friendly_name: string
}

export function PhoneNumberBuyForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [error, setError] = useState("")
    const [showErrorDialog, setShowErrorDialog] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [toast, setToast] = useState<any>(null)
    const router = useRouter()

    // Country selection
    const [countries, setCountries] = useState<Country[]>([])
    const [selectedCountry, setSelectedCountry] = useState("")
    const [countrySearch, setCountrySearch] = useState("")
    const [showCountriesDropdown, setShowCountriesDropdown] = useState(false)

    // Phone number selection
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("")
    const [phoneSearch, setPhoneSearch] = useState("")
    const [showPhoneDropdown, setShowPhoneDropdown] = useState(false)

    // Bundle selection
    const [bundles, setBundles] = useState<Bundle[]>([])
    const [selectedBundle, setSelectedBundle] = useState("")
    const [bundleSearch, setBundleSearch] = useState("")
    const [showBundleDropdown, setShowBundleDropdown] = useState(false)

    // Modals
    const [showCreateBundleModal, setShowCreateBundleModal] = useState(false)
    const [showEndUserModal, setShowEndUserModal] = useState(false)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [showFinalModal, setShowFinalModal] = useState(false)
    const [createBundleStep, setCreateBundleStep] = useState(0)

    useEffect(() => {
        if (typeof window !== "undefined") {
            fetchCountries()
            fetchBundles()
        }
    }, [])

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

    const fetchBundles = async () => {
        try {
            const response = await phoneService.getBundles()
            setBundles(response.data.results || [])
        } catch (err: any) {
            console.log("Error fetching bundles:", err)
        }
    }

    const fetchPhoneNumbers = async (countryCode: string) => {
        try {
            setIsFetching(true)
            const response = await phoneService.getAvailableNumbers(countryCode)
            if (response.data.phone_numbers) {
                setPhoneNumbers(response.data.phone_numbers)
            }
        } catch (err: any) {
            console.log("Error fetching phone numbers:", err)
            setError("Failed to load phone numbers")
            setShowErrorDialog(true)
        } finally {
            setIsFetching(false)
        }
    }

    const handleCountrySelect = (countryCode: string) => {
        setSelectedCountry(countryCode)
        setShowCountriesDropdown(false)
        setCountrySearch("")
        fetchPhoneNumbers(countryCode)
        setSelectedPhoneNumber("")
        setPhoneNumbers([])
    }

    const filteredCountries = countries.filter(
        (c) =>
            c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.country_code.toLowerCase().includes(countrySearch.toLowerCase()),
    )

    const filteredPhoneNumbers = phoneNumbers.filter((p) =>
        p.phone_number.toLowerCase().includes(phoneSearch.toLowerCase()),
    )

    const filteredBundles = bundles.filter((b) => b.friendly_name.toLowerCase().includes(bundleSearch.toLowerCase()))

    const handleCreateBundleNext = () => {
        setCreateBundleStep(1)
    }

    const handleEndUserNext = () => {
        setCreateBundleStep(2)
    }

    const handleAddressNext = () => {
        setShowFinalModal(true)
    }

    const handleFinalSubmitSuccess = (bundleData: any) => {
        setBundles((prev) => [...prev, bundleData])
        setSelectedBundle(bundleData.id)
        setShowCreateBundleModal(false)
        setShowFinalModal(false)
        setCreateBundleStep(0)
        setToast({
            title: "Success",
            description: "Bundle created successfully",
            variant: "default",
        })
    }

    const handleSubmitPurchase = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!selectedPhoneNumber || !selectedBundle) {
            setError("Please select both phone number and bundle")
            setShowErrorDialog(true)
            return
        }

        try {
            setIsLoading(true)
            await phoneService.buyNumber({
                phone_number: selectedPhoneNumber,
                bundle_id: selectedBundle,
            });

            setSuccessMessage("Phone number purchased successfully");
            setShowSuccessDialog(true);
        } catch (err: any) {
            console.log("Error purchasing phone number:", err)
            const errorMessage = err.response?.data?.error || "Failed to purchase phone number"
            setError(errorMessage)
            setShowErrorDialog(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSuccessDialogClose = () => {
        setShowSuccessDialog(false);
        router.push("/dashboard/phone-numbers");
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background">
            <LoaderOverlay isLoading={isLoading || isFetching} />
            {toast && (
                <ToastNotification
                    title={toast.title}
                    description={toast.description}
                    variant={toast.variant}
                    onClose={() => setToast(null)}
                />
            )}

            <CreateBundleModal
                open={showCreateBundleModal && createBundleStep === 0}
                onOpenChange={(open) => !open && setShowCreateBundleModal(false)}
                onNext={handleCreateBundleNext}
                selectedCountryCode={selectedCountry}
            />

            <EndUserModal
                open={showCreateBundleModal && createBundleStep === 1}
                onOpenChange={(open) => !open && setShowCreateBundleModal(false)}
                onBack={() => setCreateBundleStep(0)}
                onNext={handleEndUserNext}
            />

            <AddressModal
                open={showCreateBundleModal && createBundleStep === 2}
                onOpenChange={(open) => !open && setShowCreateBundleModal(false)}
                onBack={() => setCreateBundleStep(1)}
                onNext={handleAddressNext}
                selectedCountryCode={selectedCountry}
            />

            <FinalSubmissionModal
                open={showFinalModal}
                onOpenChange={(open) => !open && setShowFinalModal(false)}
                onBack={() => {
                    setShowFinalModal(false)
                    setCreateBundleStep(2)
                }}
                onSuccess={handleFinalSubmitSuccess}
            />

            <div className="p-4 md:p-8 space-y-8 bg-white dark:bg-gray-950">
                {/* Header */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Buy Phone Number</h1>
                        <p className="text-muted-foreground mt-2">Select country, phone number, and bundle to purchase</p>
                    </div>
                </div>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                    <CardHeader className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                        <CardTitle className="text-2xl">Phone Number Purchase</CardTitle>
                        <CardDescription>Select your preferred country, phone number, and bundle</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmitPurchase} className="space-y-6">
                            {/* Country Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">Select Country *</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountriesDropdown(!showCountriesDropdown)}
                                        className="cursor-pointer w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary focus:border-primary transition-all"
                                    >
                                        <span>
                                            {selectedCountry
                                                ? `${selectedCountry} - ${countries.find((c) => c.country_code === selectedCountry)?.country}`
                                                : "Select Country"}
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
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    className="border border-border"
                                                />
                                            </div>
                                            <div className="overflow-y-auto">
                                                {filteredCountries.map((country) => (
                                                    <button
                                                        key={country.country_code}
                                                        type="button"
                                                        onClick={() => handleCountrySelect(country.country_code)}
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

                            {/* Phone Number Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">Select Phone Number *</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowPhoneDropdown(!showPhoneDropdown)}
                                        disabled={!selectedCountry}
                                        className="cursor-pointer w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <span>
                                            {selectedPhoneNumber || (selectedCountry ? "Select Phone Number" : "Select a country first")}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${showPhoneDropdown ? "rotate-180" : ""}`} />
                                    </button>

                                    {showPhoneDropdown && selectedCountry && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
                                            <div className="p-2 border-b border-border">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search phone numbers..."
                                                        value={phoneSearch}
                                                        onChange={(e) => setPhoneSearch(e.target.value)}
                                                        className="border border-border pl-9"
                                                    />
                                                </div>
                                            </div>
                                            <div className="overflow-y-auto">
                                                {filteredPhoneNumbers.map((phone) => (
                                                    <button
                                                        key={phone.phone_number}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPhoneNumber(phone.phone_number)
                                                            setShowPhoneDropdown(false)
                                                            setPhoneSearch("")
                                                        }}
                                                        className="cursor-pointer w-full px-4 py-3 text-left hover:bg-primary/10 text-foreground flex items-center justify-between border-b border-border/50 last:border-b-0"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{phone.phone_number}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {phone.locality}, {phone.region}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bundle Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-semibold text-foreground">Select Bundle *</label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setCreateBundleStep(0)
                                            setShowCreateBundleModal(true)
                                        }}
                                        className="cursor-pointer text-xs border-2 border-primary text-primary hover:bg-muted bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50"
                                    >
                                        + Create Bundle
                                    </Button>
                                </div>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowBundleDropdown(!showBundleDropdown)}
                                        className="cursor-pointer w-full px-4 py-3 border-2 border-border rounded-lg bg-background text-foreground text-left flex items-center justify-between hover:border-primary transition-all"
                                    >
                                        <span>
                                            {selectedBundle ? bundles.find((b: any) => b.id === selectedBundle)?.friendly_name : "Select Bundle"}
                                        </span>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${showBundleDropdown ? "rotate-180" : ""}`} />
                                    </button>

                                    {showBundleDropdown && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden flex flex-col">
                                            <div className="p-2 border-b border-border">
                                                <Input
                                                    placeholder="Search bundles..."
                                                    value={bundleSearch}
                                                    onChange={(e) => setBundleSearch(e.target.value)}
                                                    className="border border-border"
                                                />
                                            </div>
                                            <div className="overflow-y-auto">
                                                {filteredBundles.map((bundle: any) => (
                                                    <button
                                                        key={bundle.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedBundle(bundle.id)
                                                            setShowBundleDropdown(false)
                                                            setBundleSearch("")
                                                        }}
                                                        className="cursor-pointer w-full px-4 py-3 text-left hover:bg-primary/10 text-foreground border-b border-border/50 last:border-b-0"
                                                    >
                                                        {bundle.friendly_name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3 pt-6 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer border-2 border-border bg-gradient-to-r from-primary/20 to-primary/20 dark:hover:text-white/50"
                                    onClick={() => router.back()}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !selectedPhoneNumber || !selectedBundle}
                                    className="cursor-pointer bg-primary/50 hover:bg-primary/70 text-primary-foreground font-semibold"
                                >
                                    {isLoading ? "Processing..." : "Submit Purchase"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

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

            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Success</AlertDialogTitle>
                        <AlertDialogDescription>
                            {successMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleSuccessDialogClose}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
