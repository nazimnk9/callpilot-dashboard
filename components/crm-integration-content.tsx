'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Check, Phone, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cookieUtils } from "@/services/auth-service";
import { crmService, Platform } from "@/services/crm-service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CRMIntegrationContent() {
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isIntegrating, setIsIntegrating] = useState(false);
    const [errorDialog, setErrorDialog] = useState<{ show: boolean; title: string; message: string }>({
        show: false,
        title: "",
        message: "",
    });
    const [successDialog, setSuccessDialog] = useState<{ show: boolean; title: string; message: string }>({
        show: false,
        title: "",
        message: "",
    });
    const router = useRouter();
    const hasProcessedRef = useRef(false);

    useEffect(() => {
        fetchPlatforms();
        if (!hasProcessedRef.current) {
            checkOAuthCallback();
            hasProcessedRef.current = true;
        }
    }, []);

    const fetchPlatforms = async () => {
        try {
            setIsLoading(true);
            const authToken = cookieUtils.get("access");

            if (!authToken) {
                setErrorDialog({
                    show: true,
                    title: "Authentication Error",
                    message: "Authentication token not found. Please sign in again.",
                });
                setIsLoading(false);
                return;
            }

            const response = await crmService.fetchPlatforms(authToken);
            const data = await response.json();

            if (response.ok) {
                setPlatforms(data.results);
            } else {
                setErrorDialog({
                    show: true,
                    title: "Error",
                    message: data.message || "Failed to fetch platforms",
                });
            }
        } catch (err) {
            setErrorDialog({
                show: true,
                title: "Error",
                message: "An error occurred while fetching platforms",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const checkOAuthCallback = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const code = params.get("code");

            if (code) {
                setIsIntegrating(true);
                const authToken = cookieUtils.get("access");
                const platformSlug = localStorage.getItem("platformSlug");
                const redirectUri = localStorage.getItem("redirectUri");

                if (!authToken || !platformSlug || !redirectUri) {
                    setIsIntegrating(false);
                    return;
                }

                const response = await crmService.connectPlatform(authToken, {
                    code: code,
                    redirect_uri: redirectUri,
                    platform_slug: platformSlug,
                });

                const data = await response.json();

                if (response.ok) {
                    setSuccessDialog({
                        show: true,
                        title: "Success",
                        message: `Successfully integrated ${platformSlug}!`,
                    });
                    localStorage.removeItem("platformSlug");
                    localStorage.removeItem("redirectUri");
                    window.history.replaceState({}, document.title, window.location.pathname);
                    await fetchPlatforms();
                } else {
                    setErrorDialog({
                        show: true,
                        title: "Integration Error",
                        message: data.detail || data.platform_slug || "Failed to complete integration",
                    });
                }
            }
        } catch (err) {
            setErrorDialog({
                show: true,
                title: "Integration Error",
                message: "An error occurred while completing the integration",
            });
        } finally {
            setIsIntegrating(false);
        }
    };

    const handleIntegrate = (platform: Platform) => {
        try {
            const oauthUrl = `${platform.base_url || "https://id.jobadder.com/"}connect/authorize?response_type=${platform.response_type}&client_id=${platform.client_id}&scope=${platform.scope}&redirect_uri=${platform.redirect_uri}&state=${platform.state}&prompt=login`;

            localStorage.setItem("platformSlug", platform.slug);
            localStorage.setItem("redirectUri", platform.redirect_uri);

            window.location.href = oauthUrl;
        } catch (err) {
            setErrorDialog({
                show: true,
                title: "Error",
                message: "Failed to initiate integration",
            });
        }
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950 p-4 md:p-8">
            {/* Success Dialog */}
            <AlertDialog open={successDialog.show} onOpenChange={(val) => setSuccessDialog({ ...successDialog, show: val })}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary dark:text-gray-100">{successDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">{successDialog.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setSuccessDialog({ ...successDialog, show: false })} className="dark:bg-gray-100 dark:text-gray-900">
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Dialog */}
            <AlertDialog open={errorDialog.show} onOpenChange={(val) => setErrorDialog({ ...errorDialog, show: val })}>
                <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive dark:text-red-400">{errorDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-wrap dark:text-gray-400">{errorDialog.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setErrorDialog({ ...errorDialog, show: false })} className="dark:bg-gray-100 dark:text-gray-900">
                            Try Again
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Available CRMS to Connect</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your business integrations and settings</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        {isLoading ? (
                            <Card className="border-2 border-gray-100 dark:border-gray-800 h-full dark:bg-gray-800/50">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                <Skeleton className="w-6 h-6 rounded-md dark:bg-gray-700" />
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="h-6 w-3/4 dark:bg-gray-700" />
                                                <Skeleton className="h-4 w-full dark:bg-gray-700" />
                                                <Skeleton className="h-4 w-2/3 dark:bg-gray-700" />
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-5 w-20 rounded-full dark:bg-gray-700" />
                                                    <Skeleton className="h-5 w-24 rounded-full dark:bg-gray-700" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full dark:bg-gray-700" />
                                </CardContent>
                            </Card>
                        ) : platforms.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-medium">No integrations available at the moment.</div>
                        ) : (
                            platforms.map((platform) => (
                                <Card
                                    key={platform.id}
                                    className="border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 group h-full"
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg dark:text-gray-100">{platform.name} Integration</CardTitle>
                                                    <CardDescription className="mt-2 text-gray-500 dark:text-gray-400">
                                                        {platform.description || `Connect your ${platform.name} account to enable automation features.`}
                                                    </CardDescription>
                                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                        <span className="inline-block px-2.5 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full text-xs font-medium text-green-700 dark:text-green-400">
                                                            Status: {platform.status}
                                                        </span>
                                                        {platform.is_connected && (
                                                            <span className="px-2.5 py-1 bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-400 rounded-full flex items-center gap-1.5 text-xs font-medium">
                                                                <Check className="w-3.5 h-3.5" />
                                                                Connected
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleIntegrate(platform)}
                                            disabled={isIntegrating || platform.is_connected}
                                            className={`gap-2 ${platform.is_connected
                                                ? "bg-green-500/50 text-white cursor-not-allowed"
                                                : "bg-black dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200"
                                                } font-semibold transition-all duration-200`}
                                        >
                                            <Zap className="w-4 h-4" />
                                            {platform.is_connected ? "Already Integrated" : `Integrate ${platform.name} Account`}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
