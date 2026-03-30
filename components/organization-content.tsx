"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { profileService } from "@/services/profile-service"
import { LoaderOverlay } from "@/components/auth/loader-overlay"
import { Search, ChevronsUpDown, Check } from "lucide-react"
import countriesData from "@/lib/countries.json";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export function OrganizationContent() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [initialOrg, setInitialOrg] = useState({
        name: "",
        uid: "",
        business_name: "",
        reg_number: "",
        country: "",
        street_address: "",
        apt_or_suite: "",
        city: "",
        post_code: "",
        province: "",
        business_registration_certificate: null as File | null,
        proof_of_address: null as File | null,
        reg_address: "",
        town: "",
        vat_number: "",
        state: "",
        billing_contact_name: "",
        billing_email_address: "",
        is_submitted_for_verification: false,
        existing_certificate_url: "",
        existing_proof_url: ""
    })
    const [org, setOrg] = useState({
        name: "",
        uid: "",
        business_name: "",
        reg_number: "",
        country: "",
        street_address: "",
        apt_or_suite: "",
        city: "",
        post_code: "",
        province: "",
        business_registration_certificate: null as File | null,
        proof_of_address: null as File | null,
        reg_address: "",
        town: "",
        vat_number: "",
        state: "",
        billing_contact_name: "",
        billing_email_address: "",
        is_submitted_for_verification: false,
        existing_certificate_url: "",
        existing_proof_url: ""
    })
    const [editOrg, setEditOrg] = useState({ ...org })

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
    const [countrySearch, setCountrySearch] = useState("");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [countries] = useState<{ country: string, country_code: string, phone_code: string }[]>(countriesData);

    useEffect(() => {
        fetchOrganization()
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCountryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        (c.phone_code && c.phone_code.includes(countrySearch))
    );

    const fetchOrganization = async () => {
        try {
            setIsLoading(true)
            const response = await profileService.getOrganization()
            const data = response.data
            const orgData = {
                name: data.name || "",
                uid: data.uid || "",
                business_name: data.business_name || data.name || "",
                reg_number: data.reg_number || "",
                country: data.country || "",
                street_address: data.street_address || "",
                apt_or_suite: data.apt_or_suite || "",
                city: data.city || "",
                post_code: data.post_code || "",
                province: data.province || "",
                business_registration_certificate: null,
                proof_of_address: null,
                reg_address: data.reg_address || "",
                town: data.town || "",
                vat_number: data.vat_number || "",
                state: data.state || "",
                billing_contact_name: data.billing_contact_name || "",
                billing_email_address: data.billing_email_address || "",
                is_submitted_for_verification: data.is_submitted_for_verification || false,
                existing_certificate_url: data.business_registration_certificate || "",
                existing_proof_url: data.proof_of_address || ""
            }
            setInitialOrg(orgData)
            setOrg(orgData)
            setEditOrg(orgData)
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

    const handleCancel = () => {
        setEditOrg({ ...org })
    }

    const handleSave = async () => {
        const formData = new FormData();

        const finalData = {
            business_name: editOrg.business_name,
            reg_number: editOrg.reg_number,
            country: editOrg.country,
            street_address: editOrg.street_address,
            apt_or_suite: editOrg.apt_or_suite,
            city: editOrg.city,
            post_code: editOrg.post_code,
            province: editOrg.province,
            name: editOrg.business_name // Mandatory match
        };

        Object.keys(finalData).forEach(key => {
            if (finalData[key as keyof typeof finalData] !== null && finalData[key as keyof typeof finalData] !== undefined) {
                formData.append(key, finalData[key as keyof typeof finalData] as string);
            }
        });

        if (editOrg.business_registration_certificate instanceof File) {
            formData.append("business_registration_certificate", editOrg.business_registration_certificate);
        }
        if (editOrg.proof_of_address instanceof File) {
            formData.append("proof_of_address", editOrg.proof_of_address);
        }

        try {
            setIsSaving(true)
            await profileService.updateOrganization(formData)

            // Re-fetch to update all data including potential API-side name adjustments
            fetchOrganization()

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
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 p-4 md:p-8">
            <LoaderOverlay isLoading={isLoading || isSaving} />

            <AlertDialog open={alertConfig.open} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, open }))}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={alertConfig.variant === "destructive" ? "text-destructive dark:text-red-400" : "dark:text-gray-100"}>
                            {alertConfig.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2 dark:text-gray-400" asChild>
                            <div className="space-y-2">
                                {alertConfig.description.map((error, index) => (
                                    <div key={index} className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertConfig(prev => ({ ...prev, open: false }))} className="dark:bg-gray-100 dark:text-gray-900">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Business Details</h2>
                    </div>

                    <div className="p-8 space-y-12">
                        {/* Business Information Section */}
                        <div className="space-y-6">
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Information</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Basic identification details for your business.</p>
                            </div>
                            {editOrg.is_submitted_for_verification && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Verification in progress. Details are locked until reviewed.
                                    </p>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name" className="text-sm font-semibold dark:text-gray-100">Business Name</Label>
                                    <Input
                                        id="business_name"
                                        placeholder="Enter business name"
                                        value={editOrg.business_name}
                                        onChange={(e) => setEditOrg({ ...editOrg, business_name: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg_number" className="text-sm font-semibold dark:text-gray-100">Business Registration Number</Label>
                                    <Input
                                        id="reg_number"
                                        placeholder="Enter registration number"
                                        value={editOrg.reg_number}
                                        onChange={(e) => setEditOrg({ ...editOrg, reg_number: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Address Section */}
                        <div className="space-y-6">
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Address</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Physical and legal location of your business.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold dark:text-gray-100">Business Country</Label>
                                    <div className="relative" ref={dropdownRef}>
                                        <div
                                            onClick={() => !editOrg.is_submitted_for_verification && setIsCountryOpen(!isCountryOpen)}
                                            className={`w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md h-10 px-3 flex items-center justify-between transition-colors ${editOrg.is_submitted_for_verification ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"}`}
                                        >
                                            <span className={editOrg.country ? "text-gray-900 dark:text-gray-100 text-[14px]" : "text-gray-400 dark:text-gray-500 text-[14px]"}>
                                                {editOrg.country || "Select country"}
                                            </span>
                                            <ChevronsUpDown size={16} className="text-gray-400" />
                                        </div>

                                        {!editOrg.is_submitted_for_verification && isCountryOpen && (
                                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder="Search country..."
                                                            value={countrySearch}
                                                            onChange={(e) => setCountrySearch(e.target.value)}
                                                            className="w-full bg-white dark:bg-gray-800 border-none py-1.5 pl-9 pr-4 text-[14px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {filteredCountries.length > 0 ? (
                                                        filteredCountries.map((c) => (
                                                            <div
                                                                key={c.country_code}
                                                                onClick={() => {
                                                                    setEditOrg({ ...editOrg, country: c.country });
                                                                    setIsCountryOpen(false);
                                                                    setCountrySearch("");
                                                                }}
                                                                className="px-4 py-2.5 text-[14px] font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">{c.country_code}</span>
                                                                    <span>{c.country}</span>
                                                                </div>
                                                                {editOrg.country === c.country && (
                                                                    <Check size={14} className="text-primary" />
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-xs italic">
                                                            No countries found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="street_address" className="text-sm font-semibold dark:text-gray-100">Street Address</Label>
                                    <Input
                                        id="street_address"
                                        placeholder="Enter street address"
                                        value={editOrg.street_address}
                                        onChange={(e) => setEditOrg({ ...editOrg, street_address: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="apt_or_suite" className="text-sm font-semibold dark:text-gray-100">APT/Suite</Label>
                                    <Input
                                        id="apt_or_suite"
                                        placeholder="Enter apartment or suite"
                                        value={editOrg.apt_or_suite}
                                        onChange={(e) => setEditOrg({ ...editOrg, apt_or_suite: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-sm font-semibold dark:text-gray-100">City</Label>
                                    <Input
                                        id="city"
                                        placeholder="Enter city"
                                        value={editOrg.city}
                                        onChange={(e) => setEditOrg({ ...editOrg, city: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="post_code" className="text-sm font-semibold dark:text-gray-100">Post Office</Label>
                                    <Input
                                        id="post_code"
                                        placeholder="Enter post code"
                                        value={editOrg.post_code}
                                        onChange={(e) => setEditOrg({ ...editOrg, post_code: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province" className="text-sm font-semibold dark:text-gray-100">Province</Label>
                                    <Input
                                        id="province"
                                        placeholder="Enter province"
                                        value={editOrg.province}
                                        onChange={(e) => setEditOrg({ ...editOrg, province: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                        disabled={editOrg.is_submitted_for_verification}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Supporting Documents Section */}
                        <div className="space-y-6">
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Supporting Documents</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Compliance documents for account verification.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="cert" className="text-sm font-semibold dark:text-gray-100">Business Registration Certificate</Label>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            id="cert"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setEditOrg({ ...editOrg, business_registration_certificate: e.target.files?.[0] || null })}
                                            className="cursor-pointer dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                            disabled={editOrg.is_submitted_for_verification}
                                        />
                                        {editOrg.is_submitted_for_verification && editOrg.existing_certificate_url && (
                                            <a
                                                href={editOrg.existing_certificate_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                View submitted certificate
                                            </a>
                                        )}
                                        {editOrg.business_registration_certificate && (
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <Check size={12} /> {(editOrg.business_registration_certificate as File).name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="proof" className="text-sm font-semibold dark:text-gray-100">Proof of Address</Label>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            id="proof"
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setEditOrg({ ...editOrg, proof_of_address: e.target.files?.[0] || null })}
                                            className="cursor-pointer dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                            disabled={editOrg.is_submitted_for_verification}
                                        />
                                        <p className="text-[10px] text-gray-500 italic">Utility Bill or Tax Notice Or Rent</p>
                                        {editOrg.is_submitted_for_verification && editOrg.existing_proof_url && (
                                            <a
                                                href={editOrg.existing_proof_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                            >
                                                View submitted proof
                                            </a>
                                        )}
                                        {editOrg.proof_of_address && (
                                            <p className="text-xs text-green-500 flex items-center gap-1">
                                                <Check size={12} /> {(editOrg.proof_of_address as File).name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Billing Info (Optional, keeping consistent with previous UI but matching style) */}
                        {/* <div className="space-y-6">
                            <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Billing Information</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Contact details for invoicing and billing.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="billing_contact" className="text-sm font-semibold dark:text-gray-100">Billing Contact Name</Label>
                                    <Input
                                        id="billing_contact"
                                        value={editOrg.billing_contact_name}
                                        onChange={(e) => setEditOrg({ ...editOrg, billing_contact_name: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="billing_email" className="text-sm font-semibold dark:text-gray-100">Billing Email Address</Label>
                                    <Input
                                        id="billing_email"
                                        value={editOrg.billing_email_address}
                                        onChange={(e) => setEditOrg({ ...editOrg, billing_email_address: e.target.value })}
                                        className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                    />
                                </div>
                            </div>
                        </div> */}

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                onClick={() => router.back()}
                                variant="outline"
                                className="dark:bg-gray-800 dark:text-gray-100 border-none"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || editOrg.is_submitted_for_verification}
                                className="bg-primary hover:bg-black text-white dark:text-black dark:bg-primary"
                            >
                                {isSaving ? "Saving..." : "Submit for Verification"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
