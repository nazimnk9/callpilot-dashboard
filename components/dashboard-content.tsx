'use client';

import { useState, useEffect, useRef } from 'react';
import { CreditCard, History, Settings, BarChart3, Info, ExternalLink, ChevronDown, ChevronUp, Loader2, Search, ChevronsUpDown, Check, Rocket, Zap, Building2, AlertCircle } from 'lucide-react';
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import countriesData from "@/lib/countries.json";
import { toast } from "sonner";
import { paymentService } from "@/services/payment-service";
import { getCountryCode } from "@/app/actions";
import {
    AlertDialog,

    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const STATIC_PRICING_PLANS = [
    {
        name: "Starter",
        price: "$400 / month + VAT",
        minutes: "350 AI Voice Minutes",
        description: "Designed for small businesses starting AI voice calls.",
        features: [
            "Paid monthly in advance",
            "Dedicated onboarding & customer support",
            "$400 one-off setup fee",
            "Setup fee returned as free minutes after 12 months",
            "Additional minutes: $1.15 per minute"
        ],
        icon: Rocket,
        popular: false
    },
    {
        name: "Growing",
        price: "$1,000 / month + VAT",
        minutes: "900 AI Voice Minutes",
        description: "Designed for businesses scaling AI voice calls across teams.",
        features: [
            "Paid monthly in advance",
            "Dedicated onboarding & customer support",
            "$400 one-off setup fee",
            "Setup fee returned as free minutes after 12 months",
            "Additional minutes: $1.15 per minute"
        ],
        icon: Zap,
        popular: false
    },
    {
        name: "Pro",
        price: "$1,500 / month + VAT",
        minutes: "1,400 AI Voice Minutes",
        description: "Built for organisations running high-volume automated AI calls.",
        features: [
            "Paid monthly in advance",
            "Priority onboarding & support",
            "$400 one-off setup fee",
            "Setup fee returned as free minutes after 12 months",
            "Additional minutes: $1.15 per minute"
        ],
        icon: Zap,
        popular: true,
        displayName: "Pro"
    },
    {
        name: "Enterprise",
        price: "Custom Pricing",
        minutes: "Custom AI Call Minutes",
        description: "Custom AI automation plans designed for large-scale deployment.",
        features: [
            "Paid monthly in advance",
            "Custom AI minute packages",
            "Priority technical support",
            "Volume discounts available",
            "International calling packages",
            "Custom API integrations"
        ],
        icon: Building2,
        popular: false,
        disabled: true
    }
];

export function DashboardContent() {
    const router = useRouter();
    const [orgData, setOrgData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Billing related states
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
    const paymentSectionRef = useRef<HTMLDivElement>(null);

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

    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpMinutes, setTopUpMinutes] = useState("");
    const [selectedPmForTopUp, setSelectedPmForTopUp] = useState<any>(null);
    const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);
    const [isPmSelectorOpen, setIsPmSelectorOpen] = useState(false);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);
    const [successDetail, setSuccessDetail] = useState<string | null>(null);
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
    const [fetchedPlans, setFetchedPlans] = useState<any[]>([]);
    const [isFetchingPlans, setIsFetchingPlans] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedPmForDelete, setSelectedPmForDelete] = useState<any>(null);
    const [isContactSalesSubmitting, setIsContactSalesSubmitting] = useState(false);


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
        } finally {
            setIsLoading(false);
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

    const fetchPlans = async () => {
        setIsFetchingPlans(true);
        try {
            const response = await fetch(`${BASE_URL}/payment/subscriptions/plans`);
            if (response.ok) {
                const data = await response.json();
                setFetchedPlans(data.results || []);
            }
        } catch (err) {
            console.error("Error fetching plans:", err);
        } finally {
            setIsFetchingPlans(false);
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
        fetchCurrentSubscription();
        fetchPlans();

        // Fetch user's country automatically
        const fetchUserCountry = async () => {
            try {
                const countryCode = await getCountryCode();
                if (countryCode) {
                    const country = countriesData.find(c => c.country_code === countryCode);
                    if (country && !selectedCountry) {
                        setSelectedCountry(country);
                    }
                }
            } catch (error) {
                console.error("Error fetching country:", error);
            }
        };
        fetchUserCountry();
    }, []);

    // Sync selected plan with current subscription status
    useEffect(() => {
        const currentPlanId = currentSubscription?.plan || orgData?.current_plan;
        if (currentPlanId && fetchedPlans.length > 0) {
            const matchedPlan = fetchedPlans.find(p =>
                p.name.toLowerCase() === String(currentPlanId).toLowerCase()
            );
            if (matchedPlan) {
                setSelectedPlan(matchedPlan.name);
            }
        }
    }, [currentSubscription, orgData, fetchedPlans]);

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
                    topup_minute: parseInt(topUpMinutes),
                    payment_method_id: selectedPmForTopUp.id
                })
            });

            if (response.ok) {
                toast.success("Wallet topped up successfully");
                setIsTopUpOpen(false);
                setTopUpMinutes("");
                setTopUpAmount("");
                fetchOrgData();
            } else {
                const errData = await response.json();
                setErrorDetail(errData.details || errData.detail || "Failed to top up wallet");
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

    // const handleCreateSubscription = async () => {
    //     if (!selectedPlan || !selectedPmForSubscription) {
    //         toast.error("Please select a plan and a payment method");
    //         return;
    //     }

    //     setIsSubscriptionSubmitting(true);
    //     setErrorDetail(null);
    //     try {
    //         const token = cookieUtils.get("access");
    //         const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             body: JSON.stringify({
    //                 plan: selectedPlan,
    //                 payment_method_id: selectedPmForSubscription.id
    //             })
    //         });

    //         if (response.ok) {
    //             toast.success("Subscription plan created successfully");
    //             setIsSubscriptionModalOpen(false);
    //             fetchOrgData();
    //             fetchCurrentSubscription();
    //         } else {
    //             const errData = await response.json();
    //             if (errData.plan && Array.isArray(errData.plan)) {
    //                 setErrorDetail(errData.plan[0]);
    //             } else if (errData.detail) {
    //                 setErrorDetail(errData.detail);
    //             } else {
    //                 setErrorDetail("Failed to create subscription plan");
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Subscription error:", err);
    //         setErrorDetail("An error occurred during subscription creation");
    //     } finally {
    //         setIsSubscriptionSubmitting(false);
    //     }
    // };

    // const handleCancelPlan = async () => {
    //     setIsCancellingPlan(true);
    //     try {
    //         const token = cookieUtils.get("access");
    //         const response = await fetch(`${BASE_URL}/payment/subscriptions/cancel`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });

    //         if (response.ok) {
    //             toast.success("Subscription plan cancelled successfully");
    //             setIsCancelPlanModalOpen(false);
    //             fetchOrgData();
    //         } else {
    //             const errData = await response.json();
    //             setErrorDetail(errData.detail || "Failed to cancel subscription plan");
    //         }
    //     } catch (err) {
    //         console.error("Cancellation error:", err);
    //         setErrorDetail("An error occurred during subscription cancellation");
    //     } finally {
    //         setIsCancellingPlan(false);
    //     }
    // };

    // const handleUpdateSubscription = async () => {
    //     if (!selectedPlan || !selectedPmForSubscription) {
    //         toast.error("Please select a plan and a payment method");
    //         return;
    //     }

    //     if (selectedPlan.toLowerCase() === (currentSubscription?.plan ? String(currentSubscription.plan).toLowerCase() : "") ||
    //         selectedPlan.toLowerCase() === (orgData?.current_plan ? String(orgData.current_plan).toLowerCase() : "")) {
    //         setErrorDetail("You are already on this plan. Please select a different plan to update.");
    //         return;
    //     }

    //     setIsUpdateSubmitting(true);
    //     setErrorDetail(null);
    //     try {
    //         const token = cookieUtils.get("access");
    //         const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({
    //                 plan: selectedPlan,
    //                 payment_method_id: selectedPmForSubscription.id
    //             })
    //         });

    //         if (response.ok) {
    //             toast.success("Subscription plan updated successfully");
    //             setIsUpdateSubscriptionModalOpen(false);
    //             fetchOrgData();
    //             fetchCurrentSubscription();
    //         } else {
    //             const errData = await response.json();
    //             if (errData.plan && Array.isArray(errData.plan)) {
    //                 setErrorDetail(errData.plan[0]);
    //             } else if (errData.detail) {
    //                 setErrorDetail(errData.detail);
    //             } else {
    //                 setErrorDetail("Failed to update subscription plan");
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Update error:", err);
    //         setErrorDetail("An error occurred during subscription update");
    //     } finally {
    //         setIsUpdateSubmitting(false);
    //     }
    // };

    const handleDeletePaymentMethod = async () => {
        if (!selectedPmForDelete) return;
        setIsDeleting(true);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/payment-methods/${selectedPmForDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                toast.success("Payment method deleted successfully");
                setIsDeleteOpen(false);
                fetchPaymentMethods();
                if (selectedPmForTopUp?.id === selectedPmForDelete.id) {
                    setSelectedPmForTopUp(null);
                }
            } else {
                toast.error("Failed to delete payment method");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while deleting payment method");
        } finally {
            setIsDeleting(false);
        }
    };

    const dynamicPricingTiers = fetchedPlans.map((plan: any) => ({
        name: plan.name,
        price: `$${parseFloat(plan.price).toFixed(0)}`,
        unit: "/mo",
        icon: plan.name === "Starter" ? Rocket : (plan.name === "Pro" ? Zap : Zap), // Default to Zap for others
        description: plan.description || (plan.name === "Starter" ? "Perfect for getting started with AI voice calls." : ""),
        minimumMinutes: `Includes ${plan.limit} minutes`,
        features: plan.des_list || [],
        cta: `Select ${plan.name}`,
        popular: plan.name === "Pro", // Matches the "Medium" (Growing) popular status
        disabled: false,
    }));

    const enterpriseTier = {
        name: "Enterprise",
        price: "Custom Pricing",
        unit: "",
        icon: Building2,
        description: "Tailored solutions for large-scale operations.",
        minimumMinutes: "Custom AI Call Minutes",
        features: ["Unlimited Minutes", "Custom AI Models", "Dedicated Manager", "24/7 Phone Support"],
        cta: "Contact Sales",
        popular: false,
        disabled: true,
    };

    // const pricingTiers = [...dynamicPricingTiers, enterpriseTier];

    const filteredCountries = countries.filter(c =>
        c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.country_code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const cards = [
        {
            title: 'Current Plan',
            value: orgData?.current_plan || 'No Active Plan',
            icon: Rocket,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'Minutes Remaining',
            value: orgData?.wallet_minutes ? `${orgData.wallet_minutes} Minutes` : '0 Minutes',
            icon: Zap,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
    ];
    const getTimeAgo = (dateString: string) => {
        if (!dateString) return "";
        const now = new Date();
        const past = new Date(dateString);
        const diffInMs = now.getTime() - past.getTime();
        const diffInSecs = Math.floor(diffInMs / 1000);
        const diffInMins = Math.floor(diffInSecs / 60);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInSecs < 60) return `${diffInSecs} seconds ago`;
        if (diffInMins < 60) return `${diffInMins} minutes ago`;
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        return `${diffInDays} days ago`;
    };

    const cardss = [
        {
            title: orgData?.last_system_checked ? `Last System check: ${getTimeAgo(orgData.last_system_checked)}` : 'Last System check',
            value: 'AI Call Status',
            icon: (props: any) => <div className={`h-5 w-5 rounded-full ${orgData?.is_call_active ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'System Health',
            value: (
                <div className="flex gap-6 mt-2">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${orgData?.is_voice_api_working ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Voice API</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${orgData?.is_any_flow_connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Call Trigger</span>
                    </div> */}
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${orgData?.is_queue_working ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Queue</span>
                    </div>
                </div>
            ) as any,
            icon: (props: any) => <div className={`h-5 w-5 rounded-full ${orgData?.is_voice_api_working && orgData?.is_queue_working ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
    ];

    const pricingTiers = STATIC_PRICING_PLANS.map(plan => ({
        ...plan,
        price: plan.price.split(' ')[0],
        unit: plan.price.includes('/') ? ` / ${plan.price.split(' / ')[1]}` : "",
        minimumMinutes: plan.minutes,
        cta: plan.name === "Enterprise" ? "Contact Sales" : `Select ${plan.name}`,
    }));

    const handleCreateSubscription = async () => {
        if (!selectedPlan || !selectedPmForSubscription) {
            toast.error("Please select a plan and a payment method");
            return;
        }

        setIsSubscriptionSubmitting(true);
        setErrorDetail(null);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    payment_method_id: selectedPmForSubscription.id
                })
            });

            if (response.ok) {
                toast.success("Subscription plan created successfully");
                setIsSubscriptionModalOpen(false);
                fetchOrgData();
                fetchCurrentSubscription();
            } else {
                const errData = await response.json();
                if (errData.details) {
                    setErrorDetail(errData.details);
                } else if (errData.plan && Array.isArray(errData.plan)) {
                    setErrorDetail(errData.plan[0]);
                } else if (errData.detail) {
                    setErrorDetail(errData.detail);
                } else {
                    setErrorDetail("Failed to create subscription plan");
                }
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

        if (selectedPlan.toLowerCase() === (currentSubscription?.plan ? String(currentSubscription.plan).toLowerCase() : "") ||
            selectedPlan.toLowerCase() === (orgData?.current_plan ? String(orgData.current_plan).toLowerCase() : "")) {
            setErrorDetail("You are already on this plan. Please select a different plan to update.");
            return;
        }

        setIsUpdateSubmitting(true);
        setErrorDetail(null);
        try {
            const token = cookieUtils.get("access");
            const response = await fetch(`${BASE_URL}/payment/subscriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: selectedPlan,
                    payment_method_id: selectedPmForSubscription.id
                })
            });

            if (response.ok) {
                toast.success("Subscription plan updated successfully");
                setIsUpdateSubscriptionModalOpen(false);
                fetchOrgData();
                fetchCurrentSubscription();
            } else {
                const errData = await response.json();
                if (errData.details) {
                    setErrorDetail(errData.details);
                } else if (errData.plan && Array.isArray(errData.plan)) {
                    setErrorDetail(errData.plan[0]);
                } else if (errData.detail) {
                    setErrorDetail(errData.detail);
                } else {
                    setErrorDetail("Failed to update subscription plan");
                }
            }
        } catch (err) {
            console.error("Update error:", err);
            setErrorDetail("An error occurred during subscription update");
        } finally {
            setIsUpdateSubmitting(false);
        }
    };

    const handleContactSales = async () => {
        setIsContactSalesSubmitting(true);
        setErrorDetail(null);
        try {
            const response = await paymentService.requestCustomSubscription();
            if (response.status === 200 || response.status === 201) {
                setSuccessDetail(response.data.detail || "Your request for a custom subscription has been sent. Our team will contact you soon.");
            } else {
                setErrorDetail(response.data.detail || "Failed to send request. Please try again later.");
            }
        } catch (err: any) {
            console.error("Contact sales error:", err);
            setErrorDetail(err.response?.data?.detail || "An error occurred while sending the request. Please try again later.");
        } finally {
            setIsContactSalesSubmitting(false);
        }
    };


    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Complete Your Account Setup */}
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Complete Your Account Setup</h1>

                    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-6 md:p-8">
                        {/* soft gradient glow */}
                        <div className="pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100">
                            <div className="h-full w-full bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20" />
                        </div>

                        {/* subtle dot pattern */}
                        <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
                            <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.35)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:14px_14px]" />
                        </div>

                        <div className="relative space-y-3">
                            {[
                                { label: 'Account Created', key: 'account_created', path: '' },
                                { label: 'Add Business Details', key: 'is_given_company_details', path: '/dashboard/organization' },
                                { label: 'Buy AI Number', key: 'have_any_phone_number', path: '/dashboard/phone-numbers' },
                                { label: 'Pay Setup Fee (refunded after 12 months with minutes)', key: 'is_platform_activated', path: '/dashboard/platform-activation' },
                                { label: 'Choose Plan', key: 'is_purchased_anything', path: '/dashboard/billing' },
                                { label: 'AI Call Builder', key: 'is_any_flow_connected', path: '/dashboard/ai-call-flow-options' }
                            ].map((option, idx) => {
                                const isCompleted = orgData?.[option.key] === true || option.key === 'account_created';
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-5 group/item transition-all duration-200 ${!isCompleted ? 'cursor-pointer hover:translate-x-1' : ''}`}
                                        onClick={() => !isCompleted && router.push(option.path)}
                                    >
                                        {isCompleted ? (
                                            <div className="h-6 w-6 rounded-full bg-[#5EBB78] flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Check className="h-4 w-4 text-white stroke-[3px]" />
                                            </div>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full border-[3px] border-blue-500 dark:border-blue-400 flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-200 group-hover/item:border-blue-600 dark:group-hover/item:border-blue-300" />
                                        )}
                                        <span className={`text-[17px] font-medium text-gray-800 dark:text-gray-200 transition-all duration-200 ${!isCompleted ? 'group-hover/item:underline decoration-blue-500 underline-offset-4 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400' : ''}`}>
                                            {option.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Account & Usage</h1>
                    {/* <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening today.</p> */}
                </div>

                {/* 3 cards in same row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        Array(2).fill(0).map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 animate-pulse flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ))
                    ) : (
                        cards.map((card, index) => (
                            <div
                                key={index}
                                // onClick={() => router.push('/dashboard/billing')}
                                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                {/* soft gradient glow */}
                                <div className="pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100">
                                    <div className="h-full w-full bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20" />
                                </div>

                                {/* subtle dot pattern */}
                                <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
                                    <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.35)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:14px_14px]" />
                                </div>

                                <div className="relative p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {/* icon container */}
                                            <div
                                                className={`relative grid h-12 w-12 place-items-center rounded-2xl ${card.bgColor} ${card.iconColor} shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
                                            >
                                                <div className="absolute inset-0 rounded-2xl opacity-40 blur-lg" />
                                                <card.icon size={22} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-start mt-1">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                            {card.title}
                                                        </p>
                                                        <p className="text-xl font-medium tracking-tight text-gray-900 dark:text-white">
                                                            {card.value}
                                                        </p>

                                                        {card.title === 'Minutes Remaining' && (
                                                            <div className="mt-4">
                                                                <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                                                                    <DialogTrigger asChild>
                                                                        <button
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-[100px] md:w-[110px] sm:w-[15%] bg-secondary hover:bg-black hover:text-white text-black border border-black dark:border-secondary dark:bg-primary dark:hover:border-black dark:hover:text-black px-0 py-[3px] md:px-0 md:py-[3px] rounded-2xl text-[11px] font-bold transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                                                                        >
                                                                            Top-up
                                                                        </button>
                                                                    </DialogTrigger>
                                                                    <DialogContent className="sm:max-w-[480px] p-6 sm:p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-6">
                                                                        <DialogHeader className="p-0">
                                                                            <DialogTitle className="text-[22px] font-bold text-gray-900 dark:text-gray-100">
                                                                                Add Minutes
                                                                            </DialogTitle>
                                                                        </DialogHeader>

                                                                        <div className="space-y-6">
                                                                            {/* Amount Section */}
                                                                            <div className="space-y-2">
                                                                                {/* <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                                                    Minutes to add
                                                                                </label> */}
                                                                                <div className="relative">
                                                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                                                                        <div className="w-5 h-5 bg-blue-50 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                                                                            <Zap size={10} className="text-blue-600 dark:text-blue-400 fill-current" />
                                                                                        </div>
                                                                                    </div>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={topUpMinutes}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value;
                                                                                            if (val === "") {
                                                                                                setTopUpMinutes("");
                                                                                                setTopUpAmount("");
                                                                                                return;
                                                                                            }
                                                                                            const mins = Math.floor(parseInt(val));
                                                                                            if (isNaN(mins)) return;

                                                                                            setTopUpMinutes(mins.toString());
                                                                                            if (orgData?.top_up_min_per_dol) {
                                                                                                const rate = parseFloat(orgData.top_up_min_per_dol);
                                                                                                if (rate > 0) {
                                                                                                    const costPerMin = Math.round((1 / rate) * 100) / 100;
                                                                                                    const total = (mins * costPerMin).toFixed(2);
                                                                                                    setTopUpAmount(total);
                                                                                                } else {
                                                                                                    setTopUpAmount("0.00");
                                                                                                }
                                                                                            }
                                                                                        }}
                                                                                        placeholder="Enter minutes"
                                                                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-[16px] font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex items-center justify-between px-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <BarChart3 size={14} className="text-blue-500" />
                                                                                        <p className="text-[13px] text-gray-900 dark:text-gray-100 font-bold">
                                                                                            Total Cost: ${topUpAmount || "0.00"}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Info size={14} className="text-gray-400" />
                                                                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                                                                                            Cost per minute: ${orgData?.top_up_min_per_dol && parseFloat(orgData.top_up_min_per_dol) > 0 ? (1 / parseFloat(orgData.top_up_min_per_dol)).toFixed(2) : "0.00"}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Payment Method Selector */}
                                                                            <div className="space-y-2">
                                                                                <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                                                                    Payment method
                                                                                </label>
                                                                                <div className="relative">
                                                                                    <div
                                                                                        onClick={() => setIsPmSelectorOpen(!isPmSelectorOpen)}
                                                                                        className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-900 cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-850 transition-all duration-200"
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
                                                                                        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl z-[60] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                                                                            <div className="max-h-[240px] overflow-y-auto p-2">
                                                                                                {paymentMethods.map((pm) => (
                                                                                                    <div
                                                                                                        key={pm.id}
                                                                                                        onClick={() => {
                                                                                                            setSelectedPmForTopUp(pm);
                                                                                                            setIsPmSelectorOpen(false);
                                                                                                        }}
                                                                                                        className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 rounded-2xl cursor-pointer transition-colors"
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
                                                                                                            <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">•••• {pm.card.last4}</span>
                                                                                                        </div>
                                                                                                        {selectedPmForTopUp?.id === pm.id && (
                                                                                                            <Check size={16} className="text-gray-900 dark:text-gray-100" />
                                                                                                        )}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex justify-start px-1">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setIsTopUpOpen(false)
                                                                                        setIsAddPaymentOpen(true)
                                                                                    }}
                                                                                    className="text-[14px] font-bold text-gray-900 dark:text-gray-100 hover:opacity-70 transition-opacity flex items-center gap-2"
                                                                                >
                                                                                    <span className="text-lg">+</span> Add payment method
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                                                            <Button
                                                                                onClick={() => setIsTopUpOpen(false)}
                                                                                className="w-full sm:flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold px-6 py-4 rounded-2xl border-none shadow-none text-[15px] transition-colors h-auto"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                            <Button
                                                                                onClick={handleTopUp}
                                                                                disabled={isTopUpSubmitting || !topUpAmount || !selectedPmForTopUp}
                                                                                className="w-full sm:flex-1 bg-[#1a1c1e] hover:bg-black text-white px-6 py-4 rounded-2xl text-[15px] font-bold transition-all h-auto flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
                                                                            >
                                                                                {isTopUpSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                                                                Continue
                                                                            </Button>
                                                                        </div>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {card.title === 'Current Plan' && (
                                                    <div className="flex flex-row gap-2 mt-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (orgData?.current_plan) {
                                                                    fetchCurrentSubscription();
                                                                    setIsUpdateSubscriptionModalOpen(true);
                                                                } else {
                                                                    setSelectedPlan(null);
                                                                    setIsSubscriptionModalOpen(true);
                                                                }
                                                            }}
                                                            className="w-[100px] md:w-[110px] sm:w-[15%] bg-secondary hover:bg-black hover:text-white text-black border border-black dark:border-secondary dark:bg-primary dark:hover:border-black dark:hover:text-black px-0 py-[3px] md:px-0 md:py-[3px] rounded-2xl text-[11px] font-bold transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            {orgData?.current_plan ? "Upgrade Plan" : "Upgrade Plan"}
                                                        </button>

                                                        {/* {orgData?.current_plan && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsCancelPlanModalOpen(true);
                                                                }}
                                                                className="text-[9px] md:text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors duration-200 text-center w-[100px] md:w-[110px] sm:w-[15%] px-1 py-1 md:px-1 md:py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-2xl"
                                                            >
                                                                Cancel Subscription
                                                            </button>
                                                        )} */}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Controls</h1>
                    {/* <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening today.</p> */}
                </div>

                {/* 3 cards in same row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        Array(2).fill(0).map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 animate-pulse flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ))
                    ) : (
                        cardss.map((card, index) => (
                            <div
                                key={index}
                                // onClick={() => router.push('/dashboard/billing')}
                                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                {/* soft gradient glow */}
                                <div className="pointer-events-none absolute -inset-24 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100">
                                    <div className="h-full w-full bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20" />
                                </div>

                                {/* subtle dot pattern */}
                                <div className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.08]">
                                    <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.35)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.35)_1px,transparent_0)] [background-size:14px_14px]" />
                                </div>

                                <div className="relative p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {/* icon container */}
                                            <div
                                                className={`relative grid h-12 w-12 place-items-center rounded-2xl ${card.bgColor} ${card.iconColor} shadow-sm ring-1 ring-black/5 dark:ring-white/10`}
                                            >
                                                <div className="absolute inset-0 rounded-2xl opacity-40 blur-lg" />
                                                <card.icon size={22} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-start mt-1">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                            {card.title}
                                                        </p>
                                                        <div className="text-xl font-medium tracking-tight text-gray-900 dark:text-white">
                                                            {card.value}
                                                        </div>


                                                    </div>
                                                </div>
                                                {card.title === 'Current Plan' && (
                                                    <div className="flex flex-row gap-2 mt-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (orgData?.current_plan) {
                                                                    fetchCurrentSubscription();
                                                                    setIsUpdateSubscriptionModalOpen(true);
                                                                } else {
                                                                    setSelectedPlan(null);
                                                                    setIsSubscriptionModalOpen(true);
                                                                }
                                                            }}
                                                            className="w-[100px] md:w-[110px] sm:w-[15%] bg-secondary hover:bg-black hover:text-white text-black border border-black dark:border-secondary dark:bg-primary dark:hover:border-black dark:hover:text-black px-0 py-[3px] md:px-0 md:py-[3px] rounded-2xl text-[11px] font-bold transition-all duration-300 shadow-lg shadow-gray-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            {orgData?.current_plan ? "Upgrade Plan" : "Upgrade Plan"}
                                                        </button>

                                                        {orgData?.current_plan && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setIsCancelPlanModalOpen(true);
                                                                }}
                                                                className="text-[9px] md:text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors duration-200 text-center w-[100px] md:w-[110px] sm:w-[15%] px-1 py-1 md:px-1 md:py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/50 rounded-2xl"
                                                            >
                                                                Cancel Subscription
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

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
                                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-[70] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
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
                            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 font-medium pt-2 text-center">
                                {errorDetail}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4">
                            <AlertDialogAction
                                onClick={() => {
                                    if (errorDetail === "You didn't pay the development fee.") {
                                        router.push('/dashboard/platform-activation');
                                    }
                                    setErrorDetail(null);
                                }}
                                className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors h-auto border-none"
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
                                {pricingTiers.map((tier) => {
                                    const hidePopularHighlight = hoveredTier !== null && hoveredTier !== tier.name;
                                    const isHighlighted = tier.popular ? !hidePopularHighlight : hoveredTier === tier.name;
                                    const isSelected = selectedPlan === tier.name;

                                    return (
                                        <div
                                            key={tier.name}
                                            onMouseEnter={() => !tier.disabled && setHoveredTier(tier.name)}
                                            onMouseLeave={() => setHoveredTier(null)}
                                            onClick={() => {
                                                if (!tier.disabled) {
                                                    setSelectedPlan(tier.name);
                                                    paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className={[
                                                "relative bg-white dark:bg-gray-900 rounded-2xl p-6 lg:p-8 border flex flex-col transition-all duration-200 cursor-pointer",
                                                tier.disabled ? (tier.name === "Enterprise" ? "opacity-80 grayscale-[0.3]" : "opacity-50 cursor-not-allowed grayscale") : "",
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
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{(tier as any).displayName || tier.name}</h3>
                                            </div>

                                            <div className="mb-2">
                                                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                                                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">{tier.unit}</span>
                                            </div>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tier.minimumMinutes}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{tier.description}</p>

                                            <ul className="space-y-3 mb-8 flex-grow">
                                                {tier.features.map((feature: string) => (
                                                    <li key={feature} className="flex items-start gap-2">
                                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {tier.name === "Enterprise" && (
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleContactSales();
                                                    }}
                                                    disabled={isContactSalesSubmitting}
                                                    className="w-full bg-[#1a1c1e] hover:bg-black text-white py-3 rounded-xl font-bold transition-all dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto flex items-center justify-center gap-2"
                                                >
                                                    {isContactSalesSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    {tier.cta}
                                                </Button>
                                            )}
                                        </div>

                                    );
                                })}
                            </div>

                            {/* Payment Method Selector */}
                            <div ref={paymentSectionRef} className="max-w-md mx-auto w-full space-y-4">
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
                                                setIsSubscriptionModalOpen(false)
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

                <Dialog open={isUpdateSubscriptionModalOpen} onOpenChange={setIsUpdateSubscriptionModalOpen}>
                    <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-8">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                Update Subscription Plan
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-10">
                            {isFetchingSubscription || isFetchingPlans ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    <p className="text-gray-500 font-medium">Fetching details...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
                                        {pricingTiers.map((tier) => {
                                            const hidePopularHighlight = hoveredTier !== null && hoveredTier !== tier.name;
                                            const isHighlighted = tier.popular ? !hidePopularHighlight : hoveredTier === tier.name;
                                            const isSelected = selectedPlan === tier.name;

                                            return (
                                                <div
                                                    key={tier.name}
                                                    onMouseEnter={() => !tier.disabled && setHoveredTier(tier.name)}
                                                    onMouseLeave={() => setHoveredTier(null)}
                                                    onClick={() => {
                                                        if (!tier.disabled) {
                                                            setSelectedPlan(tier.name);
                                                            paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                                        }
                                                    }}
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
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{(tier as any).displayName || tier.name}</h3>
                                                    </div>

                                                    <div className="mb-2">
                                                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                                                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">{tier.unit}</span>
                                                    </div>

                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tier.minimumMinutes}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{tier.description}</p>

                                                    <ul className="space-y-3 mb-8 flex-grow">
                                                        {tier.features.map((feature: string) => (
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

                                    <div ref={paymentSectionRef} className="max-w-md mx-auto w-full space-y-4">
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
                                                        setIsUpdateSubscriptionModalOpen(false)
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
                                    </div>
                                </>
                            )}
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

                <AlertDialog open={!!successDetail} onOpenChange={() => setSuccessDetail(null)}>
                    <AlertDialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] p-6 rounded-2xl dark:bg-gray-950 border-gray-100 dark:border-gray-800">
                        <AlertDialogHeader>
                            <div className="flex justify-center items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <AlertDialogTitle className="text-lg font-bold text-green-600 dark:text-green-400">
                                    Success
                                </AlertDialogTitle>
                            </div>
                            <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 font-medium pt-2 text-center">
                                {successDetail}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4">
                            <AlertDialogAction
                                onClick={() => setSuccessDetail(null)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors h-auto border-none"
                            >
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Placeholder for more content to make it look full */}
                {/* <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-4">
                        <BarChart3 className="text-gray-400 dark:text-gray-500" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis coming soon</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mt-2">
                        We're processing your data to provide deep insights into your call performance and user engagement.
                    </p>
                </div> */}
            </div>
        </main>
    );
}
