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
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
            <LoaderOverlay isLoading={isLoading} />
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Phone Numbers</h1>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <Phone size={24} className="text-gray-900" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Manage Phone Numbers</h2>
                            <p className="text-gray-500 mt-1">Manage the phone numbers used by your automations.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="default"
                            className="bg-[#8e97a9] hover:bg-[#7e8799] text-gray-900 font-semibold px-6 py-2 rounded-xl flex items-center gap-2 border-none"
                        >
                            <Phone size={18} />
                            My Numbers
                        </Button>
                        <Button
                            variant="default"
                            className="bg-[#8e97a9] hover:bg-[#7e8799] text-gray-900 font-semibold px-6 py-2 rounded-xl flex items-center gap-2 border-none"
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
                        <AlertDialogDescription>
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
