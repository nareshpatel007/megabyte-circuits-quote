"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthToken, getAuthUser, setAuthSession, clearAuthSession, setLogoutReason } from "@/lib/auth";
import { onAuthError } from "@/lib/apiClient";

const PROTECTED_ROUTES = [
    "/dashboard",
    "/orders",
    "/cart",
    "/checkout",
    "/gerber-files",
    "/payments",
    "/account",
    "/addresses",
    "/notifications",
    "/quote"
];

interface AuthContextType {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    accountStatus: string | null;
    statusMessage: string | null;
    isStatusModalOpen: boolean;
    validateSession: (force?: boolean) => Promise<boolean>;
    handleAccountStatusFailure: (code: string, message: string) => void;
    logoutAndRedirect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<any | null>(() => getAuthUser());
    const [token, setToken] = useState<string | null>(() => getAuthToken());
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [accountStatus, setAccountStatus] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);

    // Single-flight validation promise lock & timestamp
    const inFlightPromiseRef = useRef<Promise<boolean> | null>(null);
    const lastValidatedRef = useRef<number>(0);
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

    // Centralized Account Status Failure Handler
    const handleAccountStatusFailure = useCallback((code: string, message: string) => {
        console.warn(`[AuthContext] Account status restriction triggered: ${code} - ${message}`);
        setAccountStatus(code);
        setStatusMessage(message);
        setIsStatusModalOpen(true);
        setIsAuthenticated(false);
        setUser(null);

        setLogoutReason({ code, message });
        clearAuthSession();

        // Broadcast to all other open tabs
        if (typeof window !== "undefined" && broadcastChannelRef.current) {
            try {
                broadcastChannelRef.current.postMessage({
                    type: "ACCOUNT_STATUS_CHANGED",
                    code,
                    message,
                });
            } catch (e) {
                // Ignore broadcast error
            }
        }
    }, []);

    // Session Validation Function (Backend Source of Truth)
    const validateSession = useCallback(async (force: boolean = false): Promise<boolean> => {
        const currentToken = getAuthToken();
        if (!currentToken) {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false);
            return false;
        }

        // Return in-flight promise if validation is already executing
        if (inFlightPromiseRef.current) {
            return inFlightPromiseRef.current;
        }

        // Short-lived throttle (3 seconds) unless forced by page navigation
        const now = Date.now();
        if (!force && now - lastValidatedRef.current < 3000 && isAuthenticated) {
            setIsLoading(false);
            return true;
        }

        const validationPromise = (async () => {
            try {
                const res = await fetch("/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${currentToken}`,
                        Accept: "application/json",
                    },
                });

                const data = await res.json().catch(() => null);

                if (res.ok && data && (data.success || data.authenticated)) {
                    const updatedUser = data.user || data.data;
                    setUser(updatedUser);
                    setToken(currentToken);
                    setIsAuthenticated(true);
                    setAccountStatus("active");
                    setStatusMessage(null);
                    setAuthSession(currentToken, updatedUser);
                    lastValidatedRef.current = Date.now();
                    return true;
                }

                // Handle status failure response (401 or 403 or success: false)
                const code = data?.code || (res.status === 403 ? "ACCOUNT_SUSPENDED" : "TOKEN_EXPIRED");
                const message = data?.message || "Your session is invalid.";

                if (code.startsWith("ACCOUNT_") || code === "AUTH_REQUIRED") {
                    handleAccountStatusFailure(code, message);
                } else {
                    // Normal token expiry
                    clearAuthSession();
                    setIsAuthenticated(false);
                    setUser(null);
                }

                return false;
            } catch (err) {
                console.error("[AuthContext] Session validation error:", err);
                return true; // Keep optimistic state on temporary offline error
            } finally {
                inFlightPromiseRef.current = null;
                setIsLoading(false);
            }
        })();

        inFlightPromiseRef.current = validationPromise;
        return validationPromise;
    }, [isAuthenticated, handleAccountStatusFailure]);

    // Logout and redirect handler
    const logoutAndRedirect = useCallback(() => {
        setIsStatusModalOpen(false);
        setAccountStatus(null);
        setStatusMessage(null);
        clearAuthSession();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);

        if (typeof window !== "undefined") {
            const redirectUrl = encodeURIComponent(pathname || "/dashboard");
            router.push(`/login?redirect=${redirectUrl}`);
        }
    }, [pathname, router]);

    // 1. Initial Mount Validation
    useEffect(() => {
        validateSession(true);
    }, [validateSession]);

    // 2. Protected Route Navigation Guard
    useEffect(() => {
        const isProtected = PROTECTED_ROUTES.some((route) =>
            pathname === route || pathname?.startsWith(`${route}/`)
        );

        if (isProtected) {
            const currentToken = getAuthToken();
            if (!currentToken) {
                const redirectUrl = encodeURIComponent(pathname || "/dashboard");
                router.push(`/login?redirect=${redirectUrl}`);
            } else {
                validateSession(true);
            }
        }
    }, [pathname, router, validateSession]);

    // 3. API Interceptor Error Listener
    useEffect(() => {
        const unsubscribe = onAuthError(({ code, message }) => {
            if (code.startsWith("ACCOUNT_")) {
                handleAccountStatusFailure(code, message);
            }
        });
        return unsubscribe;
    }, [handleAccountStatusFailure]);

    // 4. Multi-Tab Synchronization via BroadcastChannel
    useEffect(() => {
        if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

        const channel = new BroadcastChannel("megabyte_auth_channel");
        broadcastChannelRef.current = channel;

        channel.onmessage = (event) => {
            if (event.data?.type === "ACCOUNT_STATUS_CHANGED") {
                const { code, message } = event.data;
                console.warn("[AuthContext] Multi-tab account status change received:", code);
                setAccountStatus(code);
                setStatusMessage(message);
                setIsStatusModalOpen(true);
                setIsAuthenticated(false);
                setUser(null);
                clearAuthSession();
            }
        };

        return () => {
            channel.close();
            broadcastChannelRef.current = null;
        };
    }, []);

    // 5. SSE Real-Time Account Status Listener
    useEffect(() => {
        if (!isAuthenticated || !user?.id || typeof window === "undefined") return;

        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource(`/api/notifications/stream?user_id=${user.id}`);

            eventSource.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data?.type === "account_status_changed") {
                        handleAccountStatusFailure(data.code || "ACCOUNT_SUSPENDED", data.message);
                    }
                } catch (err) {
                    // Ignore SSE parse error
                }
            };

            eventSource.onerror = () => {
                // EventSource auto-reconnects
            };
        } catch (err) {
            // Ignore SSE connection error
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [isAuthenticated, user?.id, handleAccountStatusFailure]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isLoading,
                accountStatus,
                statusMessage,
                isStatusModalOpen,
                validateSession,
                handleAccountStatusFailure,
                logoutAndRedirect,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
