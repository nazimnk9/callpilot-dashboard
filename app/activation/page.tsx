"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profile-service";
import { LoaderOverlay } from "@/components/auth/loader-overlay";
import { Search, ChevronsUpDown, Check, Lock, CheckCircle2, Building2, ClipboardCheck, Phone } from "lucide-react";
import { authService, cookieUtils } from '@/services/auth-service';
import countriesData from "@/lib/countries.json";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ActivationPage() {
    //const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTabletOrLarger, setIsTabletOrLarger] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
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
    });
    const [initialOrg, setInitialOrg] = useState({ ...org });

    const [alertConfig, setAlertConfig] = useState<{
        open: boolean;
        title: string;
        description: string[];
        variant: "default" | "destructive";
    }>({
        open: false,
        title: "",
        description: [],
        variant: "default"
    });

    const [countrySearch, setCountrySearch] = useState("");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [countries] = useState<{ country: string, country_code: string, phone_code: string }[]>(countriesData);

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = cookieUtils.get('access');
            const refreshToken = cookieUtils.get('refresh');

            if (!accessToken || !refreshToken) {
                router.push('/login');
                return;
            }

            try {
                const verifyRes = await authService.verifyToken(accessToken);
                if (verifyRes.ok) {
                    const statusRes = await profileService.getPlatformStatus();
                    if (statusRes.data.is_given_company_details) {
                        router.push('/dashboard');
                        return;
                    }
                    setIsAuthenticated(true);
                } else {
                    // Try refresh
                    const refreshRes = await authService.refreshToken(refreshToken);
                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        cookieUtils.set('access', data.access, 7);
                        cookieUtils.set('refresh', data.refresh, 7);

                        const statusRes = await profileService.getPlatformStatus();
                        if (statusRes.data.is_given_company_details) {
                            router.push('/dashboard');
                            return;
                        }
                        setIsAuthenticated(true);
                    } else {
                        router.push('/login');
                    }
                }
            } catch (err) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        fetchOrganization();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCountryOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchOrganization = async () => {
        try {
            setIsLoading(true);
            const response = await profileService.getOrganization();
            const data = response.data;
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
            };
            setOrg(orgData);
            setInitialOrg(orgData);
        } catch (err: any) {
            console.error("Error fetching organization:", err);
            setAlertConfig({
                open: true,
                title: "Error",
                description: ["Failed to load organization data."],
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const payload: any = {};
        if (org.name !== initialOrg.name) payload.name = org.name;
        if (org.reg_address !== initialOrg.reg_address) payload.reg_address = org.reg_address;
        if (org.town !== initialOrg.town) payload.town = org.town;
        if (org.post_code !== initialOrg.post_code) payload.post_code = org.post_code;
        if (org.country !== initialOrg.country) payload.country = org.country;
        if (org.reg_number !== initialOrg.reg_number) payload.reg_number = org.reg_number;
        if (org.vat_number !== initialOrg.vat_number) payload.vat_number = org.vat_number;
        if (org.state !== initialOrg.state) payload.state = org.state;
        if (org.billing_contact_name !== initialOrg.billing_contact_name) payload.billing_contact_name = org.billing_contact_name;
        if (org.billing_email_address !== initialOrg.billing_email_address) payload.billing_email_address = org.billing_email_address;

        if (Object.keys(payload).length === 0) {
            router.push("/dashboard");
            return;
        }

        try {
            setIsSaving(true);
            const response = await profileService.updateOrganization(payload);
            const updatedData = {
                name: response.data.name || org.name,
                uid: response.data.uid || org.uid,
                reg_address: response.data.reg_address || org.reg_address,
                town: response.data.town || org.town,
                post_code: response.data.post_code || org.post_code,
                country: response.data.country || org.country,
                reg_number: response.data.reg_number || org.reg_number,
                vat_number: response.data.vat_number || org.vat_number,
                state: response.data.state || org.state,
                billing_contact_name: response.data.billing_contact_name || org.billing_contact_name,
                billing_email_address: response.data.billing_email_address || org.billing_email_address
            };
            setOrg(updatedData);
            setInitialOrg(updatedData);
            setAlertConfig({
                open: true,
                title: "Success",
                description: ["Organization updated successfully."],
                variant: "default"
            });
            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
        } catch (err: any) {
            console.error("Error updating organization:", err);
            if (err.response?.data) {
                const errors = err.response.data;
                const errorMessages: string[] = [];
                Object.keys(errors).forEach((key) => {
                    if (Array.isArray(errors[key])) {
                        errorMessages.push(`${key}: ${errors[key][0]}`);
                    } else if (typeof errors[key] === 'string') {
                        errorMessages.push(`${key}: ${errors[key]}`);
                    }
                });
                setAlertConfig({
                    open: true,
                    title: "Update Failed",
                    description: errorMessages.length > 0 ? errorMessages : ["An unexpected error occurred."],
                    variant: "destructive"
                });
            } else {
                setAlertConfig({
                    open: true,
                    title: "Error",
                    description: ["Failed to update organization. Please try again."],
                    variant: "destructive"
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.phone_code.includes(countrySearch)
    );

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
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

            {/* Header */}
            <header className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-8 bg-white dark:bg-gray-950 sticky top-0 z-10">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <span className="text-lg font-semibold">Dashboard</span>
                    <Lock size={18} className="text-gray-400" />
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
                {/* Stepper */}
                <div className="flex items-center justify-between relative max-w-xl mx-auto mb-16 px-4">
                    {/* Step 1: Account Created */}
                    <div className="flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Account Creation</span>
                    </div>

                    <div className="flex-1 h-[2px] bg-green-500 mt-[-1.5rem]" />

                    {/* Step 2: Platform Activation */}
                    <div className="flex flex-col items-center z-10 transform translate-x-[-1px]">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mb-2 ring-4 ring-blue-100 dark:ring-blue-900/30">
                            <div className="w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">Upload Business Details</span>
                    </div>

                    {/* <div className="flex-1 h-[2px] bg-blue-600/30 mt-[-1.5rem]" /> */}

                    {/* Step 3: Company Details */}
                    {/* <div className="flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 mb-2">
                            <Building2 size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Company Details</span>
                    </div> */}

                    {/* <div className="flex-1 h-[2px] bg-gray-200 dark:bg-gray-800 mt-[-1.5rem]" /> */}

                    {/* Step 4: Choose Plan */}
                    {/* <div className="flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 mb-2">
                            <ClipboardCheck size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Choose Plan</span>
                    </div> */}

                    {/* <div className="flex-1 h-[2px] bg-gray-200 dark:bg-gray-800 mt-[-1.5rem]" /> */}

                    {/* Step 5: Buy AI Number */}
                    {/* <div className="flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-400 mb-2">
                            <Phone size={20} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Buy AI Number</span>
                    </div> */}
                </div>

                {/* Form Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verify Business Details</h2>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Company name</Label>
                                <Input
                                    id="name"
                                    value={org.name}
                                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reg_address" className="text-sm font-semibold">Registered Address</Label>
                                <Input
                                    id="reg_address"
                                    value={org.reg_address}
                                    onChange={(e) => setOrg({ ...org, reg_address: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="town" className="text-sm font-semibold">Town</Label>
                                <Input
                                    id="town"
                                    value={org.town}
                                    onChange={(e) => setOrg({ ...org, town: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-sm font-semibold">State/Region</Label>
                                <Input
                                    id="state"
                                    value={org.state}
                                    onChange={(e) => setOrg({ ...org, state: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="post_code" className="text-sm font-semibold">Post Code</Label>
                                <Input
                                    id="post_code"
                                    value={org.post_code}
                                    onChange={(e) => setOrg({ ...org, post_code: e.target.value })}
                                />
                            </div>


                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Country</Label>
                                <div className="relative" ref={dropdownRef}>
                                    <div
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className="w-full bg-white dark:bg-gray-800 border border-input rounded-md h-10 px-3 flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                    >
                                        <span className={org.country ? "text-gray-900 dark:text-gray-100 text-[14px]" : "text-gray-400 dark:text-gray-500 text-[14px]"}>
                                            {org.country || "Select country"}
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
                                                                setOrg({ ...org, country: c.country });
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
                                                            {org.country === c.country && (
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
                                <Label htmlFor="reg_number" className="text-sm font-semibold">Registration Number</Label>
                                <Input
                                    id="reg_number"
                                    value={org.reg_number}
                                    onChange={(e) => setOrg({ ...org, reg_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vat_number" className="text-sm font-semibold">VAT Number</Label>
                                <Input
                                    id="vat_number"
                                    value={org.vat_number}
                                    onChange={(e) => setOrg({ ...org, vat_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billing_contact_name" className="text-sm font-semibold">Billing Contact Name</Label>
                                <Input
                                    id="billing_contact_name"
                                    value={org.billing_contact_name}
                                    onChange={(e) => setOrg({ ...org, billing_contact_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billing_email_address" className="text-sm font-semibold">Billing Email Address</Label>
                                <Input
                                    id="billing_email_address"
                                    value={org.billing_email_address}
                                    onChange={(e) => setOrg({ ...org, billing_email_address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
                            {/* <Button
                                onClick={() => router.push("/dashboard")}
                                variant="outline"
                                className="px-6"
                            >
                                Skip for now
                            </Button> */}
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/90 text-white px-8"
                            >
                                {isSaving ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
