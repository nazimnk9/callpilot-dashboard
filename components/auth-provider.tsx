"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService, cookieUtils } from "@/services/auth-service";
import { profileService } from "@/services/profile-service";

interface AuthContextType {
    isAuthenticated: boolean | null;
    isLoading: boolean;
    userStatus: any | null;
    refreshStatus: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: null,
    isLoading: true,
    userStatus: null,
    refreshStatus: async () => { },
    logout: () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userStatus, setUserStatus] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    const checkAuth = async () => {
        const accessToken = cookieUtils.get("access");
        const refreshToken = cookieUtils.get("refresh");

        // Public routes that don't need auth check
        const isPublicRoute = pathname === "/login" || pathname === "/forgot-password" || pathname === "/forgot-password-verify";

        if (!accessToken || !refreshToken) {
            setIsAuthenticated(false);
            setIsLoading(false);
            if (!isPublicRoute && pathname === "/") {
                router.push("/login");
            }
            setIsLoading(false);
            return;
        }

        try {
            const verifyRes = await authService.verifyToken(accessToken);
            if (verifyRes.ok) {
                const statusRes = await profileService.getPlatformStatus();
                const statusData = statusRes.data;
                setUserStatus(statusData);
                setIsAuthenticated(true);

                // Redirection logic
                if (!statusData.is_given_company_details && pathname.startsWith("/dashboard")) {
                    router.push("/activation");
                } else if (statusData.is_given_company_details && (pathname === "/" || pathname === "/activation" || pathname === "/login")) {
                    router.push("/dashboard");
                    // Keep loading true while redirecting to dashboard from home
                    if (pathname === "/") return;
                }
            } else {
                // Try refresh
                const refreshRes = await authService.refreshToken(refreshToken);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    cookieUtils.set("access", data.access, 7);
                    cookieUtils.set("refresh", data.refresh, 7);

                    const statusRes = await profileService.getPlatformStatus();
                    setUserStatus(statusRes.data);
                    setIsAuthenticated(true);

                    if (!statusRes.data.is_given_company_details && pathname.startsWith("/dashboard")) {
                        router.push("/activation");
                    } else if (statusRes.data.is_given_company_details && (pathname === "/" || pathname === "/activation" || pathname === "/login")) {
                        router.push("/dashboard");
                        if (pathname === "/") return;
                    }
                } else {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    if (!isPublicRoute) {
                        router.push("/login");
                        return;
                    }
                }
            }
        } catch (err) {
            console.error("Auth check failed:", err);
            setIsAuthenticated(false);
            setIsLoading(false);
            if (!isPublicRoute) {
                router.push("/login");
                return;
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []); // Run once on mount

    const refreshStatus = async () => {
        try {
            const statusRes = await profileService.getPlatformStatus();
            setUserStatus(statusRes.data);
        } catch (err) {
            console.error("Failed to refresh status", err);
        }
    };

    const logout = () => {
        cookieUtils.set('access', '', -1);
        cookieUtils.set('refresh', '', -1);
        setIsAuthenticated(false);
        setUserStatus(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userStatus, refreshStatus, logout }}>
            {isLoading ? (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-950">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
                        {/* <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading your account...</p> */}
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
