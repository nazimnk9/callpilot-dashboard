"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { profileService } from "@/services/profile-service";
import { LoaderOverlay } from "@/components/auth/loader-overlay";
import { Search, ChevronsUpDown, Check, Lock, CheckCircle2, Building2, ClipboardCheck, Phone, LogOut } from "lucide-react";
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
    const [currentStep, setCurrentStep] = useState(1);
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
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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
        const step1 = localStorage.getItem("activation_step1");
        const step2 = localStorage.getItem("activation_step2");
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

    const handleNextStep1 = () => {
        if (!org.business_name || !org.reg_number) {
            setAlertConfig({
                open: true,
                title: "Missing Information",
                description: ["Please fill in all required fields."],
                variant: "destructive"
            });
            return;
        }
        localStorage.setItem("activation_step1", JSON.stringify({
            business_name: org.business_name,
            reg_number: org.reg_number
        }));
        setCurrentStep(2);
    };

    const handleNextStep2 = () => {
        if (!org.country || !org.street_address || !org.city || !org.post_code) {
            setAlertConfig({
                open: true,
                title: "Missing Information",
                description: ["Please fill in all required fields."],
                variant: "destructive"
            });
            return;
        }
        localStorage.setItem("activation_step2", JSON.stringify({
            country: org.country,
            street_address: org.street_address,
            apt_or_suite: org.apt_or_suite,
            city: org.city,
            post_code: org.post_code,
            province: org.province
        }));
        setCurrentStep(3);
    };

    const handleSave = async () => {
        const formData = new FormData();

        // Combine all data
        const step1 = JSON.parse(localStorage.getItem("activation_step1") || "{}");
        const step2 = JSON.parse(localStorage.getItem("activation_step2") || "{}");

        const finalData = {
            ...step1,
            ...step2,
            business_name: org.business_name,
            reg_number: org.reg_number,
            country: org.country,
            street_address: org.street_address,
            apt_or_suite: org.apt_or_suite,
            city: org.city,
            post_code: org.post_code,
            province: org.province,
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

            setAlertConfig({
                open: true,
                title: "Success",
                description: ["Business details submitted successfully."],
                variant: "default"
            });

            setTimeout(() => {
                router.push("/dashboard");
            }, 1500);
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
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verify Business Details</h2>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${currentStep === step
                                        ? "bg-primary text-white"
                                        : currentStep > step
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                        }`}
                                >
                                    {currentStep > step ? <Check size={16} /> : step}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Business Information</h3>
                                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">Please provide your basic business details.</p> */}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="business_name" className="text-sm font-semibold">Registered Business Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="business_name"
                                            placeholder="Enter business name"
                                            value={org.business_name}
                                            onChange={(e) => setOrg({ ...org, business_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="reg_number" className="text-sm font-semibold">Business Registration Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="reg_number"
                                            placeholder="Enter registration number"
                                            value={org.reg_number}
                                            onChange={(e) => setOrg({ ...org, reg_number: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-6">
                                    <Button
                                        onClick={handleNextStep1}
                                        className="bg-primary hover:bg-primary/90 text-white px-8"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Registered Business Address</h3>
                                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">Where is your business located?</p> */}
                                </div>

                                {/* Preview Section from Step 1 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Registered Business Name</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.business_name || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Business Registration Number</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.reg_number || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    <div className="max-h-[200px] overflow-y-auto font-sans">
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
                                <div className="flex justify-between pt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-8"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={handleNextStep2}
                                        className="bg-primary hover:bg-primary/90 text-white px-8"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Supporting Documents</h3>
                                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">Upload required documents for verification.</p> */}
                                </div>

                                {/* Preview Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Business Name</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.business_name || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Registration Number</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.reg_number || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Business Country</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.country || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Street Address</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.street_address || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">APT/Suite</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.apt_or_suite || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">City</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.city || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Post Office</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.post_code || "N/A"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Province</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{org.province || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="cert" className="text-sm font-semibold">Business Registration Certificate</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                id="cert"
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setOrg({ ...org, business_registration_certificate: e.target.files?.[0] || null })}
                                                className="cursor-pointer"
                                            />
                                            {org.business_registration_certificate && (
                                                <p className="text-xs text-green-500 flex items-center gap-1">
                                                    <Check size={12} /> {(org.business_registration_certificate as File).name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="proof" className="text-sm font-semibold">Proof of Address</Label>
                                        <div className="flex flex-col gap-2">
                                            <Input
                                                id="proof"
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setOrg({ ...org, proof_of_address: e.target.files?.[0] || null })}
                                                className="cursor-pointer"
                                            />
                                            <p className="text-[10px] text-gray-500 italic">Utility Bill or Tax Notice Or Rent</p>
                                            {org.proof_of_address && (
                                                <p className="text-xs text-green-500 flex items-center gap-1">
                                                    <Check size={12} /> {(org.proof_of_address as File).name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentStep(2)}
                                        className="px-8"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-primary hover:bg-primary/90 text-white px-8"
                                    >
                                        {isSaving ? "Submitting..." : "Submit"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <p>
                        Need help?{" "}
                        <a
                            href="mailto:contact@swiftwave.ai"
                            className="text-primary hover:underline font-medium"
                        >
                            Send a mail to us.
                        </a>
                    </p>
                </div>
            </main>
        </div>
    );
}
