"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { setAuthSession, setImpersonationSession } from "@/lib/auth";

function ImpersonateHandoffContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Exchanging security handoff token...");

    useEffect(() => {
        const code = searchParams.get("code");
        if (!code) {
            setStatus("error");
            setMessage("Missing impersonation handoff code.");
            return;
        }

        const exchangeCode = async () => {
            try {
                const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/megabyte-circuits/megabyte-circuits-api/public";
                const backendUrl = rawBackendUrl.replace(/\/+$/, "");
                const res = await fetch(`${backendUrl}/api/auth/impersonate/exchange`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code })
                });

                const data = await res.json();
                if (data.status || data.success) {
                    const token = data.data?.access_token;
                    const userObj = data.data?.user;
                    const impersonationData = data.data?.impersonation;

                    if (!token || !userObj) {
                        setStatus("error");
                        setMessage("Invalid response received during token exchange.");
                        return;
                    }

                    // Save session
                    setAuthSession(token, userObj);
                    if (impersonationData) {
                        setImpersonationSession(impersonationData);
                    }

                    window.dispatchEvent(new Event("megabyte_auth_updated"));
                    setStatus("success");
                    setMessage(`Logged in as client: ${userObj.name || userObj.email}`);

                    setTimeout(() => {
                        router.push("/dashboard");
                    }, 500);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Failed to exchange impersonation code. The link may have expired or already been used.");
                }
            } catch (err: any) {
                console.error("Exchange error:", err);
                setStatus("error");
                setMessage("Network error connecting to authentication server.");
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                </div>

                {status === "loading" && (
                    <div className="py-6 space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                        </div>
                        <h2 className="text-lg font-bold">{message}</h2>
                        <p className="text-xs text-slate-400">Verifying single-use authorization handoff...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="py-6 space-y-4">
                        <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black text-emerald-400">Admin Impersonation Ready</h2>
                        <p className="text-xs text-slate-300">{message}</p>
                        <p className="text-xs text-slate-500 animate-pulse">Redirecting to Dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="py-6 space-y-5">
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-rose-400">Impersonation Failed</h2>
                            <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                                {message}
                            </div>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                            <span>Return to Login</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ImpersonateHandoffPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-amber-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        }>
            <ImpersonateHandoffContent />
        </Suspense>
    );
}
