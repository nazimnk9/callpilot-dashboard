import React, { useState, useEffect } from 'react';
import {
    MessageSquare,
    ChevronLeft,
    Clock,
    Send,
    Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { profileService } from '@/services/profile-service';

const getStatusDetails = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'RESOLVED':
            return {
                label: 'Resolved',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                dot: 'bg-green-500'
            };
        case 'PENDING':
            return {
                label: 'Pending',
                color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                dot: 'bg-orange-500'
            };
        case 'OPEN':
            return {
                label: 'Open',
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                dot: 'bg-blue-500'
            };
        default:
            return {
                label: status || 'Unknown',
                color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                dot: 'bg-gray-500'
            };
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export function SupportTicketsContent() {
    const router = useRouter();
    const [tickets, setTickets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await profileService.getSupportTickets();
                setTickets(response.data.results || []);
            } catch (error) {
                console.error("Error fetching support tickets:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickets();
    }, []);

    return (
        <div className="flex-1 overflow-y-auto bg-[#F9FAFB] dark:bg-gray-950">
            <div className="max-w-[1100px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <button
                    onClick={() => router.push('/dashboard/help')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6 text-sm font-medium group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Help Center
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 mb-12">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">View your ticket history or submit a new request</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Ticket History */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Ticket History</h2>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                                    <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
                                    <p className="text-sm font-medium">Loading your tickets...</p>
                                </div>
                            ) : tickets.length > 0 ? (
                                tickets.map((ticket) => {
                                    const { label, color, dot } = getStatusDetails(ticket.status);
                                    return (
                                        <Card key={ticket.id} className="p-6 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900/50">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TKT-{ticket.id}</span>
                                                    <Badge className={`px-2 py-0.5 rounded-full text-[10px] font-bold border-none ${color}`}>
                                                        <div className={`w-1 h-1 rounded-full mr-1.5 ${dot}`} />
                                                        {label}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-medium whitespace-nowrap">
                                                    <Clock size={12} />
                                                    {formatDate(ticket.created_at)}
                                                </div>
                                            </div>
                                            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                                                {ticket.subject}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 leading-relaxed">
                                                {ticket.message}
                                            </p>
                                        </Card>
                                    );
                                })
                            ) : (
                                <Card className="p-12 border-dashed border-2 border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center bg-transparent">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 mb-6">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[300px] mb-8">
                                        You haven't submitted any support tickets yet. If you need help, feel free to write one.
                                    </p>
                                    <Button
                                        onClick={() => router.push('/dashboard/help/support-tickets/create')}
                                        variant="outline"
                                        className="rounded-xl font-bold"
                                    >
                                        Write Your First Ticket
                                    </Button>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Action */}
                    <div className="lg:col-span-1 space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Need More Help?</h2>
                        <Card className="bg-[#EBF2FF] dark:bg-blue-900/10 border-[#D6E6FF] dark:border-blue-800/30 p-8 min-w-[500px] text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-200/50 dark:border-blue-700/30">
                                <Send size={24} className="ml-0.5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Write a New Ticket</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                Describe your issue and our support team will get back to you within 24 hours.
                            </p>
                            <Button
                                onClick={() => router.push('/dashboard/help/support-tickets/create')}
                                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-6 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <Send size={16} />
                                Write a Support Ticket
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
