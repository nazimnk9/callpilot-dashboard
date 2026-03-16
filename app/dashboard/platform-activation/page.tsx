'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    ChevronDown,
    ChevronUp,
    Check,
    Loader2,
    Lock,
    Search,
    ChevronsUpDown,
    AlertCircle
} from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils, authService } from "@/services/auth-service";
import { profileService } from "@/services/profile-service";
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { paymentService } from "@/services/payment-service";
import countriesData from "@/lib/countries.json";
import { toast } from "sonner";

export default function PlatformActivationPage() {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isTabletOrLarger, setIsTabletOrLarger] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedPm, setSelectedPm] = useState<any>(null);
    const [isPmSelectorOpen, setIsPmSelectorOpen] = useState(false);
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

    // Stripe states
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [elements, setElements] = useState<StripeElements | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const cardNumberRef = useRef<any>(null);
    const cardExpiryRef = useRef<any>(null);
    const cardCvcRef = useRef<any>(null);
    const cardNumberContainerRef = useRef<HTMLDivElement>(null);
    const cardExpiryContainerRef = useRef<HTMLDivElement>(null);
    const cardCvcContainerRef = useRef<HTMLDivElement>(null);

    // Form state for new card
    const [cardholderName, setCardholderName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [stateRegion, setStateRegion] = useState("");
    const [isDefault, setIsDefault] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState<{ country: string, country_code: string } | null>(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
                    // is_given_company_details is false -> show activation page
                    if (!statusRes.data.is_given_company_details) {
                        router.push('/activation');
                        return;
                    }
                    // is_given_company_details is true -> do not access this page, redirect to dashboard
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
                        // is_given_company_details is false -> show activation page
                        if (!statusRes.data.is_given_company_details) {
                            router.push('/activation');
                            return;
                        }
                        // is_given_company_details is true -> do not access this page, redirect to dashboard
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
        // Check if viewport is tablet or larger (768px+)
        const checkViewport = () => {
            const isTabletUp = window.innerWidth >= 768;
            setIsTabletOrLarger(isTabletUp);
            // Always open sidebar on tablet and larger
            if (isTabletUp) {
                setIsSidebarOpen(true);
            }
        };

        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setPaymentMethods(data);
                const defaultCard = data.find((pm: any) => pm.is_default);
                if (defaultCard) {
                    setSelectedPm(defaultCard);
                } else if (data.length > 0) {
                    setSelectedPm(data[0]);
                }
            }
        } catch (err) {
            console.error("Error fetching payment methods:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchPaymentMethods();
            const initStripe = async () => {
                const stripeInstance = await loadStripe('pk_test_51T28pm7kECw44sgCk3RxtMKst01YwUY02L1R93SaiJVPHloYcnWAar0NytN5TcduerTeWbS1yRa0hJehyB7N2JSC00WWO8y9aa');
                setStripe(stripeInstance);
            };
            initStripe();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAddPaymentOpen && stripe && !cardNumberRef.current) {
            const timer = setTimeout(() => {
                if (!cardNumberContainerRef.current || !cardExpiryContainerRef.current || !cardCvcContainerRef.current) return;
                const els = stripe.elements();
                setElements(els);
                const style = {
                    base: {
                        fontSize: '15px',
                        color: '#111827',
                        fontFamily: 'Inter, sans-serif',
                        '::placeholder': { color: '#9ca3af' },
                    },
                };
                const number = els.create('cardNumber', { style });
                const expiry = els.create('cardExpiry', { style });
                const cvc = els.create('cardCvc', { style });
                number.mount(cardNumberContainerRef.current);
                expiry.mount(cardExpiryContainerRef.current);
                cvc.mount(cardCvcContainerRef.current);
                cardNumberRef.current = number;
                cardExpiryRef.current = expiry;
                cardCvcRef.current = cvc;
            }, 100);
            return () => clearTimeout(timer);
        }
        return () => {
            if (cardNumberRef.current) cardNumberRef.current.unmount();
            if (cardExpiryRef.current) cardExpiryRef.current.unmount();
            if (cardCvcRef.current) cardCvcRef.current.unmount();
            cardNumberRef.current = null;
            cardExpiryRef.current = null;
            cardCvcRef.current = null;
        };
    }, [isAddPaymentOpen, stripe]);

    const handleAddPaymentMethod = async () => {
        if (!stripe || !elements || !cardNumberRef.current) return;
        setIsSubmitting(true);
        try {
            const { paymentMethod, error } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardNumberRef.current,
                billing_details: {
                    name: cardholderName,
                    address: {
                        line1: addressLine1,
                        line2: addressLine2,
                        city: city,
                        postal_code: postalCode,
                        state: stateRegion,
                        country: selectedCountry?.country_code
                    }
                }
            });

            if (error) {
                toast.error(error.message);
                setIsSubmitting(false);
                return;
            }

            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_method_id: paymentMethod.id,
                    set_as_default: isDefault
                })
            });

            if (response.ok) {
                toast.success("Payment method added successfully");
                setIsAddPaymentOpen(false);
                fetchPaymentMethods();
                // Clear form
                setCardholderName("");
                setAddressLine1("");
                setAddressLine2("");
                setCity("");
                setPostalCode("");
                setStateRegion("");
                setSelectedCountry(null);
            } else {
                const errData = await response.json();
                toast.error(errData.detail || "Failed to add payment method");
            }
        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleActivate = async () => {
        if (!selectedPm) {
            toast.error("Please select a payment method");
            return;
        }

        setIsLoading(true);
        try {
            const response = await paymentService.activatePlatform(selectedPm.id);
            if (response.status === 200 || response.status === 201) {
                toast.success("Platform activated successfully!");
                router.push('/dashboard');
            } else {
                toast.error(response.data?.detail || "Failed to activate platform");
            }
        } catch (err: any) {
            console.error("Activation error:", err);
            toast.error(err.response?.data?.detail || "An error occurred during platform activation");
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                isOpen={isTabletOrLarger || isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <Topbar
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />

                <main className="flex-1 overflow-y-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activation Platform</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-[15px]">
                                    To fully activate your platform and start making calls, a one-off setup fee is required. This fee will be returned as free minutes after 12 months.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Setup Fee</span>
                                <span className="text-3xl font-black text-gray-900 dark:text-gray-100">$400</span>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                        Payment method
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsPmSelectorOpen(!isPmSelectorOpen)}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 cursor-pointer group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-6 bg-black dark:bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                                                    {selectedPm?.card.brand === 'visa' ? (
                                                        <span className="text-white font-bold italic text-[8px]">VISA</span>
                                                    ) : (
                                                        <div className="flex -space-x-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-red-600 opacity-80" />
                                                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                    {selectedPm ? `•••• ${selectedPm.card.last4}` : 'Select card'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col -space-y-1 text-gray-400 dark:text-gray-500">
                                                <ChevronUp size={16} />
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>

                                        {isPmSelectorOpen && (
                                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {paymentMethods.map((pm) => (
                                                        <div
                                                            key={pm.id}
                                                            onClick={() => {
                                                                setSelectedPm(pm);
                                                                setIsPmSelectorOpen(false);
                                                            }}
                                                            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-5 bg-black dark:bg-gray-800 rounded flex items-center justify-center relative overflow-hidden shrink-0">
                                                                    {pm.card.brand === 'visa' ? (
                                                                        <span className="text-white font-bold italic text-[6px]">VISA</span>
                                                                    ) : (
                                                                        <div className="flex -space-x-1">
                                                                            <div className="w-3 h-3 rounded-full bg-red-600 opacity-80" />
                                                                            <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[14px] font-medium text-gray-900 dark:text-gray-100">•••• {pm.card.last4}</span>
                                                            </div>
                                                            {selectedPm?.id === pm.id && (
                                                                <Check size={14} className="text-gray-900 dark:text-gray-100" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end pt-1">
                                        <button
                                            onClick={() => setIsAddPaymentOpen(true)}
                                            className="text-[14px] font-bold text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors"
                                        >
                                            + Add payment method
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleActivate}
                                disabled={isLoading}
                                className="w-full bg-black hover:bg-black/90 text-white rounded-xl py-6 text-lg font-bold"
                            >
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                                Activate Platform
                            </Button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Add Payment Method Dialog */}
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[480px] p-5 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-3xl gap-6 overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="p-0 space-y-2 text-left">
                        <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                            Add payment method
                        </DialogTitle>
                        <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                            Add your credit card details below. This card will be saved to your account.
                        </p>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Card information</label>
                            <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 px-4 py-3 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-700 transition-shadow">
                                <div ref={cardNumberContainerRef} className="mb-3" />
                                <div className="flex gap-4">
                                    <div ref={cardExpiryContainerRef} className="flex-1" />
                                    <div ref={cardCvcContainerRef} className="w-20" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Name on card</label>
                            <input
                                type="text"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">Billing address</label>
                            <div className="space-y-3">
                                <div className="relative">
                                    <div
                                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium flex items-center justify-between cursor-pointer"
                                    >
                                        <span className={selectedCountry ? "text-gray-900" : "text-gray-400"}>
                                            {selectedCountry ? selectedCountry.country : "Country"}
                                        </span>
                                        <ChevronsUpDown size={16} />
                                    </div>
                                    {isCountryOpen && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-[60] max-h-[200px] overflow-y-auto">
                                            {countriesData.map((c) => (
                                                <div
                                                    key={c.country_code}
                                                    onClick={() => {
                                                        setSelectedCountry(c);
                                                        setIsCountryOpen(false);
                                                    }}
                                                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                                                >
                                                    {c.country}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                    placeholder="Address line 1"
                                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px]"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="City"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px]"
                                    />
                                    <input
                                        type="text"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        placeholder="Postal code"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                        <Button onClick={() => setIsAddPaymentOpen(false)} variant="outline" className="rounded-xl h-auto py-3">Cancel</Button>
                        <Button onClick={handleAddPaymentMethod} disabled={isSubmitting} className="rounded-xl h-auto py-3 bg-black text-white hover:bg-black/90">
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Add payment method
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
