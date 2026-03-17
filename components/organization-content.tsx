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
        reg_address: "",
        town: "",
        post_code: "",
        country: "",
        reg_number: "",
        vat_number: "",
        state: "",
        billing_contact_name: "",
        billing_email_address: ""
    })
    const [org, setOrg] = useState({
        name: "",
        uid: "",
        reg_address: "",
        town: "",
        post_code: "",
        country: "",
        reg_number: "",
        vat_number: "",
        state: "",
        billing_contact_name: "",
        billing_email_address: ""
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
                reg_address: data.reg_address || "",
                town: data.town || "",
                post_code: data.post_code || "",
                country: data.country || "",
                reg_number: data.reg_number || "",
                vat_number: data.vat_number || "",
                state: data.state || "",
                billing_contact_name: data.billing_contact_name || "",
                billing_email_address: data.billing_email_address || ""
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
        const payload: any = {}
        if (editOrg.name !== initialOrg.name) payload.name = editOrg.name
        if (editOrg.reg_address !== initialOrg.reg_address) payload.reg_address = editOrg.reg_address
        if (editOrg.town !== initialOrg.town) payload.town = editOrg.town
        if (editOrg.post_code !== initialOrg.post_code) payload.post_code = editOrg.post_code
        if (editOrg.country !== initialOrg.country) payload.country = editOrg.country
        if (editOrg.reg_number !== initialOrg.reg_number) payload.reg_number = editOrg.reg_number
        if (editOrg.vat_number !== initialOrg.vat_number) payload.vat_number = editOrg.vat_number
        if (editOrg.state !== initialOrg.state) payload.state = editOrg.state
        if (editOrg.billing_contact_name !== initialOrg.billing_contact_name) payload.billing_contact_name = editOrg.billing_contact_name
        if (editOrg.billing_email_address !== initialOrg.billing_email_address) payload.billing_email_address = editOrg.billing_email_address

        // if (Object.keys(payload).length === 0) {
        //     return
        // }

        try {
            setIsSaving(true)
            const response = await profileService.updateOrganization(payload)
            const updatedData = {
                name: response.data.name || editOrg.name,
                uid: response.data.uid || editOrg.uid,
                reg_address: response.data.reg_address || editOrg.reg_address,
                town: response.data.town || editOrg.town,
                post_code: response.data.post_code || editOrg.post_code,
                country: response.data.country || editOrg.country,
                reg_number: response.data.reg_number || editOrg.reg_number,
                vat_number: response.data.vat_number || editOrg.vat_number,
                state: response.data.state || editOrg.state,
                billing_contact_name: response.data.billing_contact_name || editOrg.billing_contact_name,
                billing_email_address: response.data.billing_email_address || editOrg.billing_email_address
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

            <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold dark:text-gray-100">Verify Details</h1>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="edit_org_name" className="text-sm font-semibold dark:text-gray-100">Company name</Label>
                                <Input
                                    id="edit_org_name"
                                    value={editOrg.name}
                                    onChange={(e) => setEditOrg({ ...editOrg, name: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_reg_address" className="text-sm font-semibold dark:text-gray-100">Registered Address</Label>
                                <Input
                                    id="edit_reg_address"
                                    value={editOrg.reg_address}
                                    onChange={(e) => setEditOrg({ ...editOrg, reg_address: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_town" className="text-sm font-semibold dark:text-gray-100">Town</Label>
                                <Input
                                    id="edit_town"
                                    value={editOrg.town}
                                    onChange={(e) => setEditOrg({ ...editOrg, town: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_state" className="text-sm font-semibold dark:text-gray-100">State/Region</Label>
                                <Input
                                    id="edit_state"
                                    value={editOrg.state}
                                    onChange={(e) => setEditOrg({ ...editOrg, state: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_post_code" className="text-sm font-semibold dark:text-gray-100">Post Code</Label>
                                <Input
                                    id="edit_post_code"
                                    value={editOrg.post_code}
                                    onChange={(e) => setEditOrg({ ...editOrg, post_code: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_country" className="text-sm font-semibold dark:text-gray-100">Country</Label>
                                <div className="relative" ref={dropdownRef}>
                                    <div
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md h-10 px-3 flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                    >
                                        <span className={editOrg.country ? "text-gray-900 dark:text-gray-100 text-[14px]" : "text-gray-400 dark:text-gray-500 text-[14px]"}>
                                            {editOrg.country || "Select country"}
                                        </span>
                                        <ChevronsUpDown size={16} className="text-gray-400" />
                                    </div>

                                    {isCountryOpen && (
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
                                                        className="w-full bg-white dark:bg-gray-900 border-none py-1.5 pl-9 pr-4 text-[14px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0"
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
                                                                {c.phone_code && (
                                                                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-auto">+{c.phone_code}</span>
                                                                )}
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
                                <Label htmlFor="edit_reg_number" className="text-sm font-semibold dark:text-gray-100">Registration Number</Label>
                                <Input
                                    id="edit_reg_number"
                                    value={editOrg.reg_number}
                                    onChange={(e) => setEditOrg({ ...editOrg, reg_number: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_vat_number" className="text-sm font-semibold dark:text-gray-100">VAT Number</Label>
                                <Input
                                    id="edit_vat_number"
                                    value={editOrg.vat_number}
                                    onChange={(e) => setEditOrg({ ...editOrg, vat_number: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                
                            <div className="space-y-2">
                                <Label htmlFor="edit_billing_contact_name" className="text-sm font-semibold dark:text-gray-100">Billing Contact Name</Label>
                                <Input
                                    id="edit_billing_contact_name"
                                    value={editOrg.billing_contact_name}
                                    onChange={(e) => setEditOrg({ ...editOrg, billing_contact_name: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit_billing_email" className="text-sm font-semibold dark:text-gray-100">Billing Email Address</Label>
                                <Input
                                    id="edit_billing_email"
                                    value={editOrg.billing_email_address}
                                    onChange={(e) => setEditOrg({ ...editOrg, billing_email_address: e.target.value })}
                                    className="dark:bg-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                onClick={router.back}
                                variant="outline"
                                className="dark:bg-gray-800 dark:text-gray-100 border-none"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-black text-white dark:text-black dark:bg-primary"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
