"use client"

import { useState, useEffect, useRef } from "react"
import { CreditCard, History, Settings, BarChart3, Info, ExternalLink, ChevronDown, ChevronUp, Loader2, Search, ChevronsUpDown, Check, Rocket, Zap, Building2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";
import { phoneService } from "@/services/phone-service";
import countriesData from "@/lib/countries.json";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function BillingContent() {
    const [activeTab, setActiveTab] = useState("Overview")
    const [isTopUpOpen, setIsTopUpOpen] = useState(false)
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [elements, setElements] = useState<StripeElements | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const cardNumberRef = useRef<any>(null);
    const cardExpiryRef = useRef<any>(null);
    const cardCvcRef = useRef<any>(null);
    const cardNumberContainerRef = useRef<HTMLDivElement>(null);
    const cardExpiryContainerRef = useRef<HTMLDivElement>(null);
    const cardCvcContainerRef = useRef<HTMLDivElement>(null);

    const [countries, setCountries] = useState<{ country: string, country_code: string }[]>(countriesData);
    const [selectedCountry, setSelectedCountry] = useState<{ country: string, country_code: string } | null>(null);
    const [countrySearch, setCountrySearch] = useState("");
    const [isCountryOpen, setIsCountryOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form state
    const [cardholderName, setCardholderName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [stateRegion, setStateRegion] = useState("");
    const [isDefault, setIsDefault] = useState(true);

    const [orgData, setOrgData] = useState<any>(null);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [topUpAmount, setTopUpAmount] = useState("");
    const [selectedPmForTopUp, setSelectedPmForTopUp] = useState<any>(null);
    const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);
    const [isPmSelectorOpen, setIsPmSelectorOpen] = useState(false);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [pmToDelete, setPmToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSetDefaultOpen, setIsSetDefaultOpen] = useState(false);
    const [pmToSetDefault, setPmToSetDefault] = useState<any>(null);
    const [isSettingDefault, setIsSettingDefault] = useState(false);
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [hoveredTier, setHoveredTier] = useState<string | null>(null);
    const [isSubscriptionSubmitting, setIsSubscriptionSubmitting] = useState(false);
    const [selectedPmForSubscription, setSelectedPmForSubscription] = useState<any>(null);
    const [isPmSelectorForSubOpen, setIsPmSelectorForSubOpen] = useState(false);
    const [isCancelPlanModalOpen, setIsCancelPlanModalOpen] = useState(false);
    const [isCancellingPlan, setIsCancellingPlan] = useState(false);
    const [isUpdateSubscriptionModalOpen, setIsUpdateSubscriptionModalOpen] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [isFetchingSubscription, setIsFetchingSubscription] = useState(false);
    const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);

    const tabs = ["Overview", "Payment methods", "Billing history"]

    const fetchOrgData = async () => {
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/organizations/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOrgData(data);
            }
        } catch (err) {
            console.error("Error fetching organization data:", err);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data_res = await response.json();
                setPaymentMethods(data_res);
                // Set default card for top-up
                const defaultCard = data_res.find((pm: any) => pm.is_default);
                if (defaultCard) {
                    setSelectedPmForTopUp(defaultCard);
                    setSelectedPmForSubscription(defaultCard);
                }
            }
        } catch (err) {
            console.error("Error fetching payment methods:", err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/transactions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTransactions(data.results || []);
            }
        } catch (err) {
            console.error("Error fetching transactions:", err);
        }
    };

    const fetchCurrentSubscription = async () => {
        setIsFetchingSubscription(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentSubscription(data);
                // Pre-fill selected plan
                if (data.plan === 'starter') setSelectedPlan("Starter");
                else if (data.plan === 'pro') setSelectedPlan("Medium");
            }
        } catch (err) {
            console.error("Error fetching current subscription:", err);
        } finally {
            setIsFetchingSubscription(false);
        }
    };

    useEffect(() => {
        const initStripe = async () => {
            const stripeInstance = await loadStripe('pk_test_51T28pm7kECw44sgCk3RxtMKst01YwUY02L1R93SaiJVPHloYcnWAar0NytN5TcduerTeWbS1yRa0hJehyB7N2JSC00WWO8y9aa');
            setStripe(stripeInstance);
        };
        initStripe();
        fetchOrgData();
        fetchPaymentMethods();
        fetchTransactions();
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

    useEffect(() => {
        if (isAddPaymentOpen && stripe && !cardNumberRef.current) {
            const timer = setTimeout(() => {
                if (!cardNumberContainerRef.current) return;

                const els = stripe.elements();
                setElements(els);

                const style = {
                    base: {
                        fontSize: '15px',
                        color: '#111827',
                        fontFamily: 'Inter, sans-serif',
                        '::placeholder': {
                            color: '#9ca3af',
                        },
                    },
                };

                const number = els.create('cardNumber', { style });
                const expiry = els.create('cardExpiry', { style });
                const cvc = els.create('cardCvc', { style });

                if (cardNumberContainerRef.current) number.mount(cardNumberContainerRef.current);
                if (cardExpiryContainerRef.current) expiry.mount(cardExpiryContainerRef.current);
                if (cardCvcContainerRef.current) cvc.mount(cardCvcContainerRef.current);

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

    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPmForTopUp) {
            const defaultCard = paymentMethods.find((pm: any) => pm.is_default);
            if (defaultCard) setSelectedPmForTopUp(defaultCard);
        }
    }, [paymentMethods, selectedPmForTopUp]);

    const handleDeletePaymentMethod = async () => {
        if (!pmToDelete) return;

        setIsDeleting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods/${pmToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Payment method deleted successfully");
                setIsDeleteOpen(false);
                setPmToDelete(null);

                // Refresh payment methods list
                const fetchPaymentMethods = async () => {
                    const token = cookieUtils.get("access");
                    const res = await fetch(`${BASE_URL}/payment/payment-methods`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPaymentMethods(data);
                    }
                };
                fetchPaymentMethods();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to delete payment method");
            }
        } catch (err) {
            console.error("Delete error:", err);
            setErrorDetail("An error occurred during deletion");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSetDefaultPaymentMethod = async () => {
        if (!pmToSetDefault) return;

        setIsSettingDefault(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods/${pmToSetDefault.id}/default`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Default payment method updated successfully");
                setIsSetDefaultOpen(false);
                setPmToSetDefault(null);

                // Refresh payment methods list
                const fetchPaymentMethods = async () => {
                    const token = cookieUtils.get("access");
                    const res = await fetch(`${BASE_URL}/payment/payment-methods`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPaymentMethods(data);
                    }
                };
                fetchPaymentMethods();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to set as default");
            }
        } catch (err) {
            console.error("Set default error:", err);
            setErrorDetail("An error occurred while updating default status");
        } finally {
            setIsSettingDefault(false);
        }
    };

    const handleTopUp = async () => {
        if (!selectedPmForTopUp || !topUpAmount) {
            toast.error("Please select a payment method and enter an amount");
            return;
        }

        setIsTopUpSubmitting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/wallet/topup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(topUpAmount),
                    payment_method_id: selectedPmForTopUp.id
                })
            });

            if (response.ok) {
                toast.success("Wallet topped up successfully");
                setIsTopUpOpen(false);

                // Refresh organization data (wallet minutes)
                const fetchOrgData = async () => {
                    const token = cookieUtils.get("access");
                    const res = await fetch(`${BASE_URL}/organizations/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setOrgData(data);
                    }
                };
                fetchOrgData();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to top up wallet");
            }
        } catch (err) {
            console.error("Top-up error:", err);
            setErrorDetail("An error occurred during top-up");
        } finally {
            setIsTopUpSubmitting(false);
        }
    };

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
                setIsAddPaymentOpen(false)

                // Refresh the list after adding
                const fetchPaymentMethods = async () => {
                    const token = cookieUtils.get("access");
                    const res = await fetch(`${BASE_URL}/payment/payment-methods`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPaymentMethods(data);
                    }
                };
                fetchPaymentMethods();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to add payment method");
            }
        } catch (err) {
            console.error(err);
            setErrorDetail("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubscription = async () => {
        if (!selectedPlan || !selectedPmForSubscription) {
            toast.error("Please select a plan and a payment method");
            return;
        }

        setIsSubscriptionSubmitting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: selectedPlan === "Starter" ? "starter" : (selectedPlan === "Medium" ? "pro" : ""),
                    payment_method_id: selectedPmForSubscription.id
                })
            });

            if (response.ok) {
                toast.success("Subscription plan created successfully");
                setIsSubscriptionModalOpen(false);
                fetchOrgData();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to create subscription plan");
            }
        } catch (err) {
            console.error("Subscription error:", err);
            setErrorDetail("An error occurred during subscription creation");
        } finally {
            setIsSubscriptionSubmitting(false);
        }
    };

    const handleCancelPlan = async () => {
        setIsCancellingPlan(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Subscription plan cancelled successfully");
                setIsCancelPlanModalOpen(false);
                fetchOrgData();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to cancel subscription plan");
            }
        } catch (err) {
            console.error("Cancellation error:", err);
            setErrorDetail("An error occurred during subscription cancellation");
        } finally {
            setIsCancellingPlan(false);
        }
    };

    const handleUpdateSubscription = async () => {
        if (!selectedPlan || !selectedPmForSubscription) {
            toast.error("Please select a plan and a payment method");
            return;
        }

        const backendPlan = selectedPlan === "Starter" ? "starter" : (selectedPlan === "Medium" ? "pro" : "");
        if (backendPlan === currentSubscription?.plan) {
            setErrorDetail("You are already on this plan. Please select a different plan to update.");
            return;
        }

        setIsUpdateSubmitting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: backendPlan,
                    payment_method_id: selectedPmForSubscription.id
                })
            });

            if (response.ok) {
                toast.success("Subscription plan updated successfully");
                setIsUpdateSubscriptionModalOpen(false);
                fetchOrgData();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.detail || "Failed to update subscription plan");
            }
        } catch (err) {
            console.error("Update error:", err);
            setErrorDetail("An error occurred during subscription update");
        } finally {
            setIsUpdateSubmitting(false);
        }
    };

    const pricingTiers = [
        {
            name: "Starter",
            price: "$15",
            unit: "/mo",
            icon: Rocket,
            description: "Perfect for small businesses starting their AI journey.",
            minimumMinutes: "Includes 100 minutes",
            features: ["100 Minutes included", "Standard AI Voice", "Email Support"],
            cta: "Select Starter",
            popular: false,
        },
        {
            name: "Medium",
            price: "$49",
            unit: "/mo",
            icon: Zap,
            description: "Ideal for growing teams with higher call volumes.",
            minimumMinutes: "Includes 500 minutes",
            features: ["500 Minutes included", "HD AI Voices", "Priority Support", "Advanced Analytics"],
            cta: "Select Medium",
            popular: true,
        },
        {
            name: "Enterprise",
            price: "Custom",
            unit: "",
            icon: Building2,
            description: "Tailored solutions for large-scale operations.",
            minimumMinutes: "Custom minutes available",
            features: ["Unlimited Minutes", "Custom AI Models", "Dedicated Manager", "24/7 Phone Support"],
            cta: "Contact Sales",
            popular: false,
            disabled: true,
        }
    ];

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    return (
        <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-950 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Page Title */}
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Billing</h1>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-gray-100 dark:border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab
                                ? "text-gray-900 dark:text-gray-100"
                                : "text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-gray-100" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "Overview" ? (
                    <div className="space-y-6 pt-4">
                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{orgData?.current_plan || "No Active Plan"}</h2>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <span className="text-sm font-medium">Minute balance</span>
                                <Info size={14} className="cursor-help" />
                            </div>
                            <div className="text-[40px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                {orgData?.wallet_minutes || "0.00"} Minutes
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                                        Top-up Minutes
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[480px] p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-6">
                                    <DialogHeader className="p-0">
                                        <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                                            Add to credit balance
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-6">
                                        {/* Amount Section */}
                                        <div className="space-y-2">
                                            <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                Amount to add
                                            </label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-100 text-[16px] font-medium">
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    value={topUpAmount}
                                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-8 pr-4 text-[16px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                                                    Enter an amount between $5 and $489
                                                </p>
                                                <button className="text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1 transition-colors font-medium">
                                                    Model pricing <ExternalLink size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Payment Method Section */}
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
                                                            {selectedPmForTopUp?.card.brand === 'visa' ? (
                                                                <span className="text-white font-bold italic text-[8px]">VISA</span>
                                                            ) : (
                                                                <div className="flex -space-x-1.5">
                                                                    <div className="w-4 h-4 rounded-full bg-red-600 opacity-80" />
                                                                    <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                            {selectedPmForTopUp ? `•••• ${selectedPmForTopUp.card.last4}` : 'Select card'}
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
                                                                        setSelectedPmForTopUp(pm);
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
                                                                    {selectedPmForTopUp?.id === pm.id && (
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
                                                    onClick={() => {
                                                        setIsTopUpOpen(false)
                                                        setIsAddPaymentOpen(true)
                                                    }}
                                                    className="text-[14px] font-bold text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors"
                                                >
                                                    + Add payment method
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            onClick={() => setIsTopUpOpen(false)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleTopUp}
                                            disabled={isTopUpSubmitting || !selectedPmForTopUp || !topUpAmount}
                                            className="bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center gap-2"
                                        >
                                            {isTopUpSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Continue
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isUpdateSubscriptionModalOpen} onOpenChange={setIsUpdateSubscriptionModalOpen}>
                                <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-8">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            Update Subscription Plan
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-10">
                                        {isFetchingSubscription ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                                                <p className="text-gray-500 font-medium">Fetching subscription details...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Pricing Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                                                    {pricingTiers.map((tier) => {
                                                        const hidePopularHighlight = hoveredTier !== null && hoveredTier !== tier.name;
                                                        const isHighlighted = tier.popular ? !hidePopularHighlight : hoveredTier === tier.name;
                                                        const isSelected = selectedPlan === tier.name;

                                                        return (
                                                            <div
                                                                key={tier.name}
                                                                onMouseEnter={() => !tier.disabled && setHoveredTier(tier.name)}
                                                                onMouseLeave={() => setHoveredTier(null)}
                                                                onClick={() => !tier.disabled && setSelectedPlan(tier.name)}
                                                                className={[
                                                                    "relative bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 border flex flex-col transition-all duration-200 cursor-pointer",
                                                                    tier.disabled ? "opacity-50 cursor-not-allowed grayscale" : "",
                                                                    isSelected ? "shadow-lg ring-2 ring-black dark:ring-white border-black dark:border-white" : "border-gray-200 dark:border-gray-800 shadow-sm",
                                                                    !isSelected && isHighlighted && !tier.disabled ? "border-gray-400 dark:border-gray-600" : ""
                                                                ].join(" ")}
                                                            >
                                                                {tier.popular && !isSelected && (
                                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black text-white dark:bg-white dark:text-gray-900">
                                                                            Most Popular
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className={[
                                                                        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                                                        isSelected ? "bg-black/10 dark:bg-white/10" : "bg-gray-100 dark:bg-gray-800",
                                                                    ].join(" ")}>
                                                                        <tier.icon className={[
                                                                            "w-5 h-5 transition-colors",
                                                                            isSelected ? "text-black dark:text-white" : "text-gray-500",
                                                                        ].join(" ")} />
                                                                    </div>
                                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h3>
                                                                </div>

                                                                <div className="mb-2">
                                                                    <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                                                                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">{tier.unit}</span>
                                                                </div>

                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tier.minimumMinutes}</p>
                                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{tier.description}</p>

                                                                <ul className="space-y-3 mb-8 flex-grow">
                                                                    {tier.features.map((feature) => (
                                                                        <li key={feature} className="flex items-start gap-2">
                                                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                                            <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Payment Method Selector (Styled like Top-up modal) */}
                                                <div className="max-w-md mx-auto w-full space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                            Payment method
                                                        </label>
                                                        <div className="relative">
                                                            <div
                                                                onClick={() => setIsPmSelectorForSubOpen(!isPmSelectorForSubOpen)}
                                                                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 cursor-pointer group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-6 bg-black dark:bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                                                                        {selectedPmForSubscription?.card.brand === 'visa' ? (
                                                                            <span className="text-white font-bold italic text-[8px]">VISA</span>
                                                                        ) : (
                                                                            <div className="flex -space-x-1.5">
                                                                                <div className="w-4 h-4 rounded-full bg-red-600 opacity-80" />
                                                                                <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                                        {selectedPmForSubscription ? `•••• ${selectedPmForSubscription.card.last4}` : 'Select card'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col -space-y-1 text-gray-400 dark:text-gray-500">
                                                                    <ChevronUp size={16} />
                                                                    <ChevronDown size={16} />
                                                                </div>
                                                            </div>

                                                            {isPmSelectorForSubOpen && (
                                                                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                                    <div className="max-h-[200px] overflow-y-auto">
                                                                        {paymentMethods.map((pm) => (
                                                                            <div
                                                                                key={pm.id}
                                                                                onClick={() => {
                                                                                    setSelectedPmForSubscription(pm);
                                                                                    setIsPmSelectorForSubOpen(false);
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
                                                                                {selectedPmForSubscription?.id === pm.id && (
                                                                                    <Check size={14} className="text-gray-900 dark:text-gray-100" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-1">
                                                        <button
                                                            onClick={() => {
                                                                setIsTopUpOpen(false)
                                                                setIsAddPaymentOpen(true)
                                                            }}
                                                            className="text-[14px] font-bold text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors"
                                                        >
                                                            + Add payment method
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-6">
                                                    <Button
                                                        onClick={() => setIsUpdateSubscriptionModalOpen(false)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto"
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        onClick={handleUpdateSubscription}
                                                        disabled={isUpdateSubmitting || !selectedPlan || !selectedPmForSubscription}
                                                        className="bg-[#1a1c1e] hover:bg-black text-white px-8 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center gap-2"
                                                    >
                                                        {isUpdateSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                                        Update Subscription Plan
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                            {!orgData?.current_plan && (
                                <Button
                                    onClick={() => {
                                        setSelectedPlan(null);
                                        setIsSubscriptionModalOpen(true);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                                >
                                    Add Subscription Plan
                                </Button>
                            )}
                            {orgData?.current_plan && (
                                <Button
                                    onClick={() => {
                                        fetchCurrentSubscription();
                                        setIsUpdateSubscriptionModalOpen(true);
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                                >
                                    Change Subscription Plan
                                </Button>
                            )}
                            {orgData?.current_plan && (
                                <Button
                                    onClick={() => setIsCancelPlanModalOpen(true)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                                >
                                    Cancel plan
                                </Button>
                            )}
                        </div>

                        {/* Auto-recharge Banner */}
                        {/* <div className="bg-white dark:bg-gray-900 border border-green-200 dark:border-green-900/30 rounded-2xl p-4 md:p-6 flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 bg-green-50 dark:bg-green-900/20 p-1 rounded-full">
                                    <div className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[15px] font-bold text-green-600 dark:text-green-400">Auto recharge is on</p>
                                    <p className="text-[15px] text-green-600/80 dark:text-green-400/80">
                                        When your credit balance reaches $10.00, your payment method will be charged to bring the balance up to $15.00.
                                    </p>
                                </div>
                            </div>
                            <Button className="bg-[#1a1c1e] dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 font-bold px-6 py-2 rounded-xl text-sm whitespace-nowrap transition-colors">
                                Modify
                            </Button>
                        </div> */}

                        {/* Quick Access Cards */}
                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group" onClick={() => setActiveTab("Payment methods")}>
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-gray-100 group-hover:bg-white dark:group-hover:bg-gray-750 transition-colors shadow-sm">
                                    <CreditCard size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Payment methods</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Add or change payment method</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group" onClick={() => setActiveTab("Billing history")}>
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-gray-100 group-hover:bg-white dark:group-hover:bg-gray-750 transition-colors shadow-sm">
                                    <History size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Billing history</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">View past and current invoices</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-gray-100 group-hover:bg-white dark:group-hover:bg-gray-750 transition-colors shadow-sm">
                                    <Settings size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Preferences</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage billing information</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-5 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer group">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-gray-100 group-hover:bg-white dark:group-hover:bg-gray-750 transition-colors shadow-sm">
                                    <BarChart3 size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">Usage limits</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Set monthly spend limits</p>
                                </div>
                            </div>
                        </div> */}
                    </div>
                ) : activeTab === "Billing history" ? (
                    <div className="space-y-6 pt-10">
                        <p className="text-[15px] text-gray-500 dark:text-gray-400">
                            Showing invoices within the past 12 months
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-transparent">
                                        <th className="pb-4 pr-4">Invoice</th>
                                        <th className="pb-4 px-4">Status</th>
                                        <th className="pb-4 px-4 text-right">Amount</th>
                                        <th className="pb-4 pl-4">Created</th>
                                        <th className="pb-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-[15px]">
                                    {transactions.length > 0 ? (
                                        transactions.map((tx, index) => (
                                            <tr key={index} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="py-5 pr-4 font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800">
                                                    {tx.type_display}
                                                </td>
                                                <td className="py-5 px-4 border-b border-gray-100 dark:border-gray-800">
                                                    <span className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${tx.status === 'paid'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                        }`}>
                                                        {tx.status_display}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap border-b border-gray-100 dark:border-gray-800">
                                                    ${tx.amount}
                                                </td>
                                                <td className="py-5 pl-4 text-gray-900 dark:text-gray-100 whitespace-nowrap border-b border-gray-100 dark:border-gray-800">
                                                    {new Date(tx.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </td>
                                                <td className="py-5 text-right whitespace-nowrap border-b border-gray-100 dark:border-gray-800">
                                                    {tx.stripe_invoice_url ? (
                                                        <button
                                                            onClick={() => window.open(tx.stripe_invoice_url, '_blank')}
                                                            className="text-gray-900 dark:text-gray-100 hover:text-black font-bold text-[14px] transition-colors pr-2"
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-700 text-[14px] font-medium pr-2 cursor-not-allowed">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                                                No billing history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === "Payment methods" ? (
                    <div className="space-y-8 pt-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map((pm) => (
                                    <div key={pm.id} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-6 relative hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 bg-black dark:bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                                                    {pm.card.brand === 'visa' ? (
                                                        <span className="text-white font-bold italic text-xs">VISA</span>
                                                    ) : (
                                                        <div className="flex -space-x-2">
                                                            <div className="w-5 h-5 rounded-full bg-red-600 opacity-80" />
                                                            <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">••••{pm.card.last4}</span>
                                                    </div>
                                                    <p className="text-[13px] text-gray-500 dark:text-gray-400">
                                                        Expires {pm.card.exp_month.toString().padStart(2, '0')}/{pm.card.exp_year}
                                                    </p>
                                                </div>
                                            </div>
                                            {pm.is_default && (
                                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[12px] font-bold px-3 py-1 rounded-lg">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <div className="pt-2 flex items-center gap-6">
                                            {!pm.is_default && (
                                                <button
                                                    onClick={() => {
                                                        setPmToSetDefault(pm);
                                                        setIsSetDefaultOpen(true);
                                                    }}
                                                    className="text-gray-900 dark:text-gray-100 hover:text-black text-[14px] font-bold transition-colors"
                                                >
                                                    Set as default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setPmToDelete(pm);
                                                    setIsDeleteOpen(true);
                                                }}
                                                className="text-red-500 hover:text-red-600 text-[14px] font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                                    No payment methods found.
                                </div>
                            )}

                            {/* Add Payment Method Card */}
                            {/* <div
                                onClick={() => setIsAddPaymentOpen(true)}
                                className="border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CreditCard size={20} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Add payment method</span>
                            </div> */}
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={() => setIsAddPaymentOpen(true)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-5 py-2.5 rounded-xl border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                            >
                                Add payment method
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="pt-8 text-gray-500 dark:text-gray-400 text-sm italic">
                        Content for {activeTab} will appear here.
                    </div>
                )}

                {/* Add Payment Method Modal */}
                <Dialog open={isAddPaymentOpen} onOpenChange={(open) => {
                    setIsAddPaymentOpen(open);
                    if (!open) {
                        if (cardNumberRef.current) cardNumberRef.current.unmount();
                        if (cardExpiryRef.current) cardExpiryRef.current.unmount();
                        if (cardCvcRef.current) cardCvcRef.current.unmount();
                        cardNumberRef.current = null;
                        cardExpiryRef.current = null;
                        cardCvcRef.current = null;
                    }
                }}>
                    <DialogContent
                        className="max-w-[calc(100vw-32px)] sm:max-w-[480px] p-5 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-3xl gap-6 overflow-y-auto max-h-[90vh]"
                    >
                        <DialogHeader className="p-0 space-y-2 text-left">
                            <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                                Add payment method
                            </DialogTitle>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                Add your credit card details below. This card will be saved to your account and can be removed at any time.
                            </p>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Card Information */}
                            <div className="space-y-2">
                                <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                    Card information
                                </label>
                                <div className="relative">
                                    <div className="flex items-center flex-wrap sm:flex-nowrap border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 px-4 py-3 gap-3 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-700 transition-shadow">
                                        <div className="flex-1 min-w-[180px] flex items-center gap-3">
                                            <div className="w-6 h-4 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center shrink-0">
                                                <CreditCard size={14} className="text-gray-400" />
                                            </div>
                                            <div ref={cardNumberContainerRef} className="flex-1" />
                                        </div>
                                        <div className="flex gap-3 text-[15px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800">
                                            <div ref={cardExpiryContainerRef} className="w-16" />
                                            <div ref={cardCvcContainerRef} className="w-12" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Name on Card */}
                            <div className="space-y-2">
                                <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                    Name on card
                                </label>
                                <input
                                    type="text"
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                />
                            </div>

                            {/* Billing Address */}
                            <div className="space-y-4">
                                <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                    Billing address
                                </label>
                                <div className="space-y-3">
                                    <div className="relative" ref={dropdownRef}>
                                        <div
                                            onClick={() => setIsCountryOpen(!isCountryOpen)}
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                        >
                                            <span className={selectedCountry ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>
                                                {selectedCountry ? selectedCountry.country : "Country"}
                                            </span>
                                            <ChevronsUpDown size={16} className="text-gray-400" />
                                        </div>

                                        {isCountryOpen && (
                                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            placeholder=""
                                                            value={countrySearch}
                                                            onChange={(e) => setCountrySearch(e.target.value)}
                                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-[280px] overflow-y-auto">
                                                    {filteredCountries.length > 0 ? (
                                                        filteredCountries.map((c) => (
                                                            <div
                                                                key={c.country_code}
                                                                onClick={() => {
                                                                    setSelectedCountry(c);
                                                                    setIsCountryOpen(false);
                                                                    setCountrySearch("");
                                                                }}
                                                                className="px-6 py-3 text-[15px] font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                                                            >
                                                                {c.country}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm italic">
                                                            No countries found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={addressLine1}
                                        onChange={(e) => setAddressLine1(e.target.value)}
                                        placeholder="Address line 1"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    />
                                    <input
                                        type="text"
                                        value={addressLine2}
                                        onChange={(e) => setAddressLine2(e.target.value)}
                                        placeholder="Address line 2"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="City"
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                        <input
                                            type="text"
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            placeholder="Postal code"
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={stateRegion}
                                        onChange={(e) => setStateRegion(e.target.value)}
                                        placeholder="State, county, province, or region"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    />
                                </div>
                            </div>

                            {/* Set Default Checkbox */}
                            <div className="flex items-center gap-3 pt-2">
                                <div
                                    onClick={() => setIsDefault(!isDefault)}
                                    className={`w-[18px] h-[18px] border-2 rounded cursor-pointer flex items-center justify-center transition-colors ${isDefault ? 'border-gray-900 bg-gray-900 dark:border-gray-100 dark:bg-gray-100' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'}`}
                                >
                                    {isDefault && <Check size={14} className="text-white dark:text-gray-900" strokeWidth={3} />}
                                </div>
                                <span
                                    onClick={() => setIsDefault(!isDefault)}
                                    className="text-[15px] font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
                                >
                                    Set as default payment method
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button
                                onClick={() => setIsAddPaymentOpen(false)}
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto order-2 sm:order-1"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddPaymentMethod}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add payment method
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <AlertDialog open={!!errorDetail} onOpenChange={() => setErrorDetail(null)}>
                    <AlertDialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] p-6 rounded-2xl dark:bg-gray-950 border-gray-100 dark:border-gray-800">
                        <AlertDialogHeader>
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <AlertDialogTitle className="text-lg font-bold text-red-600 dark:text-red-400">
                                    Error
                                </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 font-medium pt-2">
                                {errorDetail}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4">
                            <AlertDialogAction
                                onClick={() => setErrorDetail(null)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors h-auto border-none"
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] p-6 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-3xl gap-6">
                        <DialogHeader className="p-0 space-y-2 text-left">
                            <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                                Delete payment method?
                            </DialogTitle>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                Are you sure you want to delete this payment method? This action cannot be undone.
                            </p>
                        </DialogHeader>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button
                                onClick={() => setIsDeleteOpen(false)}
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto order-2 sm:order-1"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeletePaymentMethod}
                                disabled={isDeleting}
                                className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors h-auto flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Continue
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
                    <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Create Subscription Plan
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-10">
                            {/* Pricing Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
                                {pricingTiers.map((tier) => {
                                    const hidePopularHighlight = hoveredTier !== null && hoveredTier !== tier.name;
                                    const isHighlighted = tier.popular ? !hidePopularHighlight : hoveredTier === tier.name;
                                    const isSelected = selectedPlan === tier.name;

                                    return (
                                        <div
                                            key={tier.name}
                                            onMouseEnter={() => !tier.disabled && setHoveredTier(tier.name)}
                                            onMouseLeave={() => setHoveredTier(null)}
                                            onClick={() => !tier.disabled && setSelectedPlan(tier.name)}
                                            className={[
                                                "relative bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 border flex flex-col transition-all duration-200 cursor-pointer",
                                                tier.disabled ? "opacity-50 cursor-not-allowed grayscale" : "",
                                                isSelected ? "shadow-lg ring-2 ring-black dark:ring-white border-black dark:border-white" : "border-gray-200 dark:border-gray-800 shadow-sm",
                                                !isSelected && isHighlighted && !tier.disabled ? "border-gray-400 dark:border-gray-600" : ""
                                            ].join(" ")}
                                        >
                                            {tier.popular && !isSelected && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black text-white dark:bg-white dark:text-gray-900">
                                                        Most Popular
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={[
                                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-black/10 dark:bg-white/10" : "bg-gray-100 dark:bg-gray-800",
                                                ].join(" ")}>
                                                    <tier.icon className={[
                                                        "w-5 h-5 transition-colors",
                                                        isSelected ? "text-black dark:text-white" : "text-gray-500",
                                                    ].join(" ")} />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h3>
                                            </div>

                                            <div className="mb-2">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                                                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">{tier.unit}</span>
                                            </div>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tier.minimumMinutes}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{tier.description}</p>

                                            <ul className="space-y-3 mb-8 flex-grow">
                                                {tier.features.map((feature) => (
                                                    <li key={feature} className="flex items-start gap-2">
                                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Payment Method Selector (Styled like Top-up modal) */}
                            <div className="max-w-md mx-auto w-full space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                        Payment method
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => setIsPmSelectorForSubOpen(!isPmSelectorForSubOpen)}
                                            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 cursor-pointer group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-6 bg-black dark:bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                                                    {selectedPmForSubscription?.card.brand === 'visa' ? (
                                                        <span className="text-white font-bold italic text-[8px]">VISA</span>
                                                    ) : (
                                                        <div className="flex -space-x-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-red-600 opacity-80" />
                                                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                    {selectedPmForSubscription ? `•••• ${selectedPmForSubscription.card.last4}` : 'Select card'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col -space-y-1 text-gray-400 dark:text-gray-500">
                                                <ChevronUp size={16} />
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>

                                        {isPmSelectorForSubOpen && (
                                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {paymentMethods.map((pm) => (
                                                        <div
                                                            key={pm.id}
                                                            onClick={() => {
                                                                setSelectedPmForSubscription(pm);
                                                                setIsPmSelectorForSubOpen(false);
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
                                                            {selectedPmForSubscription?.id === pm.id && (
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
                                            onClick={() => {
                                                setIsTopUpOpen(false)
                                                setIsAddPaymentOpen(true)
                                            }}
                                            className="text-[14px] font-bold text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors"
                                        >
                                            + Add payment method
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6">
                                    <Button
                                        onClick={() => setIsSubscriptionModalOpen(false)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateSubscription}
                                        disabled={isSubscriptionSubmitting || !selectedPlan || !selectedPmForSubscription}
                                        className="bg-[#1a1c1e] hover:bg-black text-white px-8 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center gap-2"
                                    >
                                        {isSubscriptionSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Create Subscription Plan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isCancelPlanModalOpen} onOpenChange={setIsCancelPlanModalOpen}>
                    <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] p-6 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-3xl gap-6">
                        <DialogHeader className="p-0 space-y-2 text-left">
                            <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100 text-center">
                                Cancel plan confirmation
                            </DialogTitle>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium text-center pt-2">
                                Are you sure you want to cancel your current subscription plan?
                            </p>
                        </DialogHeader>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button
                                onClick={() => setIsCancelPlanModalOpen(false)}
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto order-2 sm:order-1"
                                disabled={isCancellingPlan}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCancelPlan}
                                disabled={isCancellingPlan}
                                className="w-full sm:w-auto bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {isCancellingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
                                Continue
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Set as Default Confirmation Modal */}
                <Dialog open={isSetDefaultOpen} onOpenChange={setIsSetDefaultOpen}>
                    <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] p-6 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-3xl gap-6">
                        <DialogHeader className="p-0 space-y-2 text-left">
                            <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                                Set as default?
                            </DialogTitle>
                            <p className="text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                Are you sure you want to set this payment method as your default for future payments?
                            </p>
                        </DialogHeader>

                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                            <Button
                                onClick={() => setIsSetDefaultOpen(false)}
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto order-2 sm:order-1"
                                disabled={isSettingDefault}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSetDefaultPaymentMethod}
                                disabled={isSettingDefault}
                                className="w-full sm:w-auto bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                {isSettingDefault && <Loader2 className="w-4 h-4 animate-spin" />}
                                Set as default
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    )
}
