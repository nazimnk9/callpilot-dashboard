"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authService } from "@/services/auth-service";

interface PageProps {
    params: Promise<{ uid: string }>;
}

export default function ForgotPasswordVerifyPage({ params }: PageProps) {
    const { uid } = use(params);
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setShowErrorDialog(true);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await authService.verifyOrganization(uid, {
                password: password as any, // Cast to any because of the specific type suggested in task but we need to send the value
            });
            const data = await response.json();

            if (response.ok) {
                setShowSuccessDialog(true);
            } else {
                let errorMsg = "Failed to update password. Please try again.";
                if (data.detail) {
                    errorMsg = data.detail;
                } else if (typeof data === "object") {
                    errorMsg = Object.entries(data)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                        .join("\n");
                }
                setError(errorMsg);
                setShowErrorDialog(true);
            }
        } catch (err) {
            setError("Failed to connect to the server. Please check your internet connection.");
            setShowErrorDialog(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
                        {/* LEFT: centered video card (hidden on mobile) */}
                        <div className="hidden lg:block order-2 lg:order-1">
                            <div className="rounded-2xl border border-border bg-card/40 shadow-sm overflow-hidden">
                                <div className="p-4 sm:p-5">
                                    <div className="relative w-full overflow-hidden rounded-xl bg-muted aspect-[4/4]">
                                        <video
                                            className="absolute inset-0 h-full w-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                        >
                                            <source src="/videos/call_pilot_v.mp4" type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/25 via-transparent to-transparent" />
                                        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/30" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: forgot password verify card */}
                        <div className="order-1 lg:order-2">
                            <div className="rounded-2xl bg-card/40 shadow-sm">
                                <div className="p-5 sm:p-6 border-b border-border">
                                    <div className="flex items-center justify-between gap-4">
                                        <Link href="/" className="inline-flex items-center">
                                            <img
                                                src="/callpilot_logo.png"
                                                alt="CallPilot"
                                                className="h-20 sm:h-18 lg:h-20 w-auto"
                                            />
                                        </Link>
                                        <p className="text-sm text-muted-foreground">
                                            Return to{" "}
                                            <Link
                                                href="/login"
                                                className="font-medium text-headline hover:underline underline-offset-4 transition-colors"
                                            >
                                                Sign in
                                            </Link>
                                        </p>
                                    </div>

                                    <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-headline tracking-tight">
                                        Update Password
                                    </h1>
                                    <p className="mt-2 text-sm sm:text-base text-body">
                                        Enter your new password below to reset your account.
                                    </p>
                                </div>

                                <div className="p-5 sm:px-6 sm:py-4">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="newPassword"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-headline transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-headline transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-black text-white hover:bg-gray-900"
                                            size="lg"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? "Updating..." : "Update"}
                                        </Button>
                                    </form>

                                    <div className="mt-6 pt-5 border-t border-border text-center">
                                        <p className="text-xs text-muted-foreground">
                                            Back to{" "}
                                            <Link
                                                href="/login"
                                                className="underline underline-offset-4 hover:text-headline transition-colors"
                                            >
                                                Sign in
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="h-6" />
                </div>
            </div>

            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Success</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your password has been successfully updated.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => {
                            setShowSuccessDialog(false);
                            router.push("/login");
                        }}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-wrap">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
                            Try Again
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
