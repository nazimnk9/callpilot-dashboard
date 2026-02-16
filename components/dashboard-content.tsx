'use client';

import { BarChart3, Users, Phone, ArrowUpRight } from 'lucide-react';

export function DashboardContent() {
    const cards = [
        {
            title: 'Total Calls',
            value: '1,284',
            change: '+12.5%',
            icon: Phone,
            iconColor: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
            title: 'Active Users',
            value: '856',
            change: '+5.2%',
            icon: Users,
            iconColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
        {
            title: 'Success Rate',
            value: '98.2%',
            change: '+1.4%',
            icon: BarChart3,
            iconColor: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
    ];

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
                </div>

                {/* 3 cards in same row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.bgColor} ${card.iconColor}`}>
                                    <card.icon size={24} />
                                </div>
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                                    <span>{card.change}</span>
                                    <ArrowUpRight size={16} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{card.value}</h3>
                            </div>
                        </div>
                    ))}
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
