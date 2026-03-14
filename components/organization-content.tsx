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

export function OrganizationContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [initialOrg, setInitialOrg] = useState({
        name: "",
        uid: "",
        reg_address: "",
        town: "",
        post_code: "",
        country: "",
        reg_number: "",
        vat_number: "",
        billing_contact: "",
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
        billing_contact: "",
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

    const [countries] = useState<{ country: string, country_code: string }[]>(countriesData);

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
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase())
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
                billing_contact: data.billing_contact || "",
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

    const handleEdit = () => {
        setEditOrg({ ...org })
        setIsModalOpen(true)
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
        if (editOrg.billing_contact !== initialOrg.billing_contact) payload.billing_contact = editOrg.billing_contact
        if (editOrg.billing_contact_name !== initialOrg.billing_contact_name) payload.billing_contact_name = editOrg.billing_contact_name
        if (editOrg.billing_email_address !== initialOrg.billing_email_address) payload.billing_email_address = editOrg.billing_email_address

        if (Object.keys(payload).length === 0) {
            setIsModalOpen(false)
            return
        }

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
                billing_contact: response.data.billing_contact || editOrg.billing_contact,
                billing_contact_name: response.data.billing_contact_name || editOrg.billing_contact_name,
                billing_email_address: response.data.billing_email_address || editOrg.billing_email_address
            }
            setOrg(updatedData)
            setInitialOrg(updatedData)
            setIsModalOpen(false)
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 dark:bg-gray-900 dark:border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold dark:text-gray-100">Edit Verify Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
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
                                                            <span>{c.country}</span>
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
                                <Label htmlFor="edit_billing_contact" className="text-sm font-semibold dark:text-gray-100">Billing Contact</Label>
                                <Input
                                    id="edit_billing_contact"
                                    value={editOrg.billing_contact}
                                    onChange={(e) => setEditOrg({ ...editOrg, billing_contact: e.target.value })}
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
                        <div className="flex justify-end gap-3 pt-6">
                            <Button
                                onClick={() => setIsModalOpen(false)}
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
                </DialogContent>
            </Dialog>

            <div className="max-w-4xl mx-auto space-y-12">
                {/* Page Title */}
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verify Details</h1>
                    <Button
                        onClick={handleEdit}
                        variant="outline"
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium px-4 h-9 rounded-md transition-all text-[13px] border-none"
                    >
                        Edit
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-x-12 gap-y-8 pb-10">
                    {/* Right Column - Inputs */}
                    <div className="max-w-md space-y-8">
                        {/* Organization Name Field */}
                        <div className="space-y-3">
                            <Label htmlFor="org_name" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Company name
                            </Label>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">
                                Human-friendly label for your company, shown in user interfaces
                            </p>
                            <Input
                                id="org_name"
                                value={org.name}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Registered Address */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="reg_address" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Registered Address
                            </Label>
                            <Input
                                id="reg_address"
                                value={org.reg_address}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Town */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="town" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Town
                            </Label>
                            <Input
                                id="town"
                                value={org.town}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Post Code */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="post_code" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Post Code
                            </Label>
                            <Input
                                id="post_code"
                                value={org.post_code}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Country */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="country" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Country
                            </Label>
                            <Input
                                id="country"
                                value={org.country}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Company Registration Number */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="reg_number" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Company Registration Number
                            </Label>
                            <Input
                                id="reg_number"
                                value={org.reg_number}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* VAT Number */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="vat_number" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                VAT Number (if applicable)
                            </Label>
                            <Input
                                id="vat_number"
                                value={org.vat_number}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Billing Contact */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="billing_contact" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Billing Contact
                            </Label>
                            <Input
                                id="billing_contact"
                                value={org.billing_contact}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Billing Contact Name */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="billing_contact_name" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Billing Contact Name
                            </Label>
                            <Input
                                id="billing_contact_name"
                                value={org.billing_contact_name}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Billing Email Address */}
                        <div className="space-y-3 pt-2">
                            <Label htmlFor="billing_email_address" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Billing Email Address
                            </Label>
                            <Input
                                id="billing_email_address"
                                value={org.billing_email_address}
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-[14px] disabled:opacity-50"
                            />
                        </div>

                        {/* Organization ID Field */}
                        <div className="space-y-3 pt-4">
                            <Label htmlFor="org_id" className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                                Organization ID
                            </Label>
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-tight">
                                Identifier for this organization sometimes used in API requests
                            </p>
                            <Input
                                id="org_id"
                                value={org.uid}
                                readOnly
                                disabled
                                className="h-10 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-500 cursor-default text-[14px] focus-visible:ring-0 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
