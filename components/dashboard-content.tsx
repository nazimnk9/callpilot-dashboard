'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Loader2, Rocket, Zap } from 'lucide-react';
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";
import { useRouter } from 'next/navigation';

export function DashboardContent() {
    const router = useRouter();
    const [orgData, setOrgData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        fetchOrgData();
    }, []);

    const cards = [
        {
            title: 'Current Plan',
            value: orgData?.current_plan || 'No Active Plan',
            icon: Rocket,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'Remaining Balance',
            value: orgData?.wallet_minutes ? `${orgData.wallet_minutes} Minutes` : '0 Minutes',
            icon: Zap,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
    ];

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Control Centre Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
                </div>

                {/* 3 cards in same row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                onClick={() => router.push('/dashboard/billing')}
                                className="group relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
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
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {card.title}
                                                </p>
                                                <p className="mt-1 text-xl font-medium tracking-tight text-gray-900 dark:text-white">
                                                    {card.value}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Placeholder for more content to make it look full */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center mb-4">
                        <BarChart3 className="text-gray-400 dark:text-gray-500" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Analysis coming soon</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mt-2">
                        We're processing your data to provide deep insights into your call performance and user engagement.
                    </p>
                </div>
            </div>
        </main>
    );
}
