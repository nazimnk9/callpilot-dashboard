"use client"

import { useState } from "react"
import { CreditCard, History, Settings, BarChart3, Info, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function BillingContent() {
    const [activeTab, setActiveTab] = useState("Overview")
    const [isTopUpOpen, setIsTopUpOpen] = useState(false)
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)

    const tabs = ["Overview", "Payment methods", "Billing history",
        //"Credit grants", "Preferences"
    ]

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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Package Name</h2>
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <span className="text-sm font-medium">Minute balance</span>
                                <Info size={14} className="cursor-help" />
                            </div>
                            <div className="text-[40px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                40:20 Minutes
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
                                                    type="text"
                                                    defaultValue="10"
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
                                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 cursor-pointer group hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-6 bg-black dark:bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                                                        <div className="flex -space-x-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-red-600 opacity-80" />
                                                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                                                        </div>
                                                    </div>
                                                    <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">•••• 7134</span>
                                                </div>
                                                <div className="flex flex-col -space-y-1 text-gray-400 dark:text-gray-500">
                                                    <ChevronUp size={16} />
                                                    <ChevronDown size={16} />
                                                </div>
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

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            onClick={() => setIsTopUpOpen(false)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto"
                                        >
                                            Continue
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-4 py-2 rounded-lg border-none shadow-none text-sm transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700">
                                Cancel plan
                            </Button>
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
                                    {[
                                        { id: "B38FE232-0007", amount: "$6.14", date: "Jan 1, 2026, 1:54 AM" },
                                        { id: "B38FE232-0006", amount: "$6.01", date: "Dec 13, 2025, 11:43 PM" },
                                        { id: "B38FE232-0005", amount: "$6.11", date: "Nov 11, 2025, 6:53 AM" },
                                        { id: "B38FE232-0004", amount: "$6.01", date: "Oct 22, 2025, 2:13 AM" },
                                        { id: "B38FE232-0003", amount: "$18.00", date: "Oct 2, 2025, 12:15 PM" },
                                        { id: "B38FE232-0002", amount: "$6.00", date: "Sep 5, 2024, 12:56 PM" },
                                        { id: "B38FE232-0001", amount: "$12.00", date: "Sep 5, 2024, 12:55 PM" },
                                    ].map((invoice, index) => (
                                        <tr key={index} className="group hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                                            <td className="py-5 pr-4 font-medium text-gray-900 dark:text-gray-100">{invoice.id}</td>
                                            <td className="py-5 px-4">
                                                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[12px] font-bold px-2 py-0.5 rounded-md">
                                                    Paid
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-right font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{invoice.amount}</td>
                                            <td className="py-5 pl-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">{invoice.date}</td>
                                            <td className="py-5 text-right whitespace-nowrap">
                                                <button className="text-gray-900 dark:text-gray-100 hover:text-black font-bold text-[14px] transition-colors pr-2">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === "Payment methods" ? (
                    <div className="space-y-8 pt-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Payment Card 1 (Default) */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-6 relative hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-black dark:bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                                            <div className="flex -space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-red-600 opacity-80" />
                                                <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">••••7134</span>
                                            </div>
                                            <p className="text-[13px] text-gray-500 dark:text-gray-400">Expires 08/2030</p>
                                        </div>
                                    </div>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-[12px] font-bold px-3 py-1 rounded-lg">
                                        Default
                                    </span>
                                </div>
                                <div className="pt-2">
                                    <button className="text-red-500 hover:text-red-600 text-[14px] font-bold transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Payment Card 2 */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-6 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-black dark:bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                                            <div className="flex -space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-red-600 opacity-80" />
                                                <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">••••7134</span>
                                            </div>
                                            <p className="text-[13px] text-gray-500 dark:text-gray-400">Expires 08/2030</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center gap-6">
                                    <button className="text-gray-900 dark:text-gray-100 hover:text-black text-[14px] font-bold transition-colors">
                                        Set as default
                                    </button>
                                    <button className="text-red-500 hover:text-red-600 text-[14px] font-bold transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Payment Card 3 */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-5 md:p-6 space-y-6 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-black dark:bg-gray-800 rounded-md flex items-center justify-center relative overflow-hidden">
                                            <div className="flex -space-x-2">
                                                <div className="w-5 h-5 rounded-full bg-red-600 opacity-80" />
                                                <div className="w-5 h-5 rounded-full bg-yellow-500 opacity-80" />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">••••7134</span>
                                            </div>
                                            <p className="text-[13px] text-gray-500 dark:text-gray-400">Expires 08/2030</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 flex items-center gap-6">
                                    <button className="text-gray-900 dark:text-gray-100 hover:text-black text-[14px] font-bold transition-colors">
                                        Set as default
                                    </button>
                                    <button className="text-red-500 hover:text-red-600 text-[14px] font-bold transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
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
                <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                    <DialogContent className="sm:max-w-[480px] p-8 dark:bg-gray-950 border-gray-100 dark:border-gray-800 rounded-3xl gap-6 overflow-y-auto max-h-[90vh]">
                        <DialogHeader className="p-0 space-y-2">
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
                                    <div className="flex items-center border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 px-4 py-3 gap-3 focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-700 transition-shadow">
                                        <div className="w-6 h-4 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                                            <CreditCard size={14} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Card number"
                                            className="w-full bg-transparent text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        />
                                        <div className="flex gap-3 text-[15px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                            <span>MM / YY</span>
                                            <span>CVC</span>
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
                                    className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow"
                                />
                            </div>

                            {/* Billing Address */}
                            <div className="space-y-4">
                                <label className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                                    Billing address
                                </label>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <div className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-400 dark:text-gray-500 flex items-center justify-between cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                                            <span>Country</span>
                                            <div className="flex flex-col -space-y-1">
                                                <ChevronUp size={14} />
                                                <ChevronDown size={14} />
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Address line 1"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Address line 2"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Postal code"
                                            className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="State, county, province, or region"
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-[15px] font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-shadow placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Set Default Checkbox */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className="w-[18px] h-[18px] border-2 border-gray-300 dark:border-gray-700 rounded cursor-pointer flex items-center justify-center hover:border-gray-400 transition-colors">
                                    <div className="w-2 h-2 bg-transparent" />
                                </div>
                                <span className="text-[15px] font-medium text-gray-900 dark:text-gray-100">
                                    Set as default payment method
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                onClick={() => setIsAddPaymentOpen(false)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl border-none shadow-none text-[15px] transition-colors dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-[#1a1c1e] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white h-auto"
                            >
                                Add payment method
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    )
}
