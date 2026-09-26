"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft, Loader2, UserCheck } from "lucide-react";
import { getAuthUser, getAuthToken, getImpersonationSession, clearAuthSession } from "@/lib/auth";

export default function ImpersonationBanner() {
    const [impersonation, setImpersonation] = useState<{
        active: boolean;
        admin_id?: number | string;
        admin_name?: string;
        session_id?: number | string;
    } | null>(null);
    const [user, setUser] = useState<any>(null);
    const [stopping, setStopping] = useState(false);

    const checkImpersonationState = () => {
        const session = getImpersonationSession();
        const currentUser = getAuthUser();
        setImpersonation(session);
        setUser(currentUser);
    };

    useEffect(() => {
        checkImpersonationState();

        // Also query /api/auth/me if logged in to be 100% sure of backend impersonation state
        const token = getAuthToken();
        if (token) {
            const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/megabyte-circuits/megabyte-circuits-api/public";
            const backendUrl = rawBackendUrl.replace(/\/+$/, "");
            fetch(`${backendUrl}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status || data.success) {
                        if (data.impersonation && data.impersonation.active) {
                            setImpersonation(data.impersonation);
                            if (typeof localStorage !== "undefined") {
                                localStorage.setItem("megabyte_impersonation", JSON.stringify(data.impersonation));
                            }
                        } else {
                            // If backend says not impersonating, clear local impersonation flag
                            if (typeof localStorage !== "undefined") {
                                localStorage.removeItem("megabyte_impersonation");
                            }
                            setImpersonation(null);
                        }
                    } else if (data.code === 'IMPERSONATION_EXPIRED' || data.code === 'IMPERSONATION_ENDED') {
                        // Session expired or ended on backend
                        clearAuthSession();
                        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000";
                        window.location.href = `${adminUrl}/clients?expired=true`;
                    }
                })
                .catch(() => {
                    // Ignore network error on background me check
                });
        }

        const handleAuthUpdate = () => checkImpersonationState();
        window.addEventListener("megabyte_auth_updated", handleAuthUpdate);
        window.addEventListener("storage", handleAuthUpdate);

        return () => {
            window.removeEventListener("megabyte_auth_updated", handleAuthUpdate);
            window.removeEventListener("storage", handleAuthUpdate);
        };
    }, []);

    if (!impersonation || !impersonation.active) {
        return null;
    }

    const clientDisplayName = user?.name || user?.email || "Client";
    const adminDisplayName = impersonation.admin_name || "Megabyte Admin";

    const handleReturnToAdmin = async () => {
        setStopping(true);
        try {
            const token = getAuthToken();
            const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/megabyte-circuits/megabyte-circuits-api/public";
            const backendUrl = rawBackendUrl.replace(/\/+$/, "");
            const res = await fetch(`${backendUrl}/api/auth/impersonation/stop`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : ""
                },
                body: JSON.stringify({ session_id: impersonation.session_id })
            });

            const data = await res.json();
            clearAuthSession();

            const adminUrl = data.admin_redirect_url || process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000/clients";
            window.location.href = adminUrl;

        } catch (err) {
            console.error("Stop impersonation error:", err);
            clearAuthSession();
            const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000/clients";
            window.location.href = adminUrl;
        } finally {
            setStopping(false);
        }
    };

    return (
        <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-xl border-b border-amber-400/40 px-4 py-2.5 transition-all">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-950/40 border border-amber-300/40 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse" />
                    </div>
                    <div>
                        <div className="font-extrabold flex items-center gap-2">
                            <span>⚠ You are logged in as Client:</span>
                            <span className="underline decoration-amber-300 underline-offset-2 font-black">{clientDisplayName}</span>
                        </div>
                        <div className="text-amber-100/90 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                            <span>Admin Actor:</span>
                            <strong className="text-white font-bold">{adminDisplayName}</strong>
                            <span className="opacity-75">· Admin Impersonation Session Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={handleReturnToAdmin}
                        disabled={stopping}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-amber-950 hover:bg-black text-amber-200 border border-amber-400/40 transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                        {stopping ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Returning...
                            </>
                        ) : (
                            <>
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Return to Admin
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
