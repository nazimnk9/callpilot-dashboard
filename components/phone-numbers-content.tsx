'use client';

import { Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { phoneService } from '@/services/phone-service';
import { LoaderOverlay } from './auth/loader-overlay';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PhoneNumbersContent() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);

    const handleBuyNumber = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Get organization info
            const orgRes = await phoneService.getOrganizationMe();
            const orgName = orgRes.data.name;

            // 2. Create subaccount
            await phoneService.createSubaccount(orgName);

            // 3. Redirect to buy page
            router.push("/dashboard/phone-number-buy");
        } catch (err: any) {
            console.error("Error starting buy flow:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to initialize phone number purchase. Please try again.";
            setError(errorMsg);
            setShowErrorDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            <LoaderOverlay isLoading={isLoading} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Phone Numbers</h1>
                </div>

                <div className="border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group p-8 rounded-xl">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                            <Phone size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">Manage Phone Numbers</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage the phone numbers used by your automations.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="default"
                            className="bg-black dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 font-semibold transition-all duration-200 gap-2"
                            onClick={() => router.push("/dashboard/number-list")}
                        >
                            <Phone size={18} />
                            My Numbers
                        </Button>
                        <Button
                            variant="default"
                            className="bg-black dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 font-semibold transition-all duration-200 gap-2"
                            onClick={handleBuyNumber}
                            disabled={isLoading}
                        >
                            <Plus size={18} />
                            Buy Phone Number
                        </Button>
                    </div>
                </div>
            </div>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive dark:text-red-400">Error</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)} className="dark:bg-gray-100 dark:text-gray-900">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
