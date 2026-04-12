"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { profileService } from "@/services/profile-service";
import { LoaderOverlay } from "@/components/auth/loader-overlay";
import { Search, ChevronsUpDown, Check, Lock, CheckCircle2, Building2, ClipboardCheck, Phone, LogOut, X } from "lucide-react";
import { cookieUtils, authService } from '@/services/auth-service';
import countriesData from "@/lib/countries.json";
import { getCountryCode } from "@/app/actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ActivationPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTabletOrLarger, setIsTabletOrLarger] = useState(true);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
    const [isSaving, setIsSaving] = useState(false);
    const [org, setOrg] = useState({
        name: "",
        uid: "",
        business_name: "",
        reg_number: "",
        country: "United Kingdom",
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
        country_iso_code: "",
        business_registration_authority: "",
        business_website: "",
        authorize_representative_first_name: "",
        authorize_representative_last_name: "",
        authorize_representative_email: "",
        authorize_representative_phone: ""
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
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    const [countrySearch, setCountrySearch] = useState("");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [countries] = useState<{ country: string, country_code: string, phone_code: string }[]>(countriesData);

    const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
    const [isComplianceAgreed, setIsComplianceAgreed] = useState(false);



    useEffect(() => {
        // Load any previously saved data from localStorage to help the user
        const step1 = localStorage.getItem("activation_step1");
        const step2 = localStorage.getItem("activation_step2");
        const step3 = localStorage.getItem("activation_step3");
        if (step1) {
            const data = JSON.parse(step1);
            setOrg(prev => ({ ...prev, ...data }));
        }
        if (step2) {
            const data = JSON.parse(step2);
            setOrg(prev => ({ ...prev, ...data }));
        }
        fetchOrganization();
    }, []);

    const fetchOrganization = async () => {
        try {
            setIsLoading(true);
            const response = await profileService.getOrganization();
            const data = response.data;
            let phoneVal = data.authorize_representative_phone || "";
            if (phoneVal.startsWith("+")) {
                const sortedCountries = [...countriesData].sort((a, b) => {
                    const codeA = a.phone_code.startsWith("+") ? a.phone_code.length : a.phone_code.length + 1;
                    const codeB = b.phone_code.startsWith("+") ? b.phone_code.length : b.phone_code.length + 1;
                    return codeB - codeA;
                });
                for (const c of sortedCountries) {
                    const code = c.phone_code.startsWith("+") ? c.phone_code : `+${c.phone_code}`;
                    if (phoneVal.startsWith(code)) {
                        phoneVal = phoneVal.slice(code.length);
                        break;
                    }
                }
            }

            const orgData = {
                name: data.name || "",
                uid: data.uid || "",
                business_name: data.business_name || data.name || "",
                reg_number: data.reg_number || "",
                country: data.country || "United Kingdom",
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
                country_iso_code: data.country_iso_code || "",
                business_registration_authority: data.business_registration_authority || "",
                business_website: data.business_website || "",
                authorize_representative_first_name: data.authorize_representative_first_name || "",
                authorize_representative_last_name: data.authorize_representative_last_name || "",
                authorize_representative_email: data.authorize_representative_email || "",
                authorize_representative_phone: phoneVal
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


    // Unified validation function
    const validateForm = () => {
        const errors: string[] = [];
        if (!org.business_name) errors.push("Registered Business Name is required");
        if (!org.street_address) errors.push("Street Address is required");
        if (!org.city) errors.push("Town / City is required");
        if (org.country === "United Kingdom" && !org.post_code) errors.push("Postcode is required for UK");
        return errors;
    };

    const handleSave = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            setAlertConfig({
                open: true,
                title: "Validation Error",
                description: errors,
                variant: "destructive"
            });
            return;
        }

        const formData = new FormData();

        const finalData: any = {
            ...org,
            name: org.business_name // Mandatory match
        };

        Object.keys(finalData).forEach(key => {
            if (finalData[key] !== null && finalData[key] !== undefined) {
                formData.append(key, finalData[key]);
            }
        });

        if (org.business_registration_certificate instanceof File) {
            formData.append("business_registration_certificate", org.business_registration_certificate);
        }
        if (org.proof_of_address instanceof File) {
            formData.append("proof_of_address", org.proof_of_address);
        }

        try {
            setIsSaving(true);
            await profileService.updateOrganization(formData);

            // Clear local storage
            localStorage.removeItem("activation_step1");
            localStorage.removeItem("activation_step2");
            localStorage.removeItem("activation_step3");
            localStorage.removeItem("activation_step4");

            setAlertConfig({
                open: true,
                title: "Success",
                description: ["Business details submitted successfully."],
                variant: "default"
            });

            router.push("/dashboard");
            // setTimeout(() => {
            // }, 1500);
        } catch (err: any) {
            console.error("Error updating organization:", err);
            const errors = err.response?.data || {};
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
                title: "Submission Failed",
                description: errorMessages.length > 0 ? errorMessages : ["Failed to update organization details."],
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        cookieUtils.set('access', '', -1);
        cookieUtils.set('refresh', '', -1);
        setIsLogoutDialogOpen(false);
        router.push('/login');
    };

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.phone_code.includes(countrySearch)
    );


    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
            <LoaderOverlay isLoading={isLoading || isSaving} />


            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-gray-100">Are you sure you want to logout?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                            You will be redirected to the login page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsLogoutDialogOpen(false)}
                            className="dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            Logout
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
            <header className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center px-8 bg-white dark:bg-gray-950 sticky top-0 z-10 justify-between">
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <span className="text-lg font-semibold">Dashboard</span>
                    <Lock size={18} className="text-gray-400" />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 gap-2 font-medium transition-colors"
                    onClick={() => setIsLogoutDialogOpen(true)}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </Button>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-12">
                {/* Stepper */}
                <div className="flex items-center justify-between relative max-w-xl mx-auto mb-16 px-4">
                    <div className="flex flex-col items-center z-10">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                            <CheckCircle2 size={24} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Account Creation</span>
                    </div>

                    <div className="flex-1 h-[2px] bg-green-500 mt-[-1.5rem]" />

                    <div className="flex flex-col items-center z-10 transform translate-x-[-1px]">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white mb-2 ring-4 ring-blue-100 dark:ring-blue-900/30">
                            <div className="w-4 h-4 rounded-full border-2 border-white" />
                        </div>
                        <span className="text-xs font-semibold text-blue-600 whitespace-nowrap">Verify Business Details</span>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verify Business Details</h2>
                    </div>

                    <div className="p-8">
                        <div className="space-y-12">

                            {/* Address & Identity Section */}
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {/* <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registered Business Details</h3>
                                </div> */}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="business_name" className="text-sm font-semibold">Registered Business Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="business_name"
                                            placeholder="Enter your registered business name"
                                            value={org.business_name}
                                            onChange={(e) => setOrg({ ...org, business_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="street_address" className="text-sm font-semibold">Street Address <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="street_address"
                                            placeholder="Enter street address"
                                            value={org.street_address}
                                            onChange={(e) => setOrg({ ...org, street_address: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-semibold">Town / City <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="city"
                                            placeholder="Enter city"
                                            value={org.city}
                                            onChange={(e) => setOrg({ ...org, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="province" className="text-sm font-semibold">State</Label>
                                        <Input
                                            id="province"
                                            placeholder="Enter province"
                                            value={org.province}
                                            onChange={(e) => setOrg({ ...org, province: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="post_code" className="text-sm font-semibold">Postcode / ZIP {org.country === "United Kingdom" && <span className="text-red-500">*</span>}</Label>
                                        <Input
                                            id="post_code"
                                            placeholder="Enter post code"
                                            value={org.post_code}
                                            onChange={(e) => setOrg({ ...org, post_code: e.target.value })}
                                            required={org.country === "United Kingdom"}
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
                                                    {org.country ? `${org.country_iso_code ? `(${org.country_iso_code}) ` : ""}${org.country}` : "Select country"}
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
                                                    <div className="max-h-[150px] overflow-y-auto font-sans">
                                                        {filteredCountries.length > 0 ? (
                                                            filteredCountries.map((c) => (
                                                                <div
                                                                    key={c.country_code}
                                                                    onClick={() => {
                                                                        setOrg({ ...org, country: c.country, country_iso_code: c.country_code });
                                                                        setIsCountryOpen(false);
                                                                        setCountrySearch("");
                                                                    }}
                                                                    className="px-4 py-2.5 text-[14px] font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors flex items-center justify-between"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2 w-full">
                                                                        <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">{c.country_code}</span>
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
                                        <Label htmlFor="apt_or_suite" className="text-sm font-semibold">APT/Suite</Label>
                                        <Input
                                            id="apt_or_suite"
                                            placeholder="Enter apartment or suite"
                                            value={org.apt_or_suite}
                                            onChange={(e) => setOrg({ ...org, apt_or_suite: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <Checkbox
                                        id="compliance"
                                        checked={isComplianceAgreed}
                                        onCheckedChange={(checked) => setIsComplianceAgreed(checked === true)}
                                    />
                                    <label
                                        htmlFor="compliance"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        I have read and agree to the{" "}
                                        <span
                                            className="text-primary hover:underline font-bold"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsComplianceModalOpen(true);
                                            }}
                                        >
                                            Privacy Policy and Terms
                                        </span>.
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving || !isComplianceAgreed}
                                        className="bg-primary hover:bg-primary/90 text-white px-12 h-12 text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isSaving ? "Submitting..." : "Submit Verification"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <p>
                        Need help?{" "}
                        <a
                            href="mailto:contact@swiftwave.ai"
                            className="text-primary hover:underline font-medium"
                        >
                            Contact Support.
                        </a>
                    </p>
                </div>
            </main >

            <Dialog open={isComplianceModalOpen} onOpenChange={setIsComplianceModalOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-800 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                    <DialogHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ClipboardCheck className="text-primary" />
                            CallPilot Compliance
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-8 py-6">
                        <div className="space-y-6">
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Terms & Conditions</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I agree to the Terms & Conditions</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I agree to the Privacy Policy.</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Acknowledgement</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I understand CallPilot uses AI to make and manage calls and communications</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Legal Compliance</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I confirm I will use CallPilot in full compliance with all applicable laws and regulations, including GDPR and local data protection laws</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Disclosure Responsibility</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I will ensure all individuals are informed when interacting with AI systems</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Acceptable Use</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">I confirm I will not use CallPilot to generate, distribute, or facilitate offensive, abusive, misleading, or unlawful content.</p>
                            </section>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-primary uppercase tracking-tight">Compliance Settings</h2>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">AI Disclosure</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">AI disclosure at start of call</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Opt out option</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Allow recipient opt-out option</p>
                            </section>
                            <div className="text-sm font-semibold italic text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                “Disabling this may result in non-compliant use of the platform. You are responsible for ensuring legal compliance.”
                            </div>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-primary uppercase tracking-tight">Applicant Consent</h2>
                            <section className="space-y-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Data consent</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Candidate consent to their personal data being processed for recruitment purposes</p>
                            </section>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}